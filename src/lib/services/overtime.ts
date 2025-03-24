import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db, functions } from '@/lib/firebase';
import { format, parseISO } from 'date-fns';
import { getWorkingDaysInPeriod } from '@/lib/utils/date';
import { httpsCallable } from 'firebase/functions';
import type { OvertimeReportData, TimeEntry, Approval, User, Project, PayRun } from '@/types';

export async function generateOvertimeReport(payRun: PayRun): Promise<OvertimeReportData> {
  // Get all users
  const usersSnapshot = await getDocs(collection(db, 'users'));
  const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];

  // Find employees who have payslips in this pay run
  const employees = users.filter(user => 
    user.employeeType === 'employee' && 
    user.xeroEmployeeId && 
    payRun.Payslips.some(slip => slip.EmployeeID === user.xeroEmployeeId)
  );

  if (!employees.length) {
    return {
      entries: [],
      summary: {
        totalOvertimeHours: 0,
        totalUsers: 0
      }
    };
  }

  // Get all required data in parallel
  const [timeEntriesSnapshot, projectsSnapshot, approvalsSnapshot] = await Promise.all([
    getDocs(query(
      collection(db, 'timeEntries'),
      where('date', '>=', format(parseISO(payRun.PayRunPeriodStartDate), 'yyyy-MM-dd')),
      where('date', '<=', format(parseISO(payRun.PayRunPeriodEndDate), 'yyyy-MM-dd')),
      where('userId', 'in', employees.map(e => e.id))
    )),
    getDocs(collection(db, 'projects')),
    getDocs(query(
      collection(db, 'approvals'),
      where('startDate', '>=', format(parseISO(payRun.PayRunPeriodStartDate), 'yyyy-MM-dd')),
      where('endDate', '<=', format(parseISO(payRun.PayRunPeriodEndDate), 'yyyy-MM-dd'))
    ))
  ]);

  // Create lookup maps
  const projects = new Map(projectsSnapshot.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() }]));
  const timeEntries = timeEntriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TimeEntry[];
  const approvals = approvalsSnapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data(),
    startDate: doc.data().startDate,
    endDate: doc.data().endDate,
    project: doc.data().project,
    userId: doc.data().userId
  })) as Approval[];

  // Calculate working days in the period
  const periodStart = parseISO(payRun.PayRunPeriodStartDate);
  const periodEnd = parseISO(payRun.PayRunPeriodEndDate);
  const workingDays = getWorkingDaysInPeriod(periodStart, periodEnd);

  // Group time entries by user and project
  const userProjectHours = new Map<string, Map<string, number>>();
  const userTotalHours = new Map<string, number>();

  // Process each time entry
  timeEntries.forEach(entry => {
    const user = users.find(u => u.id === entry.userId);
    const project = projects.get(entry.projectId);
    
    // Skip if: no user, no project, user is not an employee, or user has no overtime
    if (!user || !project || user.employeeType !== 'employee' || user.overtime === 'no') return;

    // For eligible overtime, only include overtime-inclusive projects
    if (user.overtime === 'eligible' && !project.overtimeInclusive) return;

    // Track total hours for the user
    userTotalHours.set(user.id, (userTotalHours.get(user.id) || 0) + entry.hours);

    // Track project hours
    if (!userProjectHours.has(user.id)) {
      userProjectHours.set(user.id, new Map());
    }
    const projectHours = userProjectHours.get(user.id);
    projectHours.set(project.id, (projectHours.get(project.id) || 0) + entry.hours);
  });

  // Calculate total overtime hours
  let totalOvertimeHours = 0;
  const entries = employees
    .filter(user => user.overtime !== 'no')
    .map(user => {
      // Calculate standard hours
      const standardHours = (user.hoursPerWeek || 40) * (workingDays / 5);
      const totalHours = userTotalHours.get(user.id) || 0;
      const userOvertimeHours = Math.max(0, totalHours - standardHours);
      
      const projectHours = userProjectHours.get(user.id) || new Map();
      const projectHoursTotal = Array.from(projectHours.values())
        .reduce((sum, hours) => sum + hours, 0);

      totalOvertimeHours += userOvertimeHours;

      // Calculate project overtime hours proportionally
      const projectOvertimeEntries = Array.from(projectHours.entries())
        .map(([projectId, hours]) => {
          const project = projects.get(projectId);
          const projectOvertimeHours = (hours / projectHoursTotal) * userOvertimeHours;
          
          // Get approval status for this project
          let approvalStatus = 'unsubmitted';
          if (project?.requiresApproval) {
            const approval = approvals.find(a => 
              a.project.id === projectId &&
              a.userId === user.id
            );
            if (approval) {
              approvalStatus = approval.status;
            }
          }
          
          return {
            projectId,
            projectName: project?.name || 'Unknown Project',
            hours,
            overtimeHours: projectOvertimeHours,
            requiresApproval: project?.requiresApproval || false,
            approvalStatus: project?.requiresApproval ? approvalStatus : 'not required'
          };
        })
        .sort((a, b) => b.hours - a.hours);

      return {
        userId: user.id,
        userName: user.name,
        overtimeType: user.overtime,
        hoursPerWeek: user.hoursPerWeek || 40,
        totalHours,
        overtimeHours: userOvertimeHours,
        projects: projectOvertimeEntries
      };
    })
    .filter(entry => entry.overtimeHours > 0)
    .sort((a, b) => b.overtimeHours - a.overtimeHours);

  return {
    entries,
    summary: {
      totalOvertimeHours,
      totalUsers: entries.length,
      workingDays
    }
  };
}

export async function checkOvertimeSubmission(payRunId: string): Promise<boolean> {
  const submissionRef = doc(db, 'overtimeSubmissions', payRunId);
  const submissionDoc = await getDoc(submissionRef);
  return submissionDoc.exists();
}

export async function submitOvertime(
  data: OvertimeReportData, 
  payRunId: string
): Promise<void> {
  // First check if already submitted
  const submissionRef = collection(db, 'overtimeSubmissions');
  const q = query(
    submissionRef,
    where('payRunId', '==', payRunId)
  );
  
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    throw new Error('Overtime has already been submitted for this pay run');
  }

  // Get all users
  const usersSnapshot = await getDocs(collection(db, 'users'));
  const users = usersSnapshot.docs;
  const overtimeEntries = data.entries.map(entry => ({
    ...entry,
    xeroEmployeeId: users.find(u => u.id === entry.userId)?.data().xeroEmployeeId,
  }));

  // Call Firebase function to process overtime
  const processOvertime = httpsCallable(functions, 'processOvertime');
  await processOvertime({ 
    overtimeEntries: overtimeEntries,
    payRunId
  });
}