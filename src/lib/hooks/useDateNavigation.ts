import { useState, useCallback } from 'react';
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
} from 'date-fns';

interface UseDateNavigationProps {
  type: 'week' | 'month';
  initialDate?: Date;
}

export function useDateNavigation({ type, initialDate = new Date() }: UseDateNavigationProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentDate(prev => 
      type === 'week' ? subWeeks(prev, 1) : subMonths(prev, 1)
    );
  }, [type]);

  const goToNext = useCallback(() => {
    setCurrentDate(prev => 
      type === 'week' ? addWeeks(prev, 1) : addMonths(prev, 1)
    );
  }, [type]);

  const dateRange = {
    start: type === 'week' ? startOfWeek(currentDate, { weekStartsOn: 1 }) : startOfMonth(currentDate),
    end: type === 'week' ? endOfWeek(currentDate, { weekStartsOn: 1 }) : endOfMonth(currentDate),
  };

  return {
    currentDate,
    dateRange,
    goToToday,
    goToPrevious,
    goToNext,
  };
}