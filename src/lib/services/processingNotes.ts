import { 
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Note, ProjectProcessingNote, MonthlyProcessingNote } from '@/types';

const COLLECTION = 'processingNotes';

// Helper to format timestamps
const formatTimestamp = () => new Date().toISOString();

// Get all notes for a specific project and month
export async function getProjectNotes(projectId: string, month: string): Promise<ProjectProcessingNote | null> {
  const docRef = doc(db, COLLECTION, `project_${projectId}_${month}`);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  return docSnap.data() as ProjectProcessingNote;
}

// Get all monthly notes for a specific month
export async function getMonthlyNotes(month: string): Promise<MonthlyProcessingNote | null> {
  const docRef = doc(db, COLLECTION, `month_${month}`);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  return docSnap.data() as MonthlyProcessingNote;
}

// Add a note to a project
export async function addProjectNote(
  projectId: string,
  month: string,
  note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Note> {
  const docRef = doc(db, COLLECTION, `project_${projectId}_${month}`);
  const docSnap = await getDoc(docRef);
  
  const newNote: Note = {
    ...note,
    id: crypto.randomUUID(),
    createdAt: formatTimestamp(),
    updatedAt: formatTimestamp()
  };

  if (!docSnap.exists()) {
    // Create new document with first note
    await setDoc(docRef, {
      projectId,
      month,
      notes: [newNote]
    });
  } else {
    // Add note to existing array
    const data = docSnap.data() as ProjectProcessingNote;
    await updateDoc(docRef, {
      notes: [...data.notes, newNote]
    });
  }

  return newNote;
}

// Add a monthly note
export async function addMonthlyNote(
  month: string,
  note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Note> {
  const docRef = doc(db, COLLECTION, `month_${month}`);
  const docSnap = await getDoc(docRef);
  
  const newNote: Note = {
    ...note,
    id: crypto.randomUUID(),
    createdAt: formatTimestamp(),
    updatedAt: formatTimestamp()
  };

  if (!docSnap.exists()) {
    // Create new document with first note
    await setDoc(docRef, {
      month,
      notes: [newNote]
    });
  } else {
    // Add note to existing array
    const data = docSnap.data() as MonthlyProcessingNote;
    await updateDoc(docRef, {
      notes: [...data.notes, newNote]
    });
  }

  return newNote;
}

// Update a project note
export async function updateProjectNote(
  projectId: string,
  month: string,
  noteId: string,
  updates: Partial<Note>
): Promise<void> {
  const docRef = doc(db, COLLECTION, `project_${projectId}_${month}`);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error('Project notes not found');
  }
  
  const data = docSnap.data() as ProjectProcessingNote;
  const noteIndex = data.notes.findIndex(n => n.id === noteId);
  
  if (noteIndex === -1) {
    throw new Error('Note not found');
  }
  
  const updatedNotes = [...data.notes];
  updatedNotes[noteIndex] = {
    ...updatedNotes[noteIndex],
    ...updates,
    updatedAt: formatTimestamp()
  };
  
  await updateDoc(docRef, { notes: updatedNotes });
}

// Update a monthly note
export async function updateMonthlyNote(
  month: string,
  noteId: string,
  updates: Partial<Note>
): Promise<void> {
  const docRef = doc(db, COLLECTION, `month_${month}`);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error('Monthly notes not found');
  }
  
  const data = docSnap.data() as MonthlyProcessingNote;
  const noteIndex = data.notes.findIndex(n => n.id === noteId);
  
  if (noteIndex === -1) {
    throw new Error('Note not found');
  }
  
  const updatedNotes = [...data.notes];
  updatedNotes[noteIndex] = {
    ...updatedNotes[noteIndex],
    ...updates,
    updatedAt: formatTimestamp()
  };
  
  await updateDoc(docRef, { notes: updatedNotes });
}

// Delete a project note
export async function deleteProjectNote(
  projectId: string,
  month: string,
  noteId: string
): Promise<void> {
  const docRef = doc(db, COLLECTION, `project_${projectId}_${month}`);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error('Project notes not found');
  }
  
  const data = docSnap.data() as ProjectProcessingNote;
  const updatedNotes = data.notes.filter(n => n.id !== noteId);
  
  if (updatedNotes.length === 0) {
    // If no notes left, delete the document
    await deleteDoc(docRef);
  } else {
    await updateDoc(docRef, { notes: updatedNotes });
  }
}

// Delete a monthly note
export async function deleteMonthlyNote(
  month: string,
  noteId: string
): Promise<void> {
  const docRef = doc(db, COLLECTION, `month_${month}`);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error('Monthly notes not found');
  }
  
  const data = docSnap.data() as MonthlyProcessingNote;
  const updatedNotes = data.notes.filter(n => n.id !== noteId);
  
  if (updatedNotes.length === 0) {
    // If no notes left, delete the document
    await deleteDoc(docRef);
  } else {
    await updateDoc(docRef, { notes: updatedNotes });
  }
}