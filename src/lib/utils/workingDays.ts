import { eachDayOfInterval, isWeekend, parse, format } from 'date-fns';

// Canberra public holidays for 2024
const PUBLIC_HOLIDAYS_2024 = [
  '2024-01-01', // New Year's Day
  '2024-01-26', // Australia Day
  '2024-03-11', // Canberra Day
  '2024-03-29', // Good Friday
  '2024-04-01', // Easter Monday
  '2024-04-25', // ANZAC Day
  '2024-05-27', // Reconciliation Day
  '2024-06-10', // King's Birthday
  '2024-10-07', // Labour Day
  '2024-12-25', // Christmas Day
  '2024-12-26', // Boxing Day
];

export function getWorkingDaysForMonth(monthStr: string): number {
  const date = parse(monthStr, 'yyyy-MM', new Date());
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  
  const days = eachDayOfInterval({
    start: new Date(date.getFullYear(), date.getMonth(), 1),
    end: lastDay
  });

  return days.filter(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return !isWeekend(day) && !PUBLIC_HOLIDAYS_2024.includes(dateStr);
  }).length;
}

export function calculateDefaultHours(workingDays: number, hoursPerWeek: number): number {
  const dailyHours = hoursPerWeek / 5;
  return Math.round(workingDays * dailyHours * 10) / 10; // Round to 1 decimal place
}