import { Card } from '@/components/ui/Card';
import { usePayroll } from '@/lib/hooks/usePayroll';
import { useOvertime } from '@/lib/hooks/useOvertime';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { getWorkingDaysForMonth } from '@/lib/utils/workingDays';
import type { OvertimeReportEntry } from '@/types';
import { Table, TableHeader, TableBody, Th, Td } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/Select';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { useClients } from '@/lib/hooks/useClients';
import { cn } from '@/lib/utils/styles';
import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';

interface OvertimeReportProps {
  selectedDate: Date;
}

export function OvertimeReport({ selectedDate }: OvertimeReportProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedPayRun, setSelectedPayRun] = useState<string>('');
  const currentMonth = format(selectedDate, 'MM-yyyy');
  const workingDays = getWorkingDaysForMonth(format(selectedDate, 'yyyy-MM'));
  const { payRuns } = usePayroll({ selectedDate });
  const { data, isLoading, submitOvertime, checkSubmission } = useOvertime({
    startDate: format(startOfMonth(selectedDate), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(selectedDate), 'yyyy-MM-dd')
  });

  // Filter to only show draft pay runs
  const draftPayRuns = useMemo(() => 
    payRuns.filter(run => run.PayRunStatus === 'DRAFT'),
    [payRuns]
  );


  useEffect(() => {
    async function fetchSubmissionStatus() { // Renamed to avoid conflict
      const submitted = await checkSubmission(currentMonth);
      setIsSubmitted(submitted);
    }
    fetchSubmissionStatus();
  }, [currentMonth, checkSubmission]); // Keep dependencies intact

  const handleSubmit = async () => {
    if (!data) return;
    if (!selectedPayRun) return;
    
    const startDate = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(selectedDate), 'yyyy-MM-dd');
    
    try {
      setIsSubmitting(true);
      await submitOvertime({
        data,
        startDate,
        endDate,
        month: currentMonth,
        payRunId: selectedPayRun
      });
      setIsSubmitted(true);
    } catch (error) {
      console.error('Failed to submit overtime:', error);
      alert('Failed to submit overtime: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Select
            value={selectedPayRun}
            onValueChange={setSelectedPayRun}
          >
            <SelectTrigger className="w-[300px]">
              {selectedPayRun ? 
                draftPayRuns.find(run => run.PayRunID === selectedPayRun)
                  ? `${format(new Date(draftPayRuns.find(run => run.PayRunID === selectedPayRun)?.PayRunPeriodStartDate), 'MMM d')} - ${format(new Date(draftPayRuns.find(run => run.PayRunID === selectedPayRun)?.PayRunPeriodEndDate), 'MMM d, yyyy')}`
                  : 'Select Pay Run'
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
            onClick={handleSubmit}
            disabled={isSubmitting || isSubmitted || !data?.entries.length || !selectedPayRun}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isSubmitted ? 'Submitted' : 'Submit to Xero'}
          </Button>
        </div>
      </div>

      <Card>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="mt-8 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                        Employee
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Hours/Week
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Standard Hours
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Total Hours
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Overtime Hours
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Projects
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data?.entries.map((entry) => (
                      <tr key={entry.userId}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                          <div className="font-medium text-gray-900">{entry.userName}</div>
                          <div className="text-gray-500">{entry.overtimeType === 'no' ? 'No Overtime' : entry.overtimeType === 'billable' ? 'Billable Only' : 'All Hours'}</div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {entry.hoursPerWeek}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {(entry.hoursPerWeek * workingDays / 5).toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {entry.totalHours.toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`font-medium ${entry.overtimeHours > 0 ? 'text-yellow-600' : 'text-gray-500'}`}>
                            <span className="ml-2 font-medium">
                              {entry.overtimeHours.toFixed(2)}
                            </span>
                          </span>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          <div className="space-y-1">
                            {entry.projects.map(project => (
                              <div key={project.projectId} className="flex items-center gap-2">
                                <span className="flex-1">{project.projectName}</span>
                                {project.requiresApproval && (
                                  <Badge 
                                    variant={
                                      project.approvalStatus === 'not required' ? 'secondary' :
                                      project.approvalStatus === 'approved' ? 'success' :
                                      project.approvalStatus === 'pending' ? 'warning' :
                                      project.approvalStatus === 'rejected' ? 'destructive' :
                                      'default'
                                    }
                                    className="text-xs"
                                  >
                                    {project.approvalStatus === 'not required' ? 'No Approval Required' :
                                     project.approvalStatus.charAt(0).toUpperCase() + project.approvalStatus.slice(1)}
                                  </Badge>
                                )}
                                <span className="font-medium text-gray-900 min-w-[60px] text-right">
                                  {project.hours.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-200">
                      <th scope="row" colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        Total Overtime Hours:
                      </th>
                      <td className="px-3 py-3 text-sm font-medium text-yellow-600">
                        {data?.summary.totalOvertimeHours.toFixed(2)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}