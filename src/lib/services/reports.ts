import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, parseISO } from 'date-fns';
import { getWorkingDaysInPeriod } from '@/lib/utils/date';
import { getFunctions, httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { useUsers } from '@/lib/hooks/useUsers';
import type { 
  ReportFilters, 
  ReportData, 
  ReportEntry, 
  OvertimeReportData,
  Project,
  User,
  TimeEntry,
  Approval
} from '@/types';

export async function generateReport(filters: ReportFilters): Promise<ReportData | OvertimeReportData> {
  if (filters.type === 'overtime') {
    return generateOvertimeReport(filters);
  }

  // Get time entries
  const timeEntriesQuery = query(
    collection(db, 'timeEntries'),
    where('date', '>=', filters.startDate),
    where('date', '<=', filters.endDate)
  );

  // Get all required data
  let [timeEntriesSnapshot, projectsSnapshot, usersSnapshot, clientsSnapshot, approvalsSnapshot] = await Promise.all([
    getDocs(timeEntriesQuery),
    getDocs(collection(db, 'projects')), 
    getDocs(collection(db, 'users')), 
    getDocs(collection(db, 'clients')),
    getDocs(collection(db, 'approvals'))
  ]);

  // Create lookup maps
  let projects = new Map(projectsSnapshot.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() }]));
  let users = new Map(usersSnapshot.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() }]));
  let clients = new Map(clientsSnapshot.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() }]));
  const approvals = approvalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // If teamId filter is present, filter users to only team members
  if (filters.teamId) {
    const teamUsers = Array.from(users.values()).filter(user => user.teamId === filters.teamId);
    const teamUserIds = new Set(teamUsers.map(user => user.id));
    users = new Map(teamUsers.map(user => [user.id, user]));

    // Filter projects to only those with tasks assigned to team members
    const teamProjects = Array.from(projects.values()).filter(project =>
      project.tasks?.some(task =>
        task.userAssignments?.some(assignment => teamUserIds.has(assignment.userId))
      )
    );
    projects = new Map(teamProjects.map(project => [project.id, project]));
  }

  // Helper function to get cost rate for a specific date
  const getCostRateForDate = (user: User, date: string): number => {
    if (!user.costRate || user.costRate.length === 0) return 0;
    
    // Sort cost rates by date descending
    const sortedRates = [...user.costRate].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // Find the first rate that is less than or equal to the entry date
    const applicableRate = sortedRates.find(rate => 
      new Date(rate.date) <= new Date(date)
    );
    
    return applicableRate?.costRate || 0;
  };
  // Filter and transform time entries
  const entries: ReportEntry[] = timeEntriesSnapshot.docs
    .map(doc => {
      const entry = doc.data();
      
      // Apply user filter
      if (filters.userId && entry.userId !== filters.userId) return null;

      // Apply project filter 
      if (filters.projectId && entry.projectId !== filters.projectId) return null;

      const project = projects.get(entry.projectId);
      const projectTask = project?.tasks?.find(r => r.id === entry.taskId);
      const client = clients.get(entry.clientId);
      const user = users.get(entry.userId);
      
      if (!project || !projectTask || !client || !user) return null;

      // Get applicable sell rate for the entry date
      const sellRate = projectTask.billable ? (() => {
        if (!projectTask.sellRates?.length) return 0;
        
        const entryDate = new Date(entry.date);
        let applicableRate = null;
        
        // Find the most recent rate that was active on the entry date
        for (const rate of projectTask.sellRates) {
          const rateDate = new Date(rate.date);
          if (rateDate <= entryDate && (!applicableRate || rateDate > new Date(applicableRate.date))) {
            applicableRate = rate;
          }
        }
        
        return applicableRate?.sellRate || 0;
      })() : 0;
      
      // Only include revenue if task is billable
      const isBillable = projectTask.billable;

      // For cost rate, use task's cost rate if available and not 0, otherwise use user's historical cost rate
      const costRate = projectTask?.costRate > 0 ? projectTask.costRate : getCostRateForDate(user, entry.date);
      
      const hours = entry.hours || 0;
      const cost = hours * costRate;
      const revenue = hours * sellRate;
      const profit = revenue - cost;

      // Get approval status
      let approvalStatus = project.requiresApproval 
        ? 'No Approval'
        : 'Approval Not Required';

      if (project.requiresApproval) {
        const approval = approvals.find(a => 
          a.project?.id === project.id &&
          parseISO(a.startDate) <= parseISO(entry.date) &&
          parseISO(a.endDate) >= parseISO(entry.date)
        );
        if (approval) {
          approvalStatus = approval.status;
        }
      }

      return {
        id: doc.id,
        date: entry.date,
        userName: user.name,
        clientName: client.name,
        projectName: project.name,
        taskName: projectTask.name,
        approvalStatus,
        hours,
        cost,
        revenue,
        profit: revenue - cost
      };
    })
    .filter(Boolean) as ReportEntry[];

  // Calculate summary
  const summary = entries.reduce((acc, entry) => ({
    totalHours: acc.totalHours + entry.hours,
    totalCost: acc.totalCost + entry.cost,
    totalRevenue: acc.totalRevenue + entry.revenue,
    profitMargin: 0 // Calculated below
  }), {
    totalHours: 0,
    totalCost: 0,
    totalRevenue: 0,
    profitMargin: 0
  });

  // Add approvals to response for debugging
  const filteredApprovals = approvals.filter(approval => {
    const approvalStart = parseISO(approval.startDate);
    const approvalEnd = parseISO(approval.endDate);
    const filterStart = parseISO(filters.startDate);
    const filterEnd = parseISO(filters.endDate);
    return approvalStart <= filterEnd && approvalEnd >= filterStart;
  });

  // Calculate profit margin
  summary.profitMargin = summary.totalRevenue > 0
    ? Math.round(((summary.totalRevenue - summary.totalCost) / summary.totalRevenue) * 100)
    : 0;

  return {
    entries: entries.sort((a, b) => a.date.localeCompare(b.date)),
    summary,
    approvals: filteredApprovals
  };
}

export async function checkOvertimeSubmission(month: string): Promise<boolean> {
  const submissionRef = doc(db, 'overtimeSubmissions', month);
  const submissionDoc = await getDoc(submissionRef);
  return submissionDoc.exists();
}

export async function submitOvertime(
  data: OvertimeReportData, 
  startDate: string, 
  endDate: string, 
  month: string,
  payRunId: string
): Promise<void> {
    // First check if already submitted
    const submissionRef = collection(db, 'overtimeSubmissions');
    const q = query(
      submissionRef,
      where('submissionMonth', '==', month)
    );
    
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      throw new Error('Overtime has already been submitted for this month');
    }
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs;
    const overtimeEntries = data.entries.map(entry => ({
      ...entry,
      xeroEmployeeId: users.find(u => u.id === entry.userId)?.data().xeroEmployeeId,
    }));

    // Call Firebase function to process overtime
    const functions = getFunctions();
    const processOvertime = httpsCallable(functions, 'processOvertime');
    await processOvertime({ 
      overtimeEntries: overtimeEntries,
      startDate,
      endDate,
      payRunId
    });
}

async function generateOvertimeReport(filters: ReportFilters): Promise<OvertimeReportData> {
  // Get all required data
  const [usersSnapshot, timeEntriesSnapshot, projectsSnapshot, approvalsSnapshot] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(query(
      collection(db, 'timeEntries'),
      where('date', '>=', filters.startDate),
      where('date', '<=', filters.endDate)
    )),
    getDocs(collection(db, 'projects')),
    getDocs(
      collection(db, 'approvals'),
      where('startDate', '=', filters.startDate),
      where('endDate', '=', filters.endDate))
  ]);

  // Create lookup maps
  const users = new Map(usersSnapshot.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() }]));
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
  const periodStart = parseISO(filters.startDate);
  const periodEnd = parseISO(filters.endDate);
  const workingDays = getWorkingDaysInPeriod(periodStart, periodEnd);

  // Group time entries by user and week
  const userProjectHours = new Map<string, Map<string, number>>();
  const userOvertimeHours = new Map<string, Map<string, number>>();
  const userTotalHours = new Map<string, number>();

  // Process each time entry
  timeEntries.forEach(entry => {
    const user = users.get(entry.userId) as User;
    const project = projects.get(entry.projectId) as Project;
    const entryDate = parseISO(entry.date);
    
    if (!user || !project || user.overtime === 'no') return null;

    // For eligible overtime, only include overtime-inclusive projects
    if (user.overtime === 'eligible' && !project.overtimeInclusive) return null;

    // Get approval status for projects requiring approval
    let approvalStatus = 'unsubmitted';
    if (project.requiresApproval) {
      const approval = approvals.find(a => 
        a.project.id === project.id &&
        a.userId === user.id &&
        parseISO(a.startDate) <= entryDate &&
        parseISO(a.endDate) >= entryDate
      );
      if (approval) {
        approvalStatus = approval.status;
      }
    }

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
  const entries = Array.from(users.values())
    .filter(user => user.overtime !== 'no')
    .map(user => {
      // Calculate standard hours
      const standardMonthlyHours = (user.hoursPerWeek || 40) * (workingDays / 5);
      const totalHours = userTotalHours.get(user.id) || 0;
      const userOvertimeHours = Math.max(0, totalHours - standardMonthlyHours);
      
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
              a.userId === user.id &&
              parseISO(a.startDate) <= parseISO(filters.startDate) &&
              parseISO(a.endDate) >= parseISO(filters.endDate)
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
        hoursPerWeek: user.hoursPerWeek,
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
      totalUsers: entries.length
    }
  };
}