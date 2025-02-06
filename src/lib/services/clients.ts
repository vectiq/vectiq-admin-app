import { 
  collection,
  doc,
  getDocs, 
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Client } from '@/types';

const COLLECTION = 'clients';

export async function getClients(): Promise<Client[]> {
  const snapshot = await getDocs(collection(db, COLLECTION));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Client[];
}

export async function createClient(clientData: Omit<Client, 'id'>): Promise<Client> {
  const clientRef = doc(collection(db, COLLECTION));
  const client: Client = {
    ...clientData,
    id: clientRef.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  await setDoc(clientRef, client);
  return client;
}

export async function updateClient(id: string, clientData: Partial<Client>): Promise<void> {
  const clientRef = doc(db, COLLECTION, id);
  await updateDoc(clientRef, {
    ...clientData,
    updatedAt: serverTimestamp(),
  });
}