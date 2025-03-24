import { httpsCallable } from 'firebase/functions';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, functions } from '@/lib/firebase';
import { format, parseISO } from 'date-fns';
import type { User, PayRun, TimeEntry } from '@/types';

interface ContractorHours {
  userId: string;
  name: string;
  xeroEmployeeId: string;
  hours: number;
  payslipId?: string;
}

export async function getContractorHours(payRun: PayRun): Promise<ContractorHours[]> {
  // Get all users
  const usersSnapshot = await getDocs(collection(db, 'users'));
  const users = usersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as User[];

  // Find contractors who have payslips in this pay run
  const contractors = users.filter(user => 
    user.employeeType === 'contractor' && 
    user.xeroEmployeeId && 
    payRun.Payslips.some(slip => slip.EmployeeID === user.xeroEmployeeId)
  );

  if (!contractors.length) return [];

  // Get time entries for these contractors
  const timeEntriesRef = collection(db, 'timeEntries');
  const q = query(
    timeEntriesRef,
    where('date', '>=', format(parseISO(payRun.PayRunPeriodStartDate), 'yyyy-MM-dd')),
    where('date', '<=', format(parseISO(payRun.PayRunPeriodEndDate), 'yyyy-MM-dd')),
    where('userId', 'in', contractors.map(c => c.id))
  );

  const timeEntriesSnapshot = await getDocs(q);
  const timeEntries = timeEntriesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as TimeEntry[];

  // Calculate hours for each contractor
  return contractors.map(contractor => {
    const contractorEntries = timeEntries.filter(entry => 
      entry.userId === contractor.id
    );
    
    const totalHours = contractorEntries.reduce((sum, entry) => 
      sum + entry.hours, 0
    );

    const payslip = payRun.Payslips.find(slip => 
      slip.EmployeeID === contractor.xeroEmployeeId
    );

    return {
      userId: contractor.id,
      name: contractor.name,
      xeroEmployeeId: contractor.xeroEmployeeId,
      hours: totalHours,
      payslipId: payslip?.PayslipID
    };
  });
}

export async function updateContractorPayslip(payslipId: string, hours: number): Promise<void> {
  try {
    // Get the contractor ordinary hours earnings rate ID from Xero config
    const configDoc = await getDocs(collection(db, 'config'));
    const config = configDoc.docs[1].data();
    
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