import { useState } from 'react';
import { format } from 'date-fns';
import { useProcessing } from '@/lib/hooks/useProcessing';
import { InvoicingTab } from '@/components/processing/InvoicingTab';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { DateNavigation } from '@/components/ui/DateNavigation';

export default function Invoicing() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [filters, setFilters] = useState({
    search: '',
    clientId: '',
    status: '',
    priority: '',
    type: ''
  });

  const { data, isLoading, updateStatus, isUpdating } = useProcessing(selectedMonth);
  const month = format(selectedMonth, 'yyyy-MM');

  const handlePrevious = () => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNext = () => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const handleToday = () => {
    setSelectedMonth(new Date());
  };

  if (isLoading || !data) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Invoicing</h1>
          <p className="mt-1 text-sm text-gray-500">Generate and manage client invoices</p>
        </div>
        
        <DateNavigation
          currentDate={selectedMonth}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onToday={handleToday}
          formatString="MMMM yyyy"
        />
      </div>

      <InvoicingTab
        projects={data.projects}
        data={data}
        onUpdateStatus={updateStatus}
        onFilterChange={setFilters}
        isUpdating={isUpdating}
        month={month}
      />
    </div>
  );
}