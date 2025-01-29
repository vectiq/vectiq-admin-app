import {
  collection,
  doc,
  addDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import type { TimeEntry } from '@/types';

const COLLECTION = 'timeEntries';

export async function getTimeEntries(
  userId?: string,
  dateRange?: { start: Date; end: Date }
): Promise<TimeEntry[]> {
  const baseQuery = collection(db, COLLECTION);
  let constraints: any[] = [];

  // User filter is required
  if (!userId) return [];
  constraints.push(where('userId', '==', userId));

  // Add date range filters if provided
  if (dateRange) {
    const startDate = format(dateRange.start, 'yyyy-MM-dd');
    const endDate = format(dateRange.end, 'yyyy-MM-dd');
    constraints.push(
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
  }

  // Build query with all constraints
  const queryRef = query(
    baseQuery,
    ...constraints,
    orderBy('date', 'asc')
  );
  let snapshot;
  try {
    snapshot = await getDocs(queryRef);
  } catch (error) {
    console.error('Error fetching time entries:', error);
    return [];
  }
  const entries = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as TimeEntry[];
  return entries;
}

export async function createTimeEntry(entryData: Omit<TimeEntry, 'id'>): Promise<TimeEntry> {
  const entryRef = await addDoc(collection(db, COLLECTION), {
    ...entryData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const newEntry = {
    id: entryRef.id,
    ...entryData,
  };
  return newEntry;
}

export async function updateTimeEntry(id: string, data: Partial<TimeEntry>): Promise<void> {
  const entryRef = doc(db, COLLECTION, id);
  const updateData = {
    ...data,
    updatedAt: new Date().toISOString(),
  };
  await updateDoc(entryRef, updateData);
}

export async function deleteTimeEntry(id: string): Promise<void> {
  const entryRef = doc(db, COLLECTION, id);
  await deleteDoc(entryRef);
}