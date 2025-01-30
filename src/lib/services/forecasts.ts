import {
  collection,
  doc,
  getDoc,
  deleteDoc,
  getDocs,
  setDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import type { SavedForecast } from '@/types';

const COLLECTION = 'forecasts';

interface ForecastHours {
  hours: number;
  isDefault: boolean;
}

export async function getSavedForecasts(month: string): Promise<SavedForecast[]> {
  const forecastsRef = collection(db, COLLECTION);
  const q = query(forecastsRef, where('month', '==', month));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as SavedForecast[];
}

export async function saveForecast(
  name: string,
  month: string,
  entries: SavedForecast['entries']
): Promise<SavedForecast> {
  const forecastRef = doc(collection(db, COLLECTION));
  
  const forecast: SavedForecast = {
    id: forecastRef.id,
    name,
    month,
    entries,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await setDoc(forecastRef, forecast);
  return forecast;
}

export async function updateForecast(
  id: string,
  entries: SavedForecast['entries']
): Promise<SavedForecast> {
  const forecastRef = doc(db, COLLECTION, id);
  const docSnap = await getDoc(forecastRef);
  
  if (!docSnap.exists()) {
    throw new Error('Forecast not found');
  }
  
  const existingData = docSnap.data() as SavedForecast;
  
  const forecast: SavedForecast = {
    id,
    name: existingData.name,
    month: existingData.month,
    entries,
    createdAt: existingData.createdAt,
    updatedAt: new Date().toISOString()
  };

  await setDoc(forecastRef, forecast);
  return forecast;
}

export async function deleteForecast(id: string): Promise<void> {
  const forecastRef = doc(db, COLLECTION, id);
  await deleteDoc(forecastRef);
}