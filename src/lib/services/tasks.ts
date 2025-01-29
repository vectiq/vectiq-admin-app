import { 
  collection,
  doc,
  getDocs, 
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Task } from '@/types';

const COLLECTION = 'tasks';

export async function getTasks(): Promise<Task[]> {
  const snapshot = await getDocs(collection(db, COLLECTION));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Task[];
}

export async function createTask(taskData: Omit<Task, 'id'>): Promise<Task> {
  const taskRef = doc(collection(db, COLLECTION));
  const task: Task = {
    id: taskRef.id,
    ...taskData,
  };
  
  await setDoc(taskRef, {
    name: task.name,
    isActive: task.isActive
  });
  
  return task;
}

export async function updateTask(id: string, taskData: Partial<Task>): Promise<void> {
  const taskRef = doc(db, COLLECTION, id);
  
  await updateDoc(taskRef, taskData);
}

export async function deleteTask(id: string): Promise<void> {
  const taskRef = doc(db, COLLECTION, id);
  await deleteDoc(taskRef);
}