import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import type { XeroConfig } from '@/types';
import type { PayRun } from '@/types';

/**
 * Gets all pay runs from Firestore
 */
export async function getPayRuns(): Promise<PayRun[]> {
  const payRunsRef = collection(db, 'xeroPayRuns');
  const payRunsSnapshot = await getDocs(payRunsRef);
  return payRunsSnapshot.docs.map(doc => ({ 
    ...doc.data(),
    PayRunID: doc.id 
  } as PayRun));
}

/**
 * Updates a payslip with contractor hours
 */
export async function updatePayslip({ payslipId, hours }: { payslipId: string; hours: number }): Promise<void> {
  try {
    // Get the contractor ordinary hours earnings rate ID from Xero config
    const configDoc = await getDoc(doc(db, 'config', 'xero_config'));
    if (!configDoc.exists()) {
      throw new Error('Xero config not found');
    }
    
    const config = configDoc.data() as XeroConfig;
    
    if (!config.contractorOrdinaryHoursEarningsId) {
      throw new Error('Contractor ordinary hours earnings rate not configured');
    }
    
    const updatePayslipFunction = httpsCallable(functions, 'updatePayslip');
    await updatePayslipFunction({ 
      payslipId,
      earningsRateId: config.contractorOrdinaryHoursEarningsId,
      numberOfUnits: hours
    });
  } catch (error) {
    console.error('Error updating contractor payslip:', error);
    throw error;
  }
}