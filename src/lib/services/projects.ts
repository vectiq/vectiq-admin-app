import { 
  collection,
  doc,
  getDoc,
  getDocs, 
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  query,
  where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { hasProjectElapsed } from '@/lib/utils/date';
import type { Project, ProjectTask } from '@/types';
import { isAscii } from 'buffer';

const COLLECTION = 'projects';

export async function getProjects(): Promise<Project[]> {
  const projectsSnapshot = await getDocs(collection(db, COLLECTION));
  const projects = projectsSnapshot.docs.map((projectDoc) => {
      const data = projectDoc.data();
      
      return {
        ...data,
        id: projectDoc.id,
        tasks: data.tasks || [],
        isActive: data.isActive ?? true,
        hasProjectElapsed: hasProjectElapsed(data),
      } as Project;
    });

  return projects;
}

export async function createProject(projectData: Omit<Project, 'id'>): Promise<Project> {
  // Create project document
  const projectRef = doc(collection(db, COLLECTION));
  const projectId = projectRef.id;

  const { tasks, ...projectFields } = projectData;
  const project = {
    ...projectFields,
    id: projectId,
    tasks: (tasks || []).map(task => ({
      ...task,
      id: crypto.randomUUID(),
      projectId,
      userAssignments: []
    })),
    approverEmail: projectData.approverEmail || '',
    isActive: projectData.isActive ?? true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  await setDoc(projectRef, project);

  return {
    ...projectFields,
    id: projectId,
    tasks: project.tasks,
  } as Project;
}

export async function updateProject(projectData: Project): Promise<void> {
  const { id, tasks, ...projectFields } = projectData;
  if (!id) throw new Error('Project ID is required for update');

  // Deep clean object to remove undefined values and standardize nulls
  const cleanObject = (obj: any): any => {
    const cleaned = { ...obj };
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key] === undefined) {
        delete cleaned[key];
      } else if (cleaned[key] === null) {
        // Keep null values
      } else if (Array.isArray(cleaned[key])) {
        cleaned[key] = cleaned[key].map((item: any) => 
          typeof item === 'object' && item !== null ? cleanObject(item) : item
        );
      } else if (typeof cleaned[key] === 'object' && cleaned[key] !== null) {
        cleaned[key] = cleanObject(cleaned[key]);
      }
    });
    return cleaned;
  };

  // Clean up tasks array
  const cleanedTasks = tasks.map(task => cleanObject({
    ...task,
    userAssignments: task.userAssignments || [],
    teamId: task.teamId || null
  }));

  const projectRef = doc(db, COLLECTION, id);
  const projectUpdate = cleanObject({
    ...projectFields, 
    isActive: projectData.isActive, // Use manually set isActive value
    tasks: cleanedTasks,
    updatedAt: serverTimestamp(),
  });
  
  await updateDoc(projectRef, projectUpdate);
}

export async function assignUserToTask(
  projectId: string,
  taskId: string,
  userId: string, 
  userName: string
): Promise<void> {
  const projectRef = doc(db, COLLECTION, projectId);
  const projectDoc = await getDoc(projectRef);
  
  if (!projectDoc.exists()) {
    throw new Error('Project not found');
  }
  
  const project = { ...projectDoc.data(), id: projectId } as Project;
  const taskIndex = project.tasks.findIndex(t => t.id === taskId);
  
  if (taskIndex === -1) {
    throw new Error('Task not found');
  }
  
  const assignment = {
    id: crypto.randomUUID(),
    userId,
    userName,
    isActive: true,
    assignedAt: new Date().toISOString()
  };
  
  project.tasks[taskIndex].userAssignments = [
    ...project.tasks[taskIndex].userAssignments,
    assignment
  ];
  
  await updateDoc(projectRef, {
    tasks: project.tasks,
    updatedAt: serverTimestamp()
  });
}

export async function removeUserFromTask(
  projectId: string,
  taskId: string,
  assignmentId: string
): Promise<void> {
  if (!projectId) {
    throw new Error('Project ID is required');
  }

  const projectRef = doc(db, COLLECTION, projectId);
  const projectDoc = await getDoc(projectRef);
  
  if (!projectDoc.exists()) {
    throw new Error('Project not found');
  }
  
  const projectData = projectDoc.data();
  if (!projectData) {
    throw new Error('Project data is empty');
  }

  const project = {
    ...projectData,
    id: projectId,
    tasks: projectData.tasks || []
  } as Project;

  const taskIndex = project.tasks.findIndex(t => t.id === taskId);
  
  if (taskIndex === -1) {
    throw new Error('Task not found');
  }
  
  project.tasks[taskIndex].userAssignments = project.tasks[taskIndex].userAssignments.map(
    a => a.id === assignmentId ? { ...a, isActive: !a.isActive } : a
  );
  
  await updateDoc(projectRef, {
    tasks: project.tasks,
    updatedAt: serverTimestamp()
  });
}
export async function deleteProject(id: string): Promise<void> {
  const projectRef = doc(db, COLLECTION, id);
  await deleteDoc(projectRef);
}