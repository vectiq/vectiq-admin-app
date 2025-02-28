import { useState } from 'react';
import { format, startOfMonth, addMonths, subMonths, endOfMonth } from 'date-fns';
import { useOvertime } from '@/lib/hooks/useOvertime';
import { useUsers } from '@/lib/hooks/useUsers';
import { getWorkingDaysForMonth } from '@/lib/utils/workingDays';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, Th, Td } from '@/components/ui/Table';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { DateNavigation } from '@/components/ui/DateNavigation';
import { Loader2 } from 'lucide-react';

export default function Overtime() {
  const [currentDate, setCurrentDate] = useState(startOfMonth(new Date()));
  const { currentUser, managedTeam, isTeamManager } = useUsers();
  const { users } = useUsers();
  const workingDays = getWorkingDaysForMonth(format(currentDate, 'yyyy-MM'));
  const { data, isLoading } = useOvertime({
    startDate: format(startOfMonth(currentDate), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(currentDate), 'yyyy-MM-dd')
  });

  const handlePrevious = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNext = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(startOfMonth(new Date()));

  // Filter entries based on team manager status
  const filteredEntries = data?.entries.filter(entry => {
    if (isTeamManager) {
      // Team managers only see entries from their team members
      const user = users.find(u => u.id === entry.userId);
      return user?.teamId === managedTeam?.id;
    }
    // Admins see all entries
    return currentUser?.role === 'admin';
  });

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Overtime Approval</h1>
          {isTeamManager && (
            <p className="mt-1 text-sm text-gray-500">
              Managing overtime for {managedTeam.name}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <DateNavigation
            currentDate={currentDate}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onToday={handleToday}
            formatString="MMMM yyyy"
          />
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
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredEntries?.map((entry) => (
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
                        <td className="px-3 py-4 text-sm">
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={entry.projects.every(p => 
                                p.approvalStatus === 'approved' || p.approvalStatus === 'not required'
                              )}
                            >
                              Approve All
                            </Button>
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