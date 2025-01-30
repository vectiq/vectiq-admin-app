import { useQuery } from '@tanstack/react-query';
import { getPublicHolidays } from '@/lib/services/publicHolidays';
import { format } from 'date-fns';

const QUERY_KEY = 'public-holidays';

export function usePublicHolidays(month?: string) {
  const query = useQuery({
    queryKey: [QUERY_KEY, month],
    queryFn: async () => {
      const holidays = await getPublicHolidays();
      if (month) {
        // Filter holidays for the specified month
        return holidays.filter(holiday => 
          holiday.date.startsWith(month)
        );
      }
      return holidays;
    }
  });

  return {
    holidays: query.data || [],
    isLoading: query.isLoading,
    error: query.error
  };
}