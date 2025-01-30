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
  const auth = getAuth();
  const idToken = await auth.currentUser.getIdToken(true);
  const functions = getFunctions();
  const tempPassword = generatePassword();

  // Create the user in Firebase Auth
  var userCredential;
  const email = data.email;

  const createUser = httpsCallable(functions, "createUser");
  try {
    userCredential = await createUser({ email, tempPassword });
    console.log("User created successfully:", userCredential.data.uid);
  } catch (error) {
    console.error("Error creating user:", error.message);
  }

  // Create the user document in Firestore
  const userRef = doc(db, COLLECTION, userCredential.data.uid);
  const user: User = {
    id: userCredential.data.uid,
    ...data,
    teamId: data.teamId === 'none' ? undefined : data.teamId,
    projectAssignments: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  // Remove sell rate if it exists in data
  if ('sellRate' in user) {
    delete user.sellRate;
  }

  try {
    await setDoc(userRef, user);
  } catch (error) {
    console.error("Error setting document:", error.code, error.message);
    throw error;
  }

  // Send password reset email
  await sendPasswordResetEmail(auth, data.email);

  return user;
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