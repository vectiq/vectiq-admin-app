import { format, parseISO, eachDayOfInterval, isWeekend } from 'date-fns';

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

export function calculateLeaveHours(leave: any, monthStart: Date, monthEnd: Date): number {
  const leaveStart = new Date(leave.startDate);
  const leaveEnd = new Date(leave.endDate);
  
  // If leave is entirely within month, return full units
  if (leaveStart >= monthStart && leaveEnd <= monthEnd) {
    return leave.numberOfUnits;
  }
  
  // Calculate overlapping days
  const start = leaveStart < monthStart ? monthStart : leaveStart;
  const end = leaveEnd > monthEnd ? monthEnd : leaveEnd;
  const totalDays = Math.ceil((leaveEnd.getTime() - leaveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const overlappingDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Pro-rate the hours based on overlapping days
  return (overlappingDays / totalDays) * leave.numberOfUnits;
}