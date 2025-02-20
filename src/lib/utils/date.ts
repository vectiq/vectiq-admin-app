import { format, parseISO, eachDayOfInterval, isWeekend } from 'date-fns';

/**
 * Calculates the number of working days in a month for a user, taking into account
 * their start and end dates.
 */
export function getWorkingDaysForUser(
  monthStart: Date,
  monthEnd: Date,
  startDate?: string,
  endDate?: string
): number {
  // If no start/end dates, use full month
  if (!startDate && !endDate) {
    return getWorkingDaysInPeriod(monthStart, monthEnd);
  }

  // Parse dates and clamp to month boundaries
  const effectiveStart = startDate ? 
    Math.max(monthStart.getTime(), parseISO(startDate).setHours(0,0,0,0)) : 
    monthStart.setHours(0,0,0,0);

  const effectiveEnd = endDate ? 
    Math.min(monthEnd.getTime(), parseISO(endDate).setHours(23,59,59,999)) : 
    monthEnd.setHours(23,59,59,999);

  // If start is after end or both are outside month, return 0
  if (effectiveStart > effectiveEnd) {
    return 0;
  }

  // Calculate working days in the effective period
  return getWorkingDaysInPeriod(
    new Date(effectiveStart),
    new Date(effectiveEnd)
  );
}

export const hasProjectElapsed = (project: { endDate?: string }) => {
  const hasEndDate = project.endDate && project.endDate.trim() !== '';
  if (!hasEndDate) return false;
  
  const endDate = new Date(project.endDate);
  return endDate < new Date();
};


export const formatDate = (date: string | Date) => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM dd, yyyy');
};

export const getWorkingDaysInPeriod = (startDate: Date, endDate: Date): number => {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  return days.filter(day => !isWeekend(day)).length;
};
export const getCurrentWeekDates = () => {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(monday.getDate() - monday.getDay() + 1);
  
  return Array.from({ length: 5 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return format(date, 'yyyy-MM-dd');
  });
};
