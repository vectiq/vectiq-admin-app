import { useState } from 'react';
import { format } from 'date-fns';
import { 
  FileCheck, 
  FileText, 
  DollarSign, 
  AlertCircle, 
  Filter, 
  StickyNote,
  Bell
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProcessingTable } from '@/components/processing/ProcessingTable';
import { ProcessingFilters } from '@/components/processing/ProcessingFilters';
import { ProcessingSummary } from '@/components/processing/ProcessingSummary';
import { useProcessing } from '@/lib/hooks/useProcessing';
import { useMemo } from 'react';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Badge } from '@/components/ui/Badge';
import { DateNavigation } from '@/components/timesheet/DateNavigation';

export default function MonthlyProcessing() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    clientId: '',
    status: '',
    priority: '',
    type: ''
  });

  const { data, isLoading, updateStatus, isUpdating } = useProcessing(selectedMonth);

  // Filter projects based on current filters
  const filteredProjects = useMemo(() => {
    if (!data?.projects) return [];
    
    return data.projects.filter(project => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = 
          project.name.toLowerCase().includes(searchTerm) ||
          project.clientName.toLowerCase().includes(searchTerm);
        if (!matchesSearch) return false;
      }

      // Client filter
      if (filters.clientId && project.clientId !== filters.clientId) {
        return false;
      }

      // Status filter
      if (filters.status && project.invoiceStatus !== filters.status) {
        return false;
      }

      // Priority filter
      if (filters.priority && project.priority !== filters.priority) {
        return false;
      }

      // Type filter
      if (filters.type && project.type !== filters.type) {
        return false;
      }

      return true;
    });
  }, [data?.projects, filters]);

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
    <div className="space-y-6 max-w-[1800px] mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Monthly Processing</h1>
        </div>
        
        <div>
          <DateNavigation
            currentDate={selectedMonth}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onToday={handleToday}
            formatString="MMMM yyyy"
          />
        </div>
      </div>

      <ProcessingSummary data={data} />
      
      <Card>
        {data && (
          <>
            <div className="p-6 border-b border-gray-200">
              <ProcessingFilters onFilterChange={setFilters} />
            </div>
            <ProcessingTable 
              projects={filteredProjects}
              onUpdateStatus={updateStatus}
              isUpdating={isUpdating}
            />
          </>
        )}
      </Card>

    </div>
  );
}