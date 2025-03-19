import { useState } from 'react';
import { format } from 'date-fns';
import { StickyNote } from 'lucide-react';
import { ProcessingTabs } from '@/components/processing/ProcessingTabs';
import { InvoicingTab } from '@/components/processing/InvoicingTab';
import { PayrollTab } from '@/components/processing/PayrollTab';
import { OvertimeReport } from '@/components/processing/OvertimeReport';
import { ContractorPayrollTab } from '@/components/processing/ContractorPayrollTab';
import { NotesSlideout } from '@/components/processing/NotesSlideout';
import { useProcessing } from '@/lib/hooks/useProcessing';
import { useProcessingNotes } from '@/lib/hooks/useProcessingNotes';
import { useMemo } from 'react';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { DateNavigation } from '@/components/ui/DateNavigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function Processing() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState('invoicing');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    clientId: '',
    status: '',
    priority: '',
    type: ''
  });

  const { data, isLoading, updateStatus, isUpdating } = useProcessing(selectedMonth);
  const month = format(selectedMonth, 'yyyy-MM');
  
  const {
    monthlyNotes,
    addMonthlyNote,
    updateMonthlyNote,
    deleteMonthlyNote,
    isLoadingMonthlyNotes
  } = useProcessingNotes({ month });

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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Processing</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            className="relative"
            title="View monthly notes"
            onClick={() => setIsNotesOpen(true)}
          >
            <StickyNote className="h-4 w-4" />
            {monthlyNotes.length > 0 && (
              <Badge
                variant="secondary"
                className="absolute -top-1.5 -right-1.5 min-w-[1.25rem] h-5 flex items-center justify-center text-xs"
              >
                {monthlyNotes.length}
              </Badge>
            )}
          </Button>
          <DateNavigation
            currentDate={selectedMonth}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onToday={handleToday}
            formatString="MMMM yyyy"
          />
        </div>
      </div>

      <ProcessingTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'invoicing' && (
        <InvoicingTab
          projects={filteredProjects}
          data={data}
          onUpdateStatus={updateStatus}
          onFilterChange={setFilters}
          isUpdating={isUpdating}
          month={month}
        />
      )}
      
      {activeTab === 'payroll' && <PayrollTab month={month} />}

      {activeTab === 'contractor-payroll' && <ContractorPayrollTab month={month} />}

      {activeTab === 'overtime' && <OvertimeReport selectedDate={selectedMonth} />}
      
      <NotesSlideout
        open={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        title="Monthly Processing Notes"
        notes={monthlyNotes}
        onAddNote={addMonthlyNote}
        onUpdateNote={updateMonthlyNote}
        onDeleteNote={deleteMonthlyNote}
        isLoading={isLoadingMonthlyNotes}
      />
    </div>
  );
}