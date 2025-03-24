import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { StickyNote, RefreshCw, Loader2 } from 'lucide-react';
import type { PayRun } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import { ProcessingTabs } from '@/components/processing/ProcessingTabs';
import { PayrollTab } from '@/components/processing/PayrollTab';
import { OvertimeReport } from '@/components/processing/OvertimeReport';
import { ContractorPayrollTab } from '@/components/processing/ContractorPayrollTab';
import { BonusesTab } from '@/components/processing/BonusesTab';
import { NotesSlideout } from '@/components/processing/NotesSlideout';
import { useProcessingNotes } from '@/lib/hooks/useProcessingNotes';
import { usePayroll } from '@/lib/hooks/usePayroll';
import { syncPayRun } from '@/lib/services/payroll';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/Select';

export default function Payroll() {
  const [activeTab, setActiveTab] = useState('payroll');
  const [selectedPayRun, setSelectedPayRun] = useState<PayRun | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const queryClient = useQueryClient();

  const { payRuns, isLoading } = usePayroll({
    selectedDate: new Date(),
    includeStats: true
  });

  // Filter to only show draft pay runs
  const draftPayRuns = payRuns.filter(run => run.PayRunStatus === 'DRAFT');
  
  const handleSyncPayRun = async () => {
    try {
      setIsSyncing(true);
      await syncPayRun();
      // Invalidate pay runs query to trigger a refresh
      await queryClient.invalidateQueries({ queryKey: ['payRun'] });
    } catch (error) {
      console.error('Failed to sync pay run:', error);
      alert('Failed to sync pay run. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const {
    monthlyNotes,
    addMonthlyNote,
    updateMonthlyNote,
    deleteMonthlyNote,
    isLoadingMonthlyNotes
  } = useProcessingNotes({ payRunId: selectedPayRun?.PayRunID });

  if (isLoading) {
    return <LoadingScreen />;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payroll</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <Select
            value={selectedPayRun?.PayRunID || ''}
            onValueChange={(id) => {
              const payRun = draftPayRuns.find(run => run.PayRunID === id);
              setSelectedPayRun(payRun || null);
            }}
          >
            <SelectTrigger className="w-[300px]">
              {selectedPayRun 
                  ? `${format(new Date(selectedPayRun.PayRunPeriodStartDate), 'MMM d')} - ${format(new Date(selectedPayRun.PayRunPeriodEndDate), 'MMM d, yyyy')}`
                  : 'Select Pay Run'}
            </SelectTrigger>
            <SelectContent>
              {draftPayRuns.map(run => (
                <SelectItem key={run.PayRunID} value={run.PayRunID}>
                  {format(new Date(run.PayRunPeriodStartDate), 'MMM d')} - {format(new Date(run.PayRunPeriodEndDate), 'MMM d, yyyy')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            onClick={handleSyncPayRun}
            disabled={isSyncing}
            variant="secondary"
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync with Xero
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="relative"
            title="View pay run notes"
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
        </div>
      </div>

      {!selectedPayRun?.PayRunID && (
        <div className="text-center py-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-500">Select a pay run to begin processing</p>
        </div>
      )}

      {selectedPayRun?.PayRunID && (
        <>
          <ProcessingTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab === 'payroll' && <PayrollTab payRun={selectedPayRun} />}
          {activeTab === 'contractor-payroll' && (
            <ContractorPayrollTab 
              payRun={selectedPayRun}
              onPayRunChange={(id) => {
                const payRun = draftPayRuns.find(run => run.PayRunID === id);
                setSelectedPayRun(payRun || null);
              }}
            />
          )}
          {activeTab === 'bonuses' && <BonusesTab payRun={selectedPayRun} />}
          {activeTab === 'overtime' && <OvertimeReport payRun={selectedPayRun} />}
        </>
      )}
      
      <NotesSlideout
        open={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        title="Pay Run Notes"
        notes={monthlyNotes}
        onAddNote={addMonthlyNote}
        onUpdateNote={updateMonthlyNote}
        onDeleteNote={deleteMonthlyNote}
        isLoading={isLoadingMonthlyNotes}
      />
    </div>
  );
}