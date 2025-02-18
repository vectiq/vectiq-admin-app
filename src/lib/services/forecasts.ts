import { 
  collection,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ForecastOverride } from '@/types';

const COLLECTION = 'forecasts';

export async function getForecastDeltas(
  userId: string,
  month: string
): Promise<Record<string, ForecastOverride> | null> {

  const docRef = doc(db, COLLECTION, `${userId}_${month}`);
  const docSnap = await getDoc(docRef);
  
  
  if (!docSnap.exists()) {
    return null;
  }
  
  
  // Find document for this user
  const userDoc = docSnap.data();


  if (!userDoc) return null;

  return userDoc;
}

export async function saveForecastDelta(
  userId: string, 
  month: string, 
  field: string,
  value: number | null,
  rowUserId: string
): Promise<void> {
  const docRef = doc(db, COLLECTION, `${userId}_${month}`);
  const docSnap = await getDoc(docRef);

  if (value === null) {
    // If value matches dynamic value, remove the override
    const updateData = {
      [`${field}_${rowUserId}`]: null
    };
    
    if (docSnap.exists()) {
      await updateDoc(docRef, updateData);
    }
  } else {
    // Store the override with timestamp
    const updateData = {
      [`${field}_${rowUserId}`]: {
        value,
        updatedAt: new Date().toISOString()
      }
    };

    if (docSnap.exists()) {
      await updateDoc(docRef, updateData);
    } else {
      await setDoc(docRef, updateData);
    }
  }
}