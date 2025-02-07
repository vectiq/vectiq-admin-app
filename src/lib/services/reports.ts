import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, parseISO } from 'date-fns';
import type { 
  ReportFilters, 
  ReportData, 
  ReportEntry,
  User
} from '@/types';

export async function generateReport(filters: ReportFilters): Promise<ReportData> {
  try {
    // Build query with date range filter
    let timeEntriesRef = collection(db, 'timeEntries');
    let constraints = [
      where('date', '>=', filters.startDate),
      where('date', '<=', filters.endDate)
    ];

    // Add team filter if specified
    if (filters.teamId) {
      constraints.push(where('teamId', '==', filters.teamId));
    }

    // Add user filter if specified
    if (filters.userId) {
      constraints.push(where('userId', '==', filters.userId));
    }

    // Add project filter if specified
    if (filters.projectId) {
      constraints.push(where('projectId', '==', filters.projectId));
    }

    const timeEntriesQuery = query(timeEntriesRef, ...constraints);

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

        // For cost rate, use task's cost rate if available and not 0, otherwise use user's historical cost rate
        const costRate = projectTask?.costRate > 0 ? projectTask.costRate : getCostRateForDate(user, entry.date);
        
        const hours = entry.hours || 0;
        const cost = hours * costRate;
        const revenue = hours * sellRate;

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

    // Initialize summary object
    const summary = {
      totalHours: 0,
      totalCost: 0,
      totalRevenue: 0,
      profitMargin: 0
    };

    // Calculate totals using standard loop
    for (const entry of entries) {
      summary.totalHours += entry.hours;
      summary.totalCost += entry.cost;
      summary.totalRevenue += entry.revenue;
    }

    // Calculate profit margin
    summary.profitMargin = summary.totalRevenue > 0
      ? Math.round(((summary.totalRevenue - summary.totalCost) / summary.totalRevenue) * 100)
      : 0;

    // Add approvals to response for debugging
    const filteredApprovals = approvals.filter(approval => {
      const approvalStart = parseISO(approval.startDate);
      const approvalEnd = parseISO(approval.endDate);
      const filterStart = parseISO(filters.startDate);
      const filterEnd = parseISO(filters.endDate);
      return approvalStart <= filterEnd && approvalEnd >= filterStart;
    });

    return {
      entries: entries.sort((a, b) => a.date.localeCompare(b.date)),
      summary,
      approvals: filteredApprovals
    };
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
}