import { doc, getDoc, setDoc, collection, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import type { SystemConfig, AdminStats, XeroConfig, FirestoreCollection, XeroPayItem, PublicHoliday, TestDataOptions } from '@/types';

const CONFIG_DOC = 'system_config';
const XERO_CONFIG_DOC = 'xero_config';

export async function getXeroConfig(): Promise<XeroConfig> {
  const configRef = doc(db, 'config', XERO_CONFIG_DOC);
  const configDoc = await getDoc(configRef);
  const payItemsSnapshot = await getDocs(collection(db, 'xeroPayItems'));
  const payItems = payItemsSnapshot.docs.map(doc => doc.data() as XeroPayItem);
  
  if (!configDoc.exists()) {
    return {
      clientId: '',
      tenantId: '',
      redirectUri: '',
      businessUnitTrackingCategoryId: '',
      overtimePayItemCode: '',
      ordinaryHoursEarningsId: '',
      scopes: [],
      payItems: []
    };
  }
  
  return {
    ...configDoc.data() as XeroConfig,
    payItems
  };
}

export async function updateXeroConfig(config: XeroConfig): Promise<void> {
  const configRef = doc(db, 'config', XERO_CONFIG_DOC);
  await setDoc(configRef, config);
}

export async function getSystemConfig(): Promise<SystemConfig> {
  const configRef = doc(db, 'config', CONFIG_DOC);
  const configDoc = await getDoc(configRef);
  
  if (!configDoc.exists()) {
    // Return default config if none exists
    return {
      defaultHoursPerWeek: 40,
      defaultOvertimeType: 'no',
      requireApprovalsByDefault: true,
      allowOvertimeByDefault: false,
      defaultBillableStatus: true
    };
  }
  
  return configDoc.data() as SystemConfig;
}

// Public Holidays
export async function getPublicHolidays(): Promise<PublicHoliday[]> {
  const snapshot = await getDocs(collection(db, 'publicHolidays'));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as PublicHoliday[];
}

export async function addPublicHoliday(holiday: Omit<PublicHoliday, 'id'>): Promise<void> {
  const holidayRef = doc(collection(db, 'publicHolidays'));
  await setDoc(holidayRef, {
    id: holidayRef.id,
    ...holiday,
    createdAt: serverTimestamp()
  });
}

export async function deletePublicHoliday(id: string): Promise<void> {
  const holidayRef = doc(db, 'publicHolidays', id);
  await deleteDoc(holidayRef);
}

export async function updateSystemConfig(config: SystemConfig): Promise<void> {
  const configRef = doc(db, 'config', CONFIG_DOC);
  await setDoc(configRef, config);
}

export async function getAdminStats(): Promise<AdminStats> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Get all required collections
  const [usersSnapshot, projectsSnapshot, timeEntriesSnapshot] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'projects')),
    getDocs(query(
      collection(db, 'timeEntries'),
      where('date', '>=', format(monthStart, 'yyyy-MM-dd')),
      where('date', '<=', format(monthEnd, 'yyyy-MM-dd'))
    ))
  ]);

  // Calculate stats
  const totalUsers = usersSnapshot.size;
  const totalProjects = projectsSnapshot.size;
  
  let totalHours = 0;
  let billableHours = 0;
  
  // Create a map of project tasks for billable status lookup
  const projectTasks = new Map();
  projectsSnapshot.docs.forEach(doc => {
    const project = doc.data();
    project.tasks?.forEach(task => {
      projectTasks.set(`${project.id}_${task.id}`, task.billable);
    });
  });

  // Calculate hours
  timeEntriesSnapshot.docs.forEach(doc => {
    const entry = doc.data();
    const hours = entry.hours || 0;
    totalHours += hours;
    
    // Check if the task is billable
    const taskKey = `${entry.projectId}_${entry.taskId}`;
    if (projectTasks.get(taskKey)) {
      billableHours += hours;
    }
  });

  // Calculate utilization (billable hours / total hours)
  const averageUtilization = totalHours > 0 
    ? Math.round((billableHours / totalHours) * 100)
    : 0;

  return {
    totalUsers,
    totalProjects,
    totalHoursThisMonth: totalHours,
    totalBillableHours: billableHours,
    averageUtilization
  };
}

export async function generateTestData(options: TestDataOptions): Promise<void> {
  const batch = writeBatch(db);
  
  try {
    // Get all active projects with their assignments
    const projectsRef = collection(db, 'projects');
    const projectsSnapshot = await getDocs(projectsRef);
    const projects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Generate time entries for each project assignment
    for (const project of projects.filter(p => p.isActive)) {
      // Get client ID for the project
      const clientId = project.clientId;
      if (!clientId) continue;

      for (const task of project.tasks || []) {
        // Skip inactive tasks
        if (!task.isActive) continue;

        for (const assignment of task.userAssignments || []) {
          // Skip inactive assignments
          if (!assignment.isActive) continue; 

          // Generate entries for each day in the range
          const start = new Date(options.startDate);
          const end = new Date(options.endDate);

          const now = new Date().toISOString();

          for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
            // Skip weekends
            if (date.getDay() === 0 || date.getDay() === 6) continue;

            // Random hours between 1 and max daily hours
            const hours = Math.random() * (options.maxDailyHours - 1) + 1;
            const roundedHours = Math.round(hours * 10) / 10;

            const entryRef = doc(collection(db, 'timeEntries'));
            batch.set(entryRef, {
              id: entryRef.id,
              isTestData: true,
              hours: roundedHours,
              taskId: task.id,
              description: '',
              clientId: clientId,
              userId: assignment.userId,
              projectId: project.id,
              createdAt: now,
              date: format(date, 'yyyy-MM-dd'),
              updatedAt: now
            });
          }
        }
      }
    }

    await batch.commit();
  } catch (error) {
    console.error('Error generating test data:', error);
    throw error;
  }
}

export async function clearTestData(): Promise<void> {
  const batch = writeBatch(db);
  
  try {
    // Delete all time entries
    const timeEntriesRef = collection(db, 'timeEntries');
    const q = query(timeEntriesRef, where('isTestData', '==', true));
    const timeEntriesSnapshot = await getDocs(q);
    
    timeEntriesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error('Error clearing test data:', error);
    throw error;
  }
}

export async function recalculateProjectTotals(): Promise<void> {
  // Implementation for recalculating project totals
  console.log('Recalculating project totals');
}

export async function cleanupOrphanedData(): Promise<void> {
  // Implementation for cleaning up orphaned data
  console.log('Cleaning up orphaned data');
}

export async function validateTimeEntries(): Promise<{
  invalid: number;
  fixed: number;
}> {
  // Implementation for validating time entries
  return { invalid: 0, fixed: 0 };
}

export async function exportCollectionAsJson(collectionName: string): Promise<FirestoreCollection> {
  try {
    // Validate collection name
    if (!collectionName) {
      throw new Error('Collection name is required');
    }

    // Get collection reference
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);

    // Transform documents into JSON
    const documents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      name: collectionName,
      documentCount: documents.length,
      documents,
      exportedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error exporting collection ${collectionName}:`, error);
    throw error;
  }
}