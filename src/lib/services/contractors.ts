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
  projects?: Array<{
    projectId: string;
    projectName: string;
    taskId: string;
    taskName: string;
    hours: number;
    approvalStatus?: string;
  }>;
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

  // Get projects for looking up names
  const projectsSnapshot = await getDocs(collection(db, 'projects'));
  const projects = new Map(projectsSnapshot.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() }]));

  // Get approvals for the pay run period
  const approvalsRef = collection(db, 'approvals');
  const approvalsQuery = query(
    approvalsRef,
    where('startDate', '>=', format(parseISO(payRun.PayRunPeriodStartDate), 'yyyy-MM-dd')),
    where('endDate', '<=', format(parseISO(payRun.PayRunPeriodEndDate), 'yyyy-MM-dd'))
  );
  const approvalsSnapshot = await getDocs(approvalsQuery);
  const approvals = approvalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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

    // Group entries by project and task
    const projectHours = new Map();
    contractorEntries.forEach(entry => {
      const project = projects.get(entry.projectId);
      if (!project) return;

      const task = project.tasks?.find(t => t.id === entry.taskId);
      if (!task) return;

      // Find approval status for this project/user combination
      const approval = approvals.find(a => 
        a.project?.id === entry.projectId && 
        a.userId === entry.userId
      );

      let approvalStatus = project.requiresApproval
        ? approval?.status || 'pending'
        : 'not required';

      const key = `${entry.projectId}_${entry.taskId}`;
      if (!projectHours.has(key)) {
        projectHours.set(key, {
          projectId: entry.projectId,
          projectName: project.name,
          taskId: entry.taskId,
          taskName: task.name,
          approvalStatus,
          hours: 0
        });
      }
      const current = projectHours.get(key);
      current.hours += entry.hours;
    });

    const payslip = payRun.Payslips.find(slip => 
      slip.EmployeeID === contractor.xeroEmployeeId
    );

    return {
      userId: contractor.id,
      name: contractor.name,
      xeroEmployeeId: contractor.xeroEmployeeId,
      hours: totalHours,
      payslipId: payslip?.PayslipID,
      projects: Array.from(projectHours.values())
        .sort((a, b) => b.hours - a.hours)
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