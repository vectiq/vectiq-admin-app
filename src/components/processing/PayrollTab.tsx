import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Card } from '@/components/ui/Card';
import { PayRunCard } from '@/components/payroll/PayRunCard';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { DollarSign, Plus, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/Select';
import { useQueryClient } from '@tanstack/react-query';
import { syncPayRun } from '@/lib/services/payroll';
import { usePayroll } from '@/lib/hooks/usePayroll';
import type { PayRun } from '@/types';

interface PayrollTabProps {
  month: string;
}

export function PayrollTab({ month }: PayrollTabProps) {
  const [selectedCalendar, setSelectedCalendar] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();
  const { calendars, isLoading, createPayRun, payRuns } = usePayroll({
    selectedDate: new Date(month + '-01'),
    includeStats: true,
    onPayRunCreated: () => {
      // Reset the calendar selection after successful creation
      setSelectedCalendar('');
    }
  });

  // Filter pay runs to only show drafts for the current month
  const draftPayRuns = payRuns.filter(run => {
    const runMonth = format(parseISO(run.PayRunPeriodStartDate), 'yyyy-MM');
    return run.PayRunStatus === 'DRAFT' && runMonth === month;
  });

  // Filter out calendars that already have draft pay runs
  const availableCalendars = useMemo(() => {
    const draftPayRunCalendarIds = new Set(
      draftPayRuns
        .map(payRun => payRun.PayrollCalendarID)
    );
    
    return calendars.filter(calendar => !draftPayRunCalendarIds.has(calendar.PayrollCalendarID));
  }, [calendars, draftPayRuns]);

  // Helper function to get calendar info
  const getCalendarInfo = (payRun: any) => {
    const calendar = calendars.find(c => c.PayrollCalendarID === payRun.PayrollCalendarID);
    return calendar ? {
      name: calendar.Name,
      type: calendar.CalendarType
    } : null;
  };

  const handleCreatePayRun = async () => {
    if (!selectedCalendar) return;
    
    try {
      setIsCreating(true);
      await createPayRun(selectedCalendar);
    } catch (error) {
      console.error('Failed to create pay run:', error);
      alert('Failed to create pay run. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };
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

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Draft Pay Runs */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <DollarSign className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-medium text-gray-900">Draft Pay Runs</h3>
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <Select
                value={selectedCalendar}
                onValueChange={setSelectedCalendar}
              >
                <SelectTrigger className="w-[250px]">
                  {selectedCalendar ? 
                    calendars.find(c => c.PayrollCalendarID === selectedCalendar)?.Name :
                    'Select Pay Calendar'
                  }
                </SelectTrigger>
                <SelectContent>
                  {availableCalendars.map(calendar => (
                    <SelectItem 
                      key={calendar.PayrollCalendarID} 
                      value={calendar.PayrollCalendarID}
                    >
                      {calendar.Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleCreatePayRun}
                disabled={!selectedCalendar || isCreating}
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Create Pay Run
              </Button>
              <Button
                onClick={handleSyncPayRun}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Sync Pay Run
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            {draftPayRuns
              .map((payRun) => {
                const calendar = getCalendarInfo(payRun);
                return (
                  <PayRunCard
                    key={payRun.PayRunID}
                    payRun={payRun}
                    calendarName={calendar?.name}
                    calendarType={calendar?.type}
                  />
                );
              })}
            
            {draftPayRuns.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No draft pay runs found
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}