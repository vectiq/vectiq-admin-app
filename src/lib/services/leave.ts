import { 
  collection,
  doc,
  getDocs, 
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase'; 
import type { Leave, XeroLeaveResponse, LeaveBalance } from '@/types';

const COLLECTION = 'employeeLeave';
const CACHE_TIME = 60 * 60 * 1000; // 1 hour in milliseconds
const functions = getFunctions();

function parseXeroDate(xeroDate: string): string {
  // Extract timestamp from "/Date(1234567890000+0000)/" format
  const timestamp = parseInt(xeroDate.match(/\d+/)[0]);
  return new Date(timestamp).toISOString();
}

function transformXeroLeave(xeroLeave: XeroLeaveResponse['LeaveApplications'][0]): Leave {
  // Get the first leave period for status and units
  const leavePeriod = xeroLeave.LeavePeriods[0];
  
  return {
    id: xeroLeave.LeaveApplicationID ?? '',
    employeeId: xeroLeave.EmployeeID ?? '',
    leaveTypeId: xeroLeave.LeaveTypeID ?? '',
    title: xeroLeave.Title ?? '',
    description: xeroLeave.Description ?? '',
    startDate: parseXeroDate(xeroLeave.StartDate ?? ''),
    endDate: parseXeroDate(xeroLeave.EndDate ?? ''),
    status: leavePeriod?.LeavePeriodStatus as Leave['status'] ?? 'Unknown',
    numberOfUnits: leavePeriod?.NumberOfUnits ?? 0,
    updatedAt: xeroLeave.UpdatedDateUTC ? parseXeroDate(xeroLeave.UpdatedDateUTC) : new Date().toISOString()
  };
}

async function getCachedLeave(userId: string): Promise<{ leave: Leave[]; leaveBalances: LeaveBalance[]; lastRefreshed: Date } | null> {
  const leaveDoc = await getDoc(doc(db, COLLECTION, userId));
  if (!leaveDoc.exists()) return null;

  const data = leaveDoc.data();
  const updatedAt = data.updatedAt?.toDate();
  
  // Check if cache is still valid (less than 1 hour old)
  if (updatedAt && Date.now() - updatedAt.getTime() < CACHE_TIME) {
    return {
      leave: data.leave,
      leaveBalances: data.leaveBalances,
      lastRefreshed: updatedAt
    };
  }
  
  return null;
}

// Get leave requests from Xero and sync to Firestore
export async function getLeave(forceRefresh = false): Promise<{ leave: Leave[]; leaveBalances: LeaveBalance[]; lastRefreshed: Date }> {
  const userId = auth.currentUser?.uid;
  if (!userId) return { leave: [], leaveBalances: [], lastRefreshed: new Date() };

  // Try cache first unless force refresh
    const cached = await getCachedLeave(userId);
    if (!forceRefresh) return cached;

  // Get user's Xero employee ID
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists() || !userDoc.data().xeroEmployeeId) {
    throw new Error('User not found or no Xero Employee ID set');
  }
  const xeroEmployeeId = userDoc.data().xeroEmployeeId;
  
  // Get leave from Xero
  const getXeroLeave = httpsCallable(functions, 'getLeave');
  const response = await getXeroLeave({ 
    employeeId: xeroEmployeeId
  });
  
  const xeroResponse = response.data as XeroLeaveResponse;
  const today = new Date().toISOString();
  const transformedLeave = xeroResponse.LeaveApplications 
    ? xeroResponse.LeaveApplications
        .filter(leave => parseXeroDate(leave.EndDate) >= today)
        .map(transformXeroLeave)
    : [];
  
  const now = new Date();
  
  // Sync with Firestore
  const employeeLeaveRef = doc(db, COLLECTION, userId);
  try {
    await setDoc(employeeLeaveRef, {
      leaveBalances: xeroResponse.LeaveBalances,
      userId,
      leave: transformedLeave || [],
      updatedAt: now
    });
  } catch (error) {
    console.error('Error updating Firestore:', error);
    throw new Error('Failed to update leave data');
  }
  
  return {
    leave: transformedLeave,
    leaveBalances: xeroResponse.LeaveBalances,
    lastRefreshed: now
  };
}

export async function createLeave(leaveData: Omit<Leave, 'id' | 'status' | 'xeroLeaveId'>): Promise<Leave> {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');
  
  // Get user's Xero employee ID
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists() || !userDoc.data().xeroEmployeeId) {
    throw new Error('User not found or no Xero Employee ID set');
  }
  const xeroEmployeeId = userDoc.data().xeroEmployeeId;

  // Create in Xero first
  const createXeroLeave = httpsCallable(functions, 'createLeave');
  const xeroResponse = await createXeroLeave({
    employeeId: xeroEmployeeId,
    startDate: leaveData.startDate,
    endDate: leaveData.endDate,
    leaveTypeId: leaveData.leaveTypeId,
    description: leaveData.description || ''
  });
  
  // Get updated leave from Xero
  const getXeroLeave = httpsCallable(functions, 'getLeave');
  const updatedLeave = await getXeroLeave();
  
  // Update Firestore
  const employeeLeaveRef = doc(db, COLLECTION, userId);
  await setDoc(employeeLeaveRef, {
    userId,
    leave: updatedLeave.data?.LeaveApplications ? updatedLeave.data.LeaveApplications.map(transformXeroLeave) : [],
    updatedAt: serverTimestamp()
  });

  return xeroResponse.data;
}

export async function updateLeave(id: string, data: Partial<Leave>): Promise<void> {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');
  
  // Get user's Xero employee ID
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists() || !userDoc.data().xeroEmployeeId) {
    throw new Error('User not found or no Xero Employee ID set');
  }
  const xeroEmployeeId = userDoc.data().xeroEmployeeId;

  // Update in Xero first
  const updateXeroLeave = httpsCallable(functions, 'updateLeave');
  await updateXeroLeave({ 
    employeeId: xeroEmployeeId,
    leaveId: id,
    leaveData: {
      startDate: data.startDate,
      endDate: data.endDate,
      leaveTypeId: data.leaveTypeId,
      description: data.description
    }
  });

  // Get updated leave from Xero
  const getXeroLeave = httpsCallable(functions, 'getLeave');
  const updatedLeave = await getXeroLeave();
  
  // Update Firestore
  const employeeLeaveRef = doc(db, COLLECTION, userId);
  await setDoc(employeeLeaveRef, {
    userId,
    leave: updatedLeave.data?.LeaveApplications ? updatedLeave.data.LeaveApplications.map(transformXeroLeave) : [],
    updatedAt: serverTimestamp()
  });
}

export async function deleteLeave(id: string): Promise<void> {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');
  
  // Get user's Xero employee ID
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists() || !userDoc.data().xeroEmployeeId) {
    throw new Error('User not found or no Xero Employee ID set');
  }
  const xeroEmployeeId = userDoc.data().xeroEmployeeId;

  // Delete from Xero first
  const deleteXeroLeave = httpsCallable(functions, 'deleteLeave');
  await deleteXeroLeave({ employeeId: xeroEmployeeId, leaveId: id });

  // Get updated leave from Xero
  const getXeroLeave = httpsCallable(functions, 'getLeave');
  const updatedLeave = await getXeroLeave();
  
  // Update Firestore
  const employeeLeaveRef = doc(db, COLLECTION, userId);
  await setDoc(employeeLeaveRef, {
    userId,
    leave: updatedLeave.data?.LeaveApplications ? updatedLeave.data.LeaveApplications.map(transformXeroLeave) : [],
    updatedAt: serverTimestamp()
  });
}