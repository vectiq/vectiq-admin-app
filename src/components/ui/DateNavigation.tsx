import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isValid } from 'date-fns';

interface DateNavigationProps {
  currentDate: Date;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  formatString: string;
}

export function DateNavigation({
  currentDate,
  onPrevious,
  onNext,
  onToday,
  formatString,
}: DateNavigationProps) {
  // Safely format the date, escaping special characters if needed
  const formatDate = (date: Date) => {
    if (!isValid(date)) return '';
    try {
      return format(date, formatString.replace(/F/g, "'F'"));
    } catch (error) {
      console.error('Date formatting error:', error);
      return format(date, 'MMMM yyyy');
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onPrevious}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="sm" onClick={onToday}>
          Today
        </Button>
        <Button variant="secondary" size="sm" onClick={onNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <span className="text-lg font-medium">
        {formatDate(currentDate)}
      </span>
    </div>
  );
}