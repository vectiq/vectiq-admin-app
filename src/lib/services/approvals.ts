import {
  collection,
  doc,
  getDoc,
  updateDoc,
  writeBatch,
  getDocs,
  query,
  where,
  setDoc,
  serverTimestamp,
  orderBy,
  limit,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import { formatTimesheetBreakdown } from '@/lib/utils/timesheet';
import type { TimeEntry, Project, Client, Approval, ApprovalStatus } from '@/types';
import CryptoJS from 'crypto-js';

interface ApprovalRequest {
  project: Project;
  client: Client;
  dateRange: {
    start: Date;
    end: Date;
  };
  entries: TimeEntry[];
  userId: string;
}

export async function getApprovals(
  userId: string
): Promise<Approval[]> {
  if (!userId) return [];
  const approvalsRef = collection(db, 'approvals');
  const q = query(
    approvalsRef,
    where('userId', '==', userId),
  );
  
  const snapshot = await getDocs(q);
  let approvals = snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    submittedAt: doc.data().submittedAt,
    approvedAt: doc.data().approvedAt,
    rejectedAt: doc.data().rejectedAt,
    withdrawnAt: doc.data().withdrawnAt,
  })) as Approval[];

  return approvals;
}

export async function getApprovalDetails(approvalId: string) {
  const approvalRef = doc(db, 'approvals', approvalId);
  const approvalDoc = await getDoc(approvalRef);
  
  if (!approvalDoc.exists()) {
    throw new Error('Approval not found');
  }
  
  return {
    ...approvalDoc.data(),
    id: approvalDoc.id
  };
}

export async function withdrawApproval(approvalId: string) {
  const approvalRef = doc(db, 'approvals', approvalId);
  await updateDoc(approvalRef, {
    status: 'withdrawn',
    withdrawnAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function submitTimesheetApproval(request: ApprovalRequest) {
  const { project, client, dateRange, entries, userId } = request;

  // Generate unique approval ID
  const approvalId = crypto.randomUUID();

  // Calculate total hours
  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);

  // Create approval document
  const approvalDoc: Approval = {
    id: approvalId,
    status: 'pending',
    submittedAt: new Date(),
    project,
    client,
    startDate: format(dateRange.start, 'yyyy-MM-dd'),
    endDate: format(dateRange.end, 'yyyy-MM-dd'),
    totalHours,
    userId,
    approverEmail: project.approverEmail,
  };

  // Save approval document
  await setDoc(doc(db, 'approvals', approvalId), approvalDoc);

  // Generate approval URLs
  const baseUrl = import.meta.env.VITE_FIREBASE_API_URL;
  const rejectUrl = import.meta.env.VITE_APP_URL + '/reject?id=' + approvalId;
  const approveUrl = `${baseUrl}/approveTimesheet?id=${approvalId}&action=approve`;

  // Format dates for email
  const startDate = format(dateRange.start, 'MMM d, yyyy');
  const endDate = format(dateRange.end, 'MMM d, yyyy');

  // Get tasks from project
  const tasks = project.tasks.map(task => ({
    id: task.id,
    name: task.name
  }));

  // Generate timesheet breakdown table
  const timesheetTable = formatTimesheetBreakdown(entries, tasks.map(task => ({
    id: task.id,
    name: task.name
  })));

  // Get user details
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    throw new Error('User not found');
  }

  const user = userDoc.data();

  // Prepare email content
  const emailHtml = `
      <h2>Timesheet Approval Request</h2>
      <p>A timesheet has been submitted for your approval by ${user.name}:</p>
      
      <ul>
        <li><strong>Client:</strong> ${client.name}</li>
        <li><strong>Project:</strong> ${project.name}</li>
        <li><strong>Period:</strong> ${startDate} - ${endDate}</li>
        <li><strong>Total Hours:</strong> ${totalHours.toFixed(2)}</li>
      </ul>
  
      <h3 style="margin-top: 24px;">Time Entry Details</h3>
      
      ${timesheetTable}
  
      <div style="margin: 30px 0;">
        <a href="${approveUrl}" style="background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 12px;">
          Approve Timesheet
        </a>
        <a href="${rejectUrl}" style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Reject Timesheet
        </a>
      </div>
  
      <p style="color: #666; font-size: 14px;">
        If the buttons don't work, you can copy and paste these links into your browser:
        <br>Approve: ${approveUrl}
        <br>Reject: ${rejectUrl}
      </p>
    `;

  // Send approval email
  const functions = getFunctions();
  const sendEmail = httpsCallable(functions, 'sendEmail');
  await sendEmail({
    recipient: project.approverEmail,
    subject: `Timesheet Approval Required: ${client.name} - ${project.name} (Submitted by ${user.name})`,
    body: emailHtml,
    type: 'Timesheet approval',
    token: generateToken(import.meta.env.VITE_EMAIL_SECRET)
  });

  return approvalId;
}

function generateToken(secret) {
  const timestamp = Date.now().toString();
  const data = `${timestamp}:${secret}`;
  const hash = CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);
  return `${hash}:${timestamp}`;
}

export async function rejectTimesheet(approval) {
  const approvalRef = doc(db, 'approvals', approval.id);
  await updateDoc(approvalRef, {
    status: 'rejected',
    rejectionReason: approval.comments,
    rejectedAt: new Date(),
  });

  // Get user details
  const userRef = doc(db, 'users', approval.userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    throw new Error('User not found');
  }

  const user = userDoc.data();
  const startDate = format(new Date(approval.startDate), 'MMM d, yyyy');
  const endDate = format(new Date(approval.endDate), 'MMM d, yyyy');

  // Prepare rejection email
  const emailHtml = `
      <h2>Timesheet Rejected</h2>
      <p>Your timesheet has been rejected for the following period:</p>
      
      <ul>
        <li><strong>Client:</strong> ${approval.client.name}</li>
        <li><strong>Project:</strong> ${approval.project.name}</li>
        <li><strong>Period:</strong> ${startDate} - ${endDate}</li>
        <li><strong>Total Hours:</strong> ${approval.totalHours.toFixed(2)}</li>
      </ul>

      <div style="margin: 24px 0; padding: 16px; background: #fef2f2; border: 1px solid #fee2e2; border-radius: 6px;">
        <h3 style="margin: 0 0 8px 0; color: #991b1b;">Rejection Reason:</h3>
        <p style="margin: 0; color: #991b1b;">${approval.comments}</p>
      </div>

      <p>Please review the feedback and submit an updated timesheet.</p>
    `;

  // Send rejection email
  const functions = getFunctions();
  const sendEmail = httpsCallable(functions, 'sendEmail');
  await sendEmail({
    recipient: user.email,
    subject: `Timesheet Rejected: ${approval.client.name} - ${approval.project.name}`,
    body: emailHtml,
    type: 'Timesheet rejection',
    token: generateToken(import.meta.env.VITE_EMAIL_SECRET)
  });
}