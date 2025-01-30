import { useQuery } from '@tanstack/react-query';
import { getLeave } from '@/lib/services/leave';
import { format, parseISO, isWithinInterval } from 'date-fns';
import type { Leave } from '@/types';

const QUERY_KEY = 'leave-forecasts';

export function useLeaveForecasts(month: string) {
  const query = useQuery({
    queryKey: [QUERY_KEY, month],
    queryFn: async () => {
      const leaveData = await getLeave();
      
      // Filter leave entries for the selected month
      const monthStart = new Date(month + '-01');
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0); // Last day of month
      
      const monthlyLeave = leaveData.leave.filter(leave => {
        const leaveStart = parseISO(leave.startDate);
        const leaveEnd = parseISO(leave.endDate);

        // Check if leave period overlaps with the month
        return isWithinInterval(monthStart, { start: leaveStart, end: leaveEnd }) ||
               isWithinInterval(monthEnd, { start: leaveStart, end: leaveEnd }) ||
               isWithinInterval(leaveStart, { start: monthStart, end: monthEnd }) ||
               isWithinInterval(leaveEnd, { start: monthStart, end: monthEnd });
      });

      return {
        leave: monthlyLeave,
        leaveBalances: leaveData.leaveBalances
      };
    }
  });

  return {
    leaveData: query.data,
    isLoading: query.isLoading,
    error: query.error
  };
}