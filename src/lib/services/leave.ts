import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Leave, LeaveBalance } from '@/types';

const COLLECTION = 'employeeLeave';

export async function getLeave(month: string): Promise<{ leave: Leave[]; leaveBalances: LeaveBalance[]; lastRefreshed: Date }> {
  // Get start and end dates for the month
  const monthStart = new Date(month + '-01');
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);
  monthEnd.setDate(0);

  // Query all leave documents for the month
  const leaveSnapshot = await getDocs(collection(db, COLLECTION));
  
  // Combine all leave entries
  const allLeave: Leave[] = [];
  const allBalances: LeaveBalance[] = [];
  let lastRefreshed = new Date();

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
    if (data.leaveBalances) {
      allBalances.push(...data.leaveBalances);
    }
    if (data.updatedAt?.toDate() > lastRefreshed) {
      lastRefreshed = data.updatedAt.toDate();
    }
  });

  return {
    leave: allLeave,
    leaveBalances: allBalances,
    lastRefreshed
  };
}