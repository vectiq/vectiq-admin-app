import { 
  collection,
  doc,
  deleteDoc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { format } from 'date-fns';
import type { Bonus } from '@/types';

const COLLECTION = 'bonuses';

export async function getBonuses(month?: string): Promise<Bonus[]> {
  let q = collection(db, COLLECTION);
  
  if (month) {
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;

    q = query(
      q,
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc')
    );
  } else {
    // Get all bonuses, ordered by date
    q = query(q, orderBy('date', 'desc'));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Bonus[];
}

export async function createBonus(bonusData: Omit<Bonus, 'id'>): Promise<Bonus> {
  const bonusRef = doc(collection(db, COLLECTION));
  const bonus: Bonus = {
    id: bonusRef.id,
    ...bonusData,
    paid: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  await setDoc(bonusRef, bonus);
  return bonus;
}

export async function updateBonus(id: string, data: Partial<Bonus>): Promise<void> {
  const bonusRef = doc(db, COLLECTION, id);
  await updateDoc(bonusRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteBonus(id: string): Promise<void> {
  const bonusRef = doc(db, COLLECTION, id);
  await deleteDoc(bonusRef);
}

export async function processBonus(bonuses: Bonus[], payRunId: string, payItemId: string): Promise<void> {
  const functions = getFunctions();
  const processBonuses = httpsCallable(functions, 'processBonuses');

  // Get user documents to lookup Xero Employee IDs
  const userDocs = await Promise.all(
    bonuses.map(bonus => 
      getDoc(doc(db, 'users', bonus.employeeId))
    )
  );

  // Map user docs to get Xero Employee IDs
  const userXeroIds = new Map(
    userDocs.map((doc, index) => [
      bonuses[index].employeeId,
      doc.data()?.xeroEmployeeId
    ])
  );

  try {
    await processBonuses({
      payRunId,
      payItemId,
      bonuses: bonuses.map(bonus => ({
        bonusAmount: bonus.amount,
        xeroEmployeeId: userXeroIds.get(bonus.employeeId)
      }))
    });

    // Update all bonuses as paid
    const batch = writeBatch(db);
    bonuses.forEach(bonus => {
      const bonusRef = doc(db, COLLECTION, bonus.id);
      batch.update(bonusRef, {
        paid: true,
        xeroPayRunId: payRunId,
        xeroPayItemId: payItemId,
        paidAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('Error processing bonuses:', error);
    throw error;
  }
}