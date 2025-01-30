import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Calendar } from 'lucide-react';
import { eachDayOfInterval, isWeekend, startOfMonth, endOfMonth, format } from 'date-fns';
import { usePublicHolidays } from '@/lib/hooks/usePublicHolidays';
import { Badge } from '@/components/ui/Badge';

interface WorkingDaysPanelProps {
  selectedDate: Date;
}

export function WorkingDaysPanel({ selectedDate }: WorkingDaysPanelProps) {
  const monthStr = format(selectedDate, 'yyyy-MM');
  const { holidays } = usePublicHolidays(monthStr);

  const workingDaysInfo = useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const totalDays = days.length;
    const weekendDays = days.filter(day => isWeekend(day)).length;
    const publicHolidays = holidays.length;
    const workingDays = totalDays - weekendDays - publicHolidays;
    
    return {
      totalDays,
      weekendDays,
      publicHolidays,
      workingDays,
      monthName: format(selectedDate, 'MMMM yyyy')
    };
  }, [selectedDate, holidays]);

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <Calendar className="h-5 w-5 text-indigo-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">Working Days for {workingDaysInfo.monthName}</h3>
          <div className="mt-4 grid grid-cols-4 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500">Total Days</div>
              <div className="mt-1 text-2xl font-semibold text-gray-900">{workingDaysInfo.totalDays}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500">Weekend Days</div>
              <div className="mt-1 text-2xl font-semibold text-gray-900">{workingDaysInfo.weekendDays}</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="text-sm text-red-600">Public Holidays</div>
              <div className="mt-1 text-2xl font-semibold text-red-900">{workingDaysInfo.publicHolidays}</div>
            </div>
            <div className="bg-indigo-50 p-3 rounded-lg">
              <div className="text-sm text-indigo-600">Working Days</div>
              <div className="mt-1 text-2xl font-semibold text-indigo-900">{workingDaysInfo.workingDays}</div>
            </div>
          </div>

          {holidays.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {holidays.map(holiday => (
                <Badge key={holiday.id} variant="secondary">
                  {holiday.name} ({format(new Date(holiday.date), 'MMM d')})
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}