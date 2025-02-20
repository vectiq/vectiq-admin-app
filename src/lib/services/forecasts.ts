import { 
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { calculateLeaveHours } from '@/lib/utils/date';
import { getWorkingDaysForMonth } from '@/lib/utils/workingDays';
import { getAverageSellRate, getCostRateForMonth } from '@/lib/utils/rates';
import type { User, Project, Bonus, Leave, PublicHoliday } from '@/types';

interface ForecastData {
  users: User[];
  projects: Project[];
  bonuses: Bonus[];
  leave: Leave[];
  holidays: PublicHoliday[];
  workingDays: number;
  deltas: Record<string, any>;
}

export async function getForecastData(month: string, userId: string): Promise<ForecastData> {
  // Get start and end dates for the month
  const monthStart = startOfMonth(parseISO(month + '-01'));
  const monthEnd = endOfMonth(monthStart);

  // Fetch all required data in parallel
  const [
    usersSnapshot,
    projectsSnapshot,
    bonusesSnapshot,
    leaveSnapshot,
    holidaysSnapshot,
    forecastDoc
  ] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'projects')),
    getDocs(query(
      collection(db, 'bonuses'),
      where('date', '>=', format(monthStart, 'yyyy-MM-dd')),
      where('date', '<=', format(monthEnd, 'yyyy-MM-dd'))
    )),
    getDocs(collection(db, 'employeeLeave')),
    getDocs(collection(db, 'publicHolidays')),
    getDoc(doc(db, 'forecasts', `${userId}_${month}`))
  ]);

  // Transform snapshots into data
  const users = usersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    // Calculate cost rate for each user
    costRate: getCostRateForMonth(doc.data().costRate, month),
    // Calculate sell rate for each user based on their project assignments
    sellRate: getAverageSellRate(
      projects,
      doc.id,
      format(monthStart, 'yyyy-MM-dd')
    )
  })) as User[];

  const projects = projectsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Project[];

  const bonuses = bonusesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Bonus[];

  // Process leave data
  const allLeave: Leave[] = [];
  leaveSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.leave) {
      // Filter leave entries that overlap with the selected month
      const monthlyLeave = data.leave.filter(leave => {
        const leaveStart = new Date(leave.startDate);
        const leaveEnd = new Date(leave.endDate);
        return leaveStart <= monthEnd && leaveEnd >= monthStart;
      });
      allLeave.push(...monthlyLeave);
    }
  });

  // Filter holidays for the month
  const holidays = holidaysSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(holiday => holiday.date.startsWith(month)) as PublicHoliday[];

  // Process forecast deltas
  const deltas = forecastDoc.exists() ? forecastDoc.data() : {};

  return {
    users,
    projects,
    bonuses,
    leave: allLeave,
    holidays,
    workingDays: getWorkingDaysForMonth(month),
    deltas
  };
}

export async function saveForecastDelta(
  userId: string,
  field: string,
  value: number | null,
  dynamicValue: number,
  month: string,
  currentUserId: string
): Promise<void> {
  const docRef = doc(db, 'forecasts', `${currentUserId}_${month}`);
  const docSnap = await getDoc(docRef);

  // Create the key for this specific field
  const fieldKey = `${userId}_${field}`;

  if (value === null || value === dynamicValue) {
    if (docSnap.exists()) {
      // Remove the field if it exists
      const data = docSnap.data();
      delete data[fieldKey];
      
      // If no more fields, delete the document
      if (Object.keys(data).length === 0) {
        await deleteDoc(docRef);
      } else {
        await updateDoc(docRef, data);
      }
    }
  } else {
    const updateData = {
      [fieldKey]: {
        value,
        updatedAt: new Date().toISOString()
      }
    };

    if (docSnap.exists()) {
      await updateDoc(docRef, updateData);
    } else {
      await setDoc(docRef, updateData);
    }
  }
}