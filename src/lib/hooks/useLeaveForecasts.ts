import { useQuery } from '@tanstack/react-query';
import { getLeave } from '@/lib/services/leave';
import { format } from 'date-fns';
import type { Leave } from '@/types';

const QUERY_KEY = 'leave-forecasts';

export function useLeaveForecasts(month: string) {
  const query = useQuery({
    queryKey: [QUERY_KEY, month],
    queryFn: () => getLeave(month)
  });

  return {
    leaveData: query.data,
    isLoading: query.isLoading,
    error: query.error
  };
}