import { useState, useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, isWithinInterval, parse, isToday } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils/styles';

interface DateRangeSelectorProps {
  value: { startDate: string; endDate: string };
  onChange: (dates: { startDate: string; endDate: string }) => void;
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const RANGES = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'thisWeek', label: 'This week' },
  { key: 'lastWeek', label: 'Last week' },
  { key: 'pastTwoWeeks', label: 'Past two weeks' },
  { key: 'thisMonth', label: 'This month' },
  { key: 'lastMonth', label: 'Last month' },
  { key: 'thisYear', label: 'This year' },
  { key: 'lastYear', label: 'Last year' }
];

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [leftMonth, setLeftMonth] = useState(() => startOfMonth(new Date()));
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [selecting, setSelecting] = useState<'start' | 'end' | null>(null);
  const [tempRange, setTempRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });

  const startDate = parse(value.startDate, 'yyyy-MM-dd', new Date());
  const endDate = parse(value.endDate, 'yyyy-MM-dd', new Date());

  const rightMonth = useMemo(() => addMonths(leftMonth, 1), [leftMonth]);

  const generateMonth = (date: Date) => {
    const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
    const days = [];
    let currentDate = start;

    while (currentDate <= end) {
      days.push(currentDate);
      currentDate = addMonths(currentDate, 0);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  const leftMonthDays = useMemo(() => generateMonth(leftMonth), [leftMonth]);
  const rightMonthDays = useMemo(() => generateMonth(rightMonth), [rightMonth]);

  const handleDateClick = (date: Date) => {
    if (!selecting || selecting === 'end') {
      setSelecting('end');
      setActivePreset(null);
      setTempRange({ start: date, end: null });
    } else {
      const start = tempRange.start!;
      const end = date;
      
      if (start > end) {
        onChange({
          startDate: format(end, 'yyyy-MM-dd'),
          endDate: format(start, 'yyyy-MM-dd')
        });
      } else {
        onChange({
          startDate: format(start, 'yyyy-MM-dd'),
          endDate: format(end, 'yyyy-MM-dd')
        });
      }
      
      setSelecting(null);
      setTempRange({ start: null, end: null });
      setIsOpen(false);
    }
  };

  const handleRangeSelect = (key: string) => {
    const now = new Date();
    let start: Date;
    let end: Date;
    setActivePreset(key);

    switch (key) {
      case 'today':
        start = now;
        end = now;
        break;
      case 'yesterday':
        start = subMonths(now, 0);
        start.setDate(now.getDate() - 1);
        end = start;
        break;
      case 'thisWeek':
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'lastWeek':
        start = startOfWeek(subMonths(now, 0), { weekStartsOn: 1 });
        start.setDate(start.getDate() - 7);
        end = endOfWeek(start, { weekStartsOn: 1 });
        break;
      case 'pastTwoWeeks':
        start = startOfWeek(subMonths(now, 0), { weekStartsOn: 1 });
        start.setDate(start.getDate() - 14);
        end = now;
        break;
      case 'thisMonth':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'lastMonth':
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      case 'lastYear':
        start = new Date(now.getFullYear() - 1, 0, 1);
        end = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        return;
    }

    onChange({
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd')
    });
    setIsOpen(false);
  };

  const getDayClasses = (day: Date) => {
    const isSelected = isSameDay(day, startDate) || isSameDay(day, endDate);
    const isInRange = isWithinInterval(day, { start: startDate, end: endDate });
    const isOffMonth = !isSameMonth(day, leftMonth) && !isSameMonth(day, rightMonth);
    const isWeekend = day.getDay() === 0 || day.getDay() === 6;

    return cn(
      "w-8 h-8 text-sm rounded-full flex items-center justify-center transition-all relative",
      "hover:bg-indigo-50 hover:text-indigo-600",
      {
        "text-gray-400": isOffMonth,
        "bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white": isSelected,
        "bg-indigo-50 text-indigo-600": isInRange && !isSelected,
        "text-red-500": isWeekend && !isOffMonth && !isSelected,
        "bg-yellow-50 text-yellow-600": isToday(day) && !isSelected,
      }
    );
  };

  return (
    <div className="relative">
      <Button
        variant="secondary"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full sm:w-auto min-w-[240px] justify-between group"
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-gray-500 group-hover:text-gray-700" />
          <span>
            {activePreset ? (
              RANGES.find(r => r.key === activePreset)?.label
            ) : (
              `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`
            )}
          </span>
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 transition-transform",
          isOpen && "transform rotate-180"
        )} />
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <Card className="absolute z-40 top-full mt-2 right-0 p-4 w-[800px] animate-fade-in">
            <div className="flex">
              {/* Predefined Ranges */}
              <div className="w-48 pr-4 border-r border-gray-200">
                <div className="space-y-1">
                  {RANGES.map(range => (
                    <button
                      key={range.key}
                      onClick={() => handleRangeSelect(range.key)}
                      className={cn( 
                        "w-full px-3 py-2 text-left text-sm rounded-md transition-colors",
                        "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500",
                        activePreset === range.key && "bg-indigo-50 text-indigo-600"
                      )}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calendars */}
              <div className="flex-1 pl-4">
                <div className="flex gap-8">
                  {/* Left Calendar */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => setLeftMonth(subMonths(leftMonth, 1))}
                        className="p-1 hover:bg-gray-100 rounded-full"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <div className="font-medium">
                        {format(leftMonth, 'MMMM yyyy')}
                      </div>
                      <div className="w-6" />
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {WEEKDAYS.map(day => (
                        <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500">
                          {day}
                        </div>
                      ))}
                      {leftMonthDays.map((day, i) => (
                        <button
                          key={i}
                          onClick={() => handleDateClick(day)}
                          className={getDayClasses(day)}
                        >
                          {format(day, 'd')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right Calendar */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-6" />
                      <div className="font-medium">
                        {format(rightMonth, 'MMMM yyyy')}
                      </div>
                      <button
                        onClick={() => setLeftMonth(addMonths(leftMonth, 1))}
                        className="p-1 hover:bg-gray-100 rounded-full"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {WEEKDAYS.map(day => (
                        <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500">
                          {day}
                        </div>
                      ))}
                      {rightMonthDays.map((day, i) => (
                        <button
                          key={i}
                          onClick={() => handleDateClick(day)}
                          className={getDayClasses(day)}
                        >
                          {format(day, 'd')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}