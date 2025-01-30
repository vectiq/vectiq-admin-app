import { collection, getDocs, query, where, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '@/lib/firebase';
import { format, eachDayOfInterval, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import type {
  ProcessingData,
  ProcessingProject,
  TimeEntry,
  Approval,
  XeroInvoiceResponse
} from '@/types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

async function getProjectTimeEntries(projectId: string, month: string): Promise<TimeEntry[]> {
  const startDate = `${month}-01`;
  const endDate = format(endOfMonth(parseISO(startDate)), 'yyyy-MM-dd');

  const timeEntriesRef = collection(db, 'timeEntries');
  const q = query(
    timeEntriesRef,
    where('projectId', '==', projectId),
    where('date', '>=', startDate),
    where('date', '<=', endDate)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as TimeEntry[];
}

interface XeroInvoiceLineItem {
  Description: string;
  Quantity: number;
  UnitAmount: number;
  AccountCode: string;
  Tracking?: Array<{
    Name: string;
    Option: string;
  }>;
}

interface XeroInvoice {
  Type: string;
  Reference: string;
  Contact: {
    ContactID: string;
  };
  LineItems: XeroInvoiceLineItem[];
}

interface XeroInvoiceResponse {
  Id: string;
  Status: string;
  ProviderName: string;
  DateTimeUTC: string;
  Invoices: Array<{
    InvoiceID: string;
    Type: string;
    InvoiceNumber: string;
    Reference: string;
    AmountDue: number;
    AmountPaid: number;
    Status: string;
  }>;
}

interface ProjectStatus {
  projectId: string;
  month: string;
  status: 'not started' | 'draft' | 'sent';
  updatedAt: any;
}

export async function updateProjectStatus(
  projectId: string,
  month: string,
  status: 'not started' | 'draft' | 'sent'
): Promise<void> {
  const statusId = `${projectId}_${month}`;
  const statusRef = doc(db, 'projectStatuses', statusId);

  await setDoc(statusRef, {
    projectId,
    month,
    status,
    updatedAt: serverTimestamp()
  });
}

async function generateTimesheetPDF(project: ProcessingProject, month: string): Promise<string> {
  // Fetch all time entries for the project in this month
  const timeEntries = await getProjectTimeEntries(project.id, month);

  // Create new PDF document
  const doc = new jsPDF();

  // Set title
  doc.setFontSize(16);
  doc.text(`${project.name} - Timesheet Report`, 14, 15);
  doc.setFontSize(12);
  doc.text(`${project.clientName}`, 14, 22);
  doc.text(`Month: ${format(new Date(month + '-01'), 'MMMM yyyy')}`, 14, 29);
  doc.text(`Purchase Order: ${project.purchaseOrderNumber || 'N/A'}`, 14, 36);

  // Get all days in the month
  const startDate = parseISO(`${month}-01`);
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  let yOffset = 45;

  // Group assignments by user
  const userEntries = new Map();
  timeEntries.forEach(entry => {
    const assignment = project.assignments.find(a =>
      a.userId === entry.userId && a.taskId === entry.taskId
    );
    if (!assignment) return;

    if (!userEntries.has(entry.userId)) {
      userEntries.set(entry.userId, {
        userName: assignment.userName,
        entries: []
      });
    }
    userEntries.get(entry.userId).entries.push({
      date: entry.date,
      taskName: assignment.taskName,
      hours: entry.hours
    });
  });

  // For each user
  userEntries.forEach((userData, userId) => {
    // Add user name as section header
    doc.setFontSize(14);
    doc.text(userData.userName, 14, yOffset);
    yOffset += 10;

    // Sort entries by date
    const sortedEntries = userData.entries.sort((a, b) => a.date.localeCompare(b.date));

    // Create table headers
    const headers = [
      ['Date', 'Task', 'Hours']
    ];

    // Create table data
    const data = sortedEntries.map(entry => [
      format(parseISO(entry.date), 'MMM d, yyyy'),
      entry.taskName,
      entry.hours.toFixed(1)
    ]);

    // Add user total row
    const userTotal = sortedEntries.reduce((sum, entry) => sum + entry.hours, 0);
    data.push([
      '',
      'Total',
      userTotal.toFixed(1)
    ]);

    // Add table
    (doc as any).autoTable({
      startY: yOffset,
      head: headers,
      body: data,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 66, 66] },
      margin: { left: 14 },
      foot: [['', 'Total', userTotal.toFixed(1)]],
      footStyles: { fontStyle: 'bold' }
    });

    // Update yOffset for next section
    yOffset = (doc as any).lastAutoTable.finalY + 15;

    // Add page if needed
    if (yOffset > 250) {
      doc.addPage();
      yOffset = 20;
    }
  });

  // Add totals
  doc.setFontSize(12);
  doc.text(`Total Hours: ${project.totalHours.toFixed(1)}`, 14, yOffset);

  const base64 = doc.output('datauristring');
  console.log('PDF generated:', base64);
  return base64.split(",")[1];
}

/**
 * Generates a Xero invoice for a project's time entries and attaches a detailed timesheet PDF.
 * This is the main function that should be called to create invoices.
 */
export async function generateInvoice(project: ProcessingProject): Promise<XeroInvoiceResponse> {
  const functions = getFunctions();
  const createInvoice = httpsCallable<{ invoiceData: XeroInvoice }, XeroInvoiceResponse>(
    functions,
    'createXeroInvoice'
  );

  try {
    const functions = getFunctions();
    const createXeroInvoice = httpsCallable<{ invoiceData: XeroInvoice }, XeroInvoiceResponse>(
      functions,
      'createXeroInvoice'
    );

    // Create a map of task details for quick lookup
    const taskMap = new Map(project.tasks?.map(task => [task.id, task]));

    // Group assignments by user and task
    const userTaskHours = new Map<string, Map<string, {
      hours: number;
      taskName: string;
      sellRate: number;
    }>>();

    project.assignments.forEach(assignment => {
      const task = taskMap.get(assignment.taskId);
      if (!task) return;

      if (!userTaskHours.has(assignment.userId)) {
        userTaskHours.set(assignment.userId, new Map());
      }
      const userTasks = userTaskHours.get(assignment.userId)!;

      const key = assignment.taskId;
      const existing = userTasks.get(key);

      if (existing) {
        existing.hours += assignment.hours;
      } else {
        userTasks.set(key, {
          hours: assignment.hours,
          taskName: assignment.taskName,
          sellRate: task.sellRate || 0
        });
      }
    });

    // Create line items for each user's tasks
    const lineItems: XeroInvoiceLineItem[] = [];
    userTaskHours.forEach((tasks, userId) => {
      const user = project.assignments.find(a => a.userId === userId);
      if (!user) return;

      tasks.forEach((taskData, taskId) => {
        lineItems.push({
          Description: `${taskData.taskName} - ${user.userName} - ${project.purchaseOrderNumber || ''}`,
          Quantity: taskData.hours,
          UnitAmount: taskData.sellRate,
          AccountCode: "200"
        });
      });
    });

    const invoice: XeroInvoice = {
      Type: "ACCREC",
      Reference: project.purchaseOrderNumber || '',
      Contact: {
        ContactID: project.xeroContactId || ''
      },
      LineItems: lineItems
    };

    // First create the invoice in Xero
    const response = await createInvoiceInXero(project);
    const invoiceId = response.Invoices?.[0]?.InvoiceID;

    if (!invoiceId) {
      throw new Error('No invoice ID returned from Xero');
    }

    // Generate and attach the detailed timesheet PDF
    const pdf = await generateTimesheetPDF(project, format(new Date(), 'yyyy-MM'));

    const addAttachment = httpsCallable(functions, 'addXeroInvoiceAttachment');

    await addAttachment({
      invoiceId,
      attachmentData: pdf, // Convert Uint8Array to regular array for function call
      attachmentName: `${project.name}-timesheet-${format(new Date(), 'yyyy-MM')}.pdf`
    });

    // Return both the invoice response and the PDF data for debugging
    return {
      ...response,
      pdfData: pdf
    };
  } catch (error) {
    console.error('Error creating Xero invoice:', error);
    throw error;
  }
}

/**
 * Creates an invoice in Xero with line items for each user's tasks.
 * This is an internal helper function used by generateInvoice.
 */
async function createInvoiceInXero(project: ProcessingProject): Promise<XeroInvoiceResponse> {
  const functions = getFunctions();
  const createInvoice = httpsCallable<{ invoiceData: XeroInvoice }, XeroInvoiceResponse>(
    functions,
    'createXeroInvoice'
  );

  // Create line items grouped by user and task
  const lineItems = await generateInvoiceLineItems(project);

  const invoice = {
    Type: "ACCREC",
    Reference: project.purchaseOrderNumber || '',
    Contact: {
      ContactID: project.xeroContactId || ''
    },
    LineItems: lineItems
  };

  const response = await createInvoice({ invoiceData: invoice });
  return response.data;
}

/**
 * Generates line items for a Xero invoice by grouping hours by user and task.
 * This is an internal helper function used by createInvoiceInXero.
 */
async function generateInvoiceLineItems(project: ProcessingProject): Promise<XeroInvoiceLineItem[]> {
  const taskMap = new Map(project.tasks?.map(task => [task.id, task]));
  const teamsSnapshot = await getDocs(collection(db, 'teams'));
  const teams = new Map(teamsSnapshot.docs.map(doc => [doc.id, doc.data().name]));
  const userTaskHours = new Map<string, Map<string, {
    hours: number;
    taskName: string;
    sellRate: number;
    teamId?: string;
  }>>();

  // Group hours by user and task
  project.assignments.forEach(assignment => {
    const task = taskMap.get(assignment.taskId);
    if (!task) return;

    if (!userTaskHours.has(assignment.userId)) {
      userTaskHours.set(assignment.userId, new Map());
    }
    const userTasks = userTaskHours.get(assignment.userId)!;

    const key = assignment.taskId;
    const existing = userTasks.get(key);

    if (existing) {
      existing.hours += assignment.hours;
    } else {
      userTasks.set(key, {
        hours: assignment.hours,
        taskName: assignment.taskName,
        sellRate: task.sellRate || 0,
        teamId: task.teamId
      });
    }
  });

  // Convert grouped data to line items
  const lineItems: XeroInvoiceLineItem[] = [];
  userTaskHours.forEach((tasks, userId) => {
    const user = project.assignments.find(a => a.userId === userId);
    if (!user) return;

    tasks.forEach((taskData) => {
      const lineItem: XeroInvoiceLineItem = {
        Description: `${taskData.taskName} - ${user.userName} - ${project.purchaseOrderNumber || ''}`,
        Quantity: taskData.hours,
        UnitAmount: taskData.sellRate,
        AccountCode: "200"
      };

      // Add tracking if task has a team
      if (taskData.teamId && teams.has(taskData.teamId)) {
        lineItem.Tracking = [{
          Name: "Business Unit",
          Option: teams.get(taskData.teamId)!
        }];
      }

      lineItems.push(lineItem);
    });
  });

  return lineItems;
}

export async function getProcessingData(month: string): Promise<ProcessingData> {
  // Get start and end dates for the month
  const startDate = `${month}-01`;
  const endDate = `${month}-31`;

  // Fetch all required data in parallel
  const [timeEntriesSnapshot, projectsSnapshot, clientsSnapshot, usersSnapshot, approvalsSnapshot, statusesSnapshot] =
    await Promise.all([
      // Get time entries for the month
      getDocs(query(
        collection(db, 'timeEntries'),
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      )),
      getDocs(collection(db, 'projects')),
      getDocs(collection(db, 'clients')),
      getDocs(collection(db, 'users')),
      // Get approvals for the month
      getDocs(query(
        collection(db, 'approvals'),
        where('startDate', '==', startDate),
        where('endDate', '==', endDate)
      )),
      getDocs(collection(db, 'projectStatuses'))
    ]);

  // Create lookup maps
  const clients = new Map(clientsSnapshot.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() }]));
  const users = new Map(usersSnapshot.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() }]));
  const projects = new Map(projectsSnapshot.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() }]));

  // Create map of project statuses for the month
  const statusMap = new Map();
  statusesSnapshot.docs.forEach(doc => {
    const status = doc.data() as ProjectStatus;
    if (status.month === month) {
      statusMap.set(status.projectId, status.status);
    }
  });

  // Create map of approvals by project and user
  const approvalMap = new Map();
  approvalsSnapshot.docs.forEach(doc => {
    const approval = doc.data() as Approval;
    const key = `${approval.project?.id}_${approval.userId}`;
    approvalMap.set(key, approval);
  });

  // Get time entries and group by project
  const timeEntries = timeEntriesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as TimeEntry[];

  // Group time entries by project
  const entriesByProject = new Map<string, TimeEntry[]>();
  timeEntries.forEach(entry => {
    const entries = entriesByProject.get(entry.projectId) || [];
    entries.push(entry);
    entriesByProject.set(entry.projectId, entries);
  });

  // Process each project that has time entries
  const processedProjects = Array.from(projects.values())
    .filter(project => entriesByProject.has(project.id))
    .map(project => {
      const client = clients.get(project.clientId);
      const projectEntries = entriesByProject.get(project.id) || [];
      const projectData = projects.get(project.id);

      // Group entries by user and task
      const assignmentMap = new Map<string, {
        userId: string;
        userName: string;
        taskId: string;
        taskName: string;
        hours: number;
        approvalStatus: string;
      }>();

      projectEntries.forEach(entry => {
        const user = users.get(entry.userId);
        const task = project.tasks?.find(t => t.id === entry.taskId);

        if (!user || !task) return;

        // Get approval status for this user's entries
        const approvalKey = `${project.id}_${user.id}`;
        const approval = approvalMap.get(approvalKey);

        // Determine approval status based on project settings
        let approvalStatus = 'No Approval Required';
        if (projectData?.requiresApproval) {
          approvalStatus = approval ? approval.status : 'unsubmitted';
        }

        const key = `${entry.userId}-${entry.taskId}`;
        const existing = assignmentMap.get(key);

        if (existing) {
          existing.hours += entry.hours;
        } else {
          assignmentMap.set(key, {
            userId: user.id,
            userName: user.name,
            taskId: task.id,
            taskName: task.name,
            hours: entry.hours,
            approvalStatus
          });
        }
      });

      // Get assignments and total hours
      const assignments = Array.from(assignmentMap.values());
      const totalHours = assignments.reduce((sum, a) => sum + a.hours, 0);

      return {
        id: project.id,
        name: project.name,
        clientId: project.clientId,
        clientName: client?.name || 'Unknown Client',
        totalHours,
        purchaseOrderNumber: project.purchaseOrderNumber,
        xeroContactId: project.xeroContactId,
        tasks: project.tasks,
        requiresApproval: projectData?.requiresApproval || false,
        invoiceStatus: statusMap.get(project.id) || 'not started',
        priority: totalHours > 100 ? 'high' : 'normal',
        hasSpecialHandling: project.requiresApproval,
        type: assignments.length === 1 ? 'labor_hire' : 'team',
        assignments
      } as ProcessingProject;
    });

  // Calculate summary statistics
  const summary = {
    totalProjects: processedProjects.length,
    approvedTimesheets: processedProjects.reduce((count, project) => {
      // Only count projects that require approval
      if (!project.requiresApproval) return count;

      // Count total assignments requiring approval
      const totalAssignments = project.assignments.length;

      // Count approved assignments
      const approvedAssignments = project.assignments.filter(
        a => a.approvalStatus === 'approved'
      ).length;

      // Only increment if all assignments are approved
      return count + (totalAssignments === approvedAssignments ? 1 : 0);
    }, 0),
    totalRequiringApproval: processedProjects.filter(p => p.requiresApproval).length,
    generatedInvoices: processedProjects.filter(p => p.invoiceStatus === 'sent').length,
    urgentItems: processedProjects.filter(p => p.priority === 'high').length
  };

  return {
    projects: processedProjects,
    summary
  };
}