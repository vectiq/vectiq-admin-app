import { 
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PublicHoliday } from '@/types';

const COLLECTION = 'publicHolidays';

export async function getPublicHolidays(): Promise<PublicHoliday[]> {
  const q = query(
    collection(db, COLLECTION),
    orderBy('date', 'asc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as PublicHoliday[];
}

export async function addPublicHoliday(holiday: Omit<PublicHoliday, 'id'>): Promise<void> {
  const holidayRef = doc(collection(db, COLLECTION));
  await setDoc(holidayRef, {
    id: holidayRef.id,
    ...holiday,
    createdAt: serverTimestamp()
  });
}

export async function deletePublicHoliday(id: string): Promise<void> {
  const holidayRef = doc(db, COLLECTION, id);
  await deleteDoc(holidayRef);
}