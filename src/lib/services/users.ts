import { format } from 'date-fns';
import {
  collection,
  doc,
  writeBatch,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  getAuth,
} from 'firebase/auth';
import { db } from '@/lib/firebase';
import { generatePassword } from '@/lib/utils/password';
import { calculateCostRate } from '@/lib/utils/costRate';
import type { User, ProjectAssignment } from '@/types';

const COLLECTION = 'users';

// User Operations
export async function getUsers(): Promise<User[]> {
  // Get all users
  const usersSnapshot = await getDocs(collection(db, COLLECTION));
  const users = usersSnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id
  }));

  return users as User[];
}

// Get the current user
export async function getCurrentUser(): Promise<User | null> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    return null;
  }

  const userRef = doc(db, COLLECTION, user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    return null;
  }
  
  const userData = userDoc.data();
  return {
    id: user.uid,
    ...userData,
    projectAssignments: userData.projectAssignments || [],
  } as User;
}

export async function createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
  // For potential staff, just create Firestore document
  if (data.isPotential) {
    const userRef = doc(collection(db, COLLECTION));
    const user: User = {
      id: userRef.id,
      ...data,
      email: '', // No email for potential staff
      projectAssignments: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(userRef, user);
    return user;
  }

  // For real users, create auth account and Firestore document
  const functions = getFunctions();
  const tempPassword = generatePassword();
  const createUser = httpsCallable(functions, "createUser");
  
  try {
    const result = await createUser({ email: data.email, tempPassword });
    const uid = result.data.uid;
    console.log("User created successfully:", uid);

    // Create the user document in Firestore
    const userRef = doc(db, COLLECTION, uid);
    const user: User = {
      id: uid,
      ...data,
      isPotential: data.isPotential || false,
      startDate: data.startDate || format(new Date(), 'yyyy-MM-dd'),
      teamId: data.teamId === 'none' ? undefined : data.teamId,
      projectAssignments: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Remove sell rate if it exists in data
    if ('sellRate' in user) {
      delete user.sellRate;
    }

    await setDoc(userRef, user);

    // Send password reset email
    const auth = getAuth();
    await sendPasswordResetEmail(auth, data.email);

    return user;
  } catch (error) {
    console.error("Error creating user:", error.message);
    throw error;
  }
}

async function getSystemConfig(): Promise<SystemConfig> {
  const configRef = doc(db, 'config', 'system_config');
  const configDoc = await getDoc(configRef);
  
  if (!configDoc.exists()) {
    throw new Error('System configuration not found');
  }
  
  return configDoc.data() as SystemConfig;
}

export async function updateUser(id: string, data: Partial<User>): Promise<void> {
  const userRef = doc(db, COLLECTION, id);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }
  
  const user = userDoc.data() as User;

  // Handle converting potential staff to regular staff
  if (user.isPotential && !data.isPotential && !data.email) {
    throw new Error('Email is required when converting potential staff to regular staff');
  }

  // Create Firebase auth user if converting from potential
  if (user.isPotential && !data.isPotential) {
    const functions = getFunctions();
    const tempPassword = generatePassword();
    const createUser = httpsCallable(functions, "createUser");

    try {
      const result = await createUser({ email: data.email, tempPassword });
      const newUid = result.data.uid;

      // Create new user document with auth UID
      const newUserRef = doc(db, COLLECTION, newUid);
      await setDoc(newUserRef, {
        ...user,
        ...data,
        id: newUid,
        isPotential: false,
        updatedAt: serverTimestamp()
      });

      // Delete old potential user document
      await deleteDoc(userRef);

      // Send password reset email
      const auth = getAuth();
      await sendPasswordResetEmail(auth, data.email);

      return;
    } catch (error) {
      console.error('Error converting potential user:', error);
      throw new Error('Failed to convert potential user to regular user');
    }
  }
  
  // If this is an employee and salary is being updated, recalculate cost rate
  if (user.employeeType === 'employee' && data.salary) {
    try {
      const config = await getSystemConfig();
      
      // Sort salary entries by date
      const sortedSalary = data.salary.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      // Calculate cost rates for each salary entry
      const newCostRates = sortedSalary.map(salaryEntry => {
        const costRate = calculateCostRate(salaryEntry.salary, config);
        return {
          costRate,
          date: salaryEntry.date // Use the same date as the salary entry
        };
      });
      
      // Merge with existing cost rates, keeping only the ones without matching dates
      const existingCostRates = user.costRate || [];
      const newDates = new Set(newCostRates.map(rate => rate.date));
      const filteredExistingRates = existingCostRates.filter(rate => !newDates.has(rate.date));
      
      // Combine and sort all cost rates
      data.costRate = [
        ...newCostRates,
        ...filteredExistingRates
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      if (newCostRates.length === 0) {
        throw new Error('No valid salary entries to calculate cost rates');
      }
    } catch (error) {
      console.error('Error calculating cost rate:', error);
      throw new Error('Failed to update cost rate');
    }
  }

  // Clean up teamId handling
  const updateData = {
    ...data,
    teamId: data.teamId === 'none' ? undefined : data.teamId,
    updatedAt: serverTimestamp(),
  };

  // Remove undefined values to prevent Firestore errors
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });
  await updateDoc(userRef, updateData);
}

export async function deleteUser(id: string): Promise<void> {
  const functions = getFunctions();
  const deleteUserFunction = httpsCallable(functions, 'deleteUser');

  // Delete the auth user first
  try {
    await deleteUserFunction({ userId: id });
  } catch (error) {
    console.error('Error deleting auth user:', error);
    throw error;
  }

  // Then delete the Firestore document
  const userRef = doc(db, COLLECTION, id);
  await deleteDoc(userRef);
}