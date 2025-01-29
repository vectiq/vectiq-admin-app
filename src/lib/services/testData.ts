import { collection, doc, writeBatch, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, eachDayOfInterval, parseISO, isWeekend } from 'date-fns';
import type { TestDataOptions } from '@/types';

export async function generateTestTimeEntries(options: TestDataOptions): Promise<void> {
  const batch = writeBatch(db);
  
  // Get all users, projects and existing entries
  const [usersSnapshot, projectsSnapshot, existingEntriesSnapshot] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'projects')),
    getDocs(query(
      collection(db, 'timeEntries'),
      where('date', '>=', options.startDate),
      where('date', '<=', options.endDate)
    ))
  ]);

  const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const projects = projectsSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(project => {
      // Only include active projects with billable tasks
      return project.isActive && 
             Array.isArray(project.tasks) &&
             project.tasks.some(task => task.billable);
    });

  // Build map of valid assignments
  const userAssignments = new Map();
  
  users.forEach(user => {
    const assignments = [];
    
    projects.forEach(project => {
      (project.tasks || []).forEach(task => {
        // Only include billable tasks where user is assigned
        if (task.billable && task.userAssignments?.some(a => a.userId === user.id)) {
          assignments.push({
            projectId: project.id,
            clientId: project.clientId,
            taskId: task.id,
            project,
            task
          });
        }
      });
    });

    if (assignments.length > 0) {
      userAssignments.set(user.id, assignments);
    }
  });

  // Create map of existing hours by date and user
  const existingHours = new Map();
  existingEntriesSnapshot.docs.forEach(doc => {
    const entry = doc.data();
    const key = `${entry.date}_${entry.userId}`;
    if (!existingHours.has(key)) {
      existingHours.set(key, 0);
    }
    existingHours.set(key, existingHours.get(key) + entry.hours);
  });

  // Get all days in the date range
  const days = eachDayOfInterval({
    start: parseISO(options.startDate),
    end: parseISO(options.endDate)
  });

  // For each user with assignments
  for (const [userId, assignments] of userAssignments.entries()) {
    const user = users.find(u => u.id === userId);
    if (!user) continue;

    // For each day
    for (const day of days) {
      // Skip weekends if not included
      if (!options.includeWeekends && isWeekend(day)) continue;

      const dateStr = format(day, 'yyyy-MM-dd');
      const dateUserKey = `${dateStr}_${userId}`;
      
      // Get existing hours for this day
      const existingDayHours = existingHours.get(dateUserKey) || 0;
      
      // Skip if already at or over max hours
      if (existingDayHours >= options.maxDailyHours) continue;

      // Calculate target hours for this day (between min and max)
      const targetHours = Math.max(
        options.minDailyHours,
        Math.min(
          options.maxDailyHours,
          Math.round((Math.random() * (options.maxDailyHours - options.minDailyHours) + options.minDailyHours) * 2) / 2
        )
      );

      // Account for existing hours
      const remainingHours = options.maxDailyHours - existingDayHours;
      const hoursToDistribute = Math.min(remainingHours, targetHours);
      
      // Randomly distribute remaining hours across assignments
      const shuffledAssignments = [...assignments]
        .sort(() => Math.random() - 0.5);

      let remainingToDistribute = hoursToDistribute;
      
      // Calculate minimum hours per assignment to ensure reasonable distribution
      const minHoursPerAssignment = Math.min(
        options.minDailyHours / shuffledAssignments.length,
        remainingToDistribute / shuffledAssignments.length
      );
      
      for (const assignment of shuffledAssignments) {
        if (remainingToDistribute <= 0) break;

        // Generate random hours between min and max 4 hours per task
        const maxAssignmentHours = Math.min(4, remainingToDistribute);
        const assignmentHours = Math.max(
          minHoursPerAssignment,
          Math.min(
            maxAssignmentHours,
            Math.round((Math.random() * 3 + 1) * 2) / 2 // Random hours between 1-4 in 0.5 increments
          )
        );

        if (assignmentHours > 0) {
          const entryRef = doc(collection(db, 'timeEntries'));
          batch.set(entryRef, {
            id: entryRef.id,
            userId,
            clientId: assignment.clientId,
            projectId: assignment.projectId,
            taskId: assignment.taskId,
            date: dateStr,
            hours: assignmentHours,
            description: 'Test data entry',
            isTestData: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

          remainingToDistribute -= assignmentHours;
          
          // Update existing hours map
          existingHours.set(dateUserKey, (existingHours.get(dateUserKey) || 0) + assignmentHours);
        }
      }
    }
  }

  await batch.commit();
}

export async function clearTestData(): Promise<void> {
  const batch = writeBatch(db);
  
  // Get all test time entries
  const timeEntriesSnapshot = await getDocs(
    query(
      collection(db, 'timeEntries'),
      where('isTestData', '==', true)
    )
  );

  // Delete all test entries
  timeEntriesSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
}