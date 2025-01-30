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
import type { Team } from '@/types';

const COLLECTION = 'teams';

export async function getTeams(): Promise<Team[]> {
  const snapshot = await getDocs(collection(db, COLLECTION));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Team[];
}

export async function createTeam(teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team> {
  const teamRef = doc(collection(db, COLLECTION));
  const team: Team = {
    id: teamRef.id,
    ...teamData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  await setDoc(teamRef, team);
  return team;
}

export async function updateTeam(id: string, teamData: Partial<Team>): Promise<void> {
  const teamRef = doc(db, COLLECTION, id);
  await updateDoc(teamRef, {
    ...teamData,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTeam(id: string): Promise<void> {
  const teamRef = doc(db, COLLECTION, id);
  await deleteDoc(teamRef);
}