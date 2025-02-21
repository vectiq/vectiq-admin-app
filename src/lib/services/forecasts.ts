import { 
  collection,
  doc,
  deleteDoc,
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
import type { User, Project, Bonus, Leave, PublicHoliday, ForecastData } from '@/types';

export async function getForecastData(month: string, userId: string): Promise<ForecastData> {
  try {
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
    })) as User[];

    const projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Project[];

    const bonuses = bonusesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Bonus[]; // Include all bonuses

    // Calculate bonus totals by user
    const userBonuses = bonuses.reduce((acc, bonus) => {
      if (!acc[bonus.employeeId]) {
        acc[bonus.employeeId] = 0;
      }
      acc[bonus.employeeId] += bonus.amount;
      return acc;
    }, {} as Record<string, number>);

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

    // Process users with their rates
    const processedUsers = users.map(user => {
      const currentCostRate = getCostRateForMonth(user.costRate, month);
      const currentSellRate = getAverageSellRate(projects, user.id, format(monthStart, 'yyyy-MM-dd'));
      
      return {
        ...user,
        costRate: user.costRate || [], // Keep original cost rate array
        currentCostRate,
        currentSellRate
      };
    });
    return {
      month,
      users: processedUsers,
      projects,
      bonuses: userBonuses,
      leave: allLeave,
      holidays,
      workingDays: getWorkingDaysForMonth(month),
      deltas
    };
  } catch (error) {
    console.error('Error fetching forecast data:', error);
    throw error;
  }
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

  // If value is null, delete the field
  if (value === null) {
    if (docSnap.exists()) {
      const data = { ...docSnap.data() };
      delete data[fieldKey];
      await deleteDoc(docRef);
      if (Object.keys(data).length > 0) {
        await setDoc(docRef, data);
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

export async function clearForecastDeltas(month: string, userId: string): Promise<void> {
  const docRef = doc(db, 'forecasts', `${userId}_${month}`);
  await deleteDoc(docRef);
}