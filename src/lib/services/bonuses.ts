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
  serverTimestamp
} from 'firebase/firestore';
import { db, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
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

export async function processXeroBonus(bonus: Bonus, payslipId: string, payItemId: string): Promise<void> {
  const processBonus = httpsCallable(functions, 'processBonus');

  try {
    const { data } = await processBonus({
      payslipId,
      payItemId,
      bonusAmount: bonus.amount
    }) as { data: { payRunId: string } };

    // Update single bonus as paid
    const bonusRef = doc(db, COLLECTION, bonus.id);
    await updateDoc(bonusRef, {
      paid: true,
      paidAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error processing bonus:', error);
    throw error;
  }
}