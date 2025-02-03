import { useMemo, useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, Th, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { EditableTimeCell } from '@/components/ui/EditableTimeCell';
import { formatCurrency } from '@/lib/utils/currency';
import { format, parseISO } from 'date-fns';
import { getSellRateForDate, getCostRateForMonth, getAverageSellRate } from '@/lib/utils/rates';
import { usePublicHolidays } from '@/lib/hooks/usePublicHolidays';
import { Users, Briefcase, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useLeaveForecasts } from '@/lib/hooks/useLeaveForecasts';
import { useBonuses } from '@/lib/hooks/useBonuses';
import type { User, Project } from '@/types';

interface UserForecastTableProps {
  users: User[];
  projects: Project[];
  forecasts: any[];
  month: string;
  workingDays: number;
  selectedForecast?: any;
  onForecastChange?: (changes: any) => void;
}

export function UserForecastTable({
  users,
  projects,
  forecasts,
  month,
  workingDays,
  selectedForecast,
  onForecastChange
}: UserForecastTableProps) {
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [localData, setLocalData] = useState<Record<string, any>>({});

  const { leaveData } = useLeaveForecasts(month);
  const { holidays } = usePublicHolidays(month);
  const { bonuses } = useBonuses(month);

  // Create combined array of regular users and potential staff
  const allUsers = useMemo(() => {
    return users;
  }, [users, forecasts]);
  
  // Get total bonuses for a user in the selected month
  const getUserBonuses = useCallback((userId: string) => {
    return bonuses
      .filter(bonus => bonus.employeeId === userId)
      .reduce((sum, bonus) => sum + bonus.amount, 0);
  }, [bonuses]);

  // Initialize local data from selected forecast
  useEffect(() => {
    const newLocalData = {};
    const monthStart = new Date(month + '-01');
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0);

    if (Array.isArray(forecasts)) {
      // Initialize from forecasts array
      forecasts.forEach(entry => {
        if (entry && entry.userId) {
          let forecastHours = entry.forecastHours;
          
          // Adjust hours for potential staff based on start date
          if (entry.isPotential && entry.startDate) {
            const startDate = new Date(entry.startDate);
            if (startDate > monthEnd) {
              // Starting in future month
              forecastHours = 0;
            } else if (startDate > monthStart) {
              // Starting this month - pro-rate the hours
              const remainingWorkingDays = workingDays * (monthEnd.getDate() - startDate.getDate() + 1) / monthEnd.getDate();
              forecastHours = (entry.hoursPerWeek / 5) * remainingWorkingDays;
            }
          }

          newLocalData[entry.userId] = {
            hoursPerWeek: entry.hoursPerWeek,
            billablePercentage: entry.billablePercentage,
            sellRate: entry.sellRate,
            costRate: entry.costRate,
            plannedBonus: entry.plannedBonus,
            forecastHours,
            name: entry.name,
            isPotential: entry.isPotential,
            startDate: entry.startDate
          };
        }
      });
    } else {
      // Initialize with default values from user data
      users.forEach(user => {
        const averageSellRate = getAverageSellRate(projects, user.id, month + '-01');
        const totalBonuses = getUserBonuses(user.id);
        const costRate = getCostRateForMonth(user.costRate || [], month);

        newLocalData[user.id] = {
          hoursPerWeek: user.hoursPerWeek || 40,
          billablePercentage: user.estimatedBillablePercentage || 0,
          sellRate: averageSellRate,
          costRate: costRate,
          plannedBonus: totalBonuses,
          forecastHours: (user.hoursPerWeek || 40) * (workingDays / 5)
        };
      });
    }
    
    setLocalData(newLocalData);
  }, [selectedForecast, users, month, workingDays, projects, getUserBonuses]);

  const handleCellChange = (userId: string, field: string, value: number) => {
    const newData = {
      ...localData,
      [userId]: {
        ...localData[userId],
        [field]: value
      }
    };

    // If changing hoursPerWeek, recalculate forecast hours based on start date
    if (field === 'hoursPerWeek') {
      const userData = localData[userId];
      if (userData.isPotential && userData.startDate) {
        const startDate = new Date(userData.startDate);
        const monthStart = new Date(month + '-01');
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);

        // Calculate forecast hours based on start date
        if (startDate > monthEnd) {
          // Starting in future month
          newData[userId].forecastHours = 0;
        } else if (startDate > monthStart) {
          // Starting this month - pro-rate the hours
          const remainingWorkingDays = workingDays * (monthEnd.getDate() - startDate.getDate() + 1) / monthEnd.getDate();
          newData[userId].forecastHours = (value / 5) * remainingWorkingDays;
        } else {
          // Started in previous month or at start of this month
          newData[userId].forecastHours = (value / 5) * workingDays;
        }
      }
    }

    setLocalData(newData);
    
    if (onForecastChange) {
      const entries = users.map(user => {
        const defaultData = {
          hoursPerWeek: user.hoursPerWeek || 40,
          billablePercentage: user.estimatedBillablePercentage || 0,
          sellRate: getAverageSellRate(projects, user.id, month + '-01'),
          costRate: getCostRateForMonth(user.costRate || [], month),
          plannedBonus: getUserBonuses(user.id),
          forecastHours: (user.hoursPerWeek || 40) * (workingDays / 5)
        };

        const userData = newData[user.id] || defaultData;
        const plannedLeave = leaveData?.leave
          ?.filter(leave => leave.employeeId === user.xeroEmployeeId && leave.status === 'SCHEDULED')
          ?.reduce((sum, leave) => sum + leave.numberOfUnits, 0) || 0;

        return {
          userId: user.id,
          hoursPerWeek: userData.hoursPerWeek,
          billablePercentage: userData.billablePercentage,
          forecastHours: userData.forecastHours,
          sellRate: userData.sellRate,
          costRate: userData.costRate,
          plannedBonus: userData.plannedBonus,
          plannedLeave: plannedLeave,
          publicHolidays: holidays.length * 8
        };
      });
      onForecastChange(entries);
    }
  };

  // Separate users by type
  const { employees, contractors } = useMemo(() => {
    return allUsers.reduce((acc, user) => {
      if (user.employeeType === 'employee') {
        acc.employees.push(user);
      } else if (user.employeeType === 'contractor') {
        acc.contractors.push(user);
      }
      return acc;
    }, { employees: [] as any[], contractors: [] as any[] });
  }, [allUsers]);

  const renderUserTable = (users: User[], title: string, isEmployee: boolean) => {
    if (users.length === 0) return null;


    return (
      <>
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
            {isEmployee ? (
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
            ) : (
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Briefcase className="h-5 w-5 text-emerald-600" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">
                {users.length} {users.length === 1 ? 'person' : 'people'}
              </p>
            </div>
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <tr>
              <Th>User</Th>
              <Th className="text-center">Hours/Week</Th>
              <Th className="text-center">Billable %</Th>
              <Th className="text-center">Sell Rate</Th>
              <Th className="text-center">Cost Rate</Th>
              {isEmployee && (
                <>
                  <Th className="text-center">Public Holidays</Th>
                  <Th className="text-center">Planned Leave</Th>
                  <Th className="text-center">Bonus</Th>
                </>
              )}
              <Th className="text-center">Forecast Hours</Th>
            </tr>
          </TableHeader>
          <TableBody>
            {users.map(user => {
              const userData = localData[user.id] || {
                hoursPerWeek: user.hoursPerWeek || 40,
                billablePercentage: user.estimatedBillablePercentage || 0,
                sellRate: 0,
                costRate: getCostRateForMonth(user.costRate || [], month),
                plannedBonus: 0,
                forecastHours: (user.hoursPerWeek || 40) * (workingDays / 5)
              };

              return (
                <tr key={user.id}>
                  <Td className="font-medium">
                    {user.name}
                  </Td>
                  <Td className="text-right p-0">
                    <EditableTimeCell
                      className="text-center"
                      value={userData.hoursPerWeek}
                      onChange={(value) => handleCellChange(user.id, 'hoursPerWeek', value)}
                      isEditing={editingCell === `${user.id}-hoursPerWeek`}
                      isDisabled={!selectedForecast}
                      onStartEdit={() => setEditingCell(`${user.id}-hoursPerWeek`)}
                      onEndEdit={() => setEditingCell(null)}
                    />
                  </Td>
                  <Td className="text-right p-0">
                    <EditableTimeCell
                      className="text-center"
                      value={userData.billablePercentage}
                      onChange={(value) => handleCellChange(user.id, 'billablePercentage', value)}
                      isEditing={editingCell === `${user.id}-billable`}
                      isDisabled={!selectedForecast}
                      onStartEdit={() => setEditingCell(`${user.id}-billable`)}
                      onEndEdit={() => setEditingCell(null)}
                    />
                  </Td>
                  <Td className="text-right p-0">
                    <EditableTimeCell
                      className="text-center"
                      value={userData.sellRate}
                      onChange={(value) => handleCellChange(user.id, 'sellRate', value)}
                      isEditing={editingCell === `${user.id}-sellRate`}
                      isDisabled={!selectedForecast}
                      onStartEdit={() => setEditingCell(`${user.id}-sellRate`)}
                      onEndEdit={() => setEditingCell(null)}
                    />
                  </Td>
                  <Td className="text-right p-0">
                    <EditableTimeCell
                      className="text-center"
                      value={userData.costRate}
                      onChange={(value) => handleCellChange(user.id, 'costRate', value)}
                      isEditing={editingCell === `${user.id}-costRate`}
                      isDisabled={!selectedForecast}
                      onStartEdit={() => setEditingCell(`${user.id}-costRate`)}
                      onEndEdit={() => setEditingCell(null)}
                    />
                  </Td>
                  {isEmployee && (
                    <>
                      <Td className="text-center">
                        <Badge variant="secondary">
                          {(holidays.length * 8).toFixed(1)} hrs
                        </Badge>
                      </Td>
                      <Td className="text-center">
                        {(() => {
                          if (!leaveData?.leave) return <Badge variant="secondary">No Data</Badge>;

                          const userLeave = leaveData.leave.filter(leave => 
                            leave.employeeId === user.xeroEmployeeId &&
                            leave.status === 'SCHEDULED'
                          );
                          
                          if (userLeave.length === 0) return <Badge variant="secondary">None</Badge>;
                          
                          const totalHours = userLeave.reduce((sum, leave) => 
                            sum + leave.numberOfUnits, 0
                          );
                          
                          return (
                            <Badge variant="warning">
                              {totalHours.toFixed(1)} hrs
                            </Badge>
                          );
                        })()}
                      </Td>
                      <Td className="text-right p-0">
                        <EditableTimeCell
                          className="text-center"
                          value={userData.plannedBonus}
                          onChange={(value) => handleCellChange(user.id, 'plannedBonus', value)}
                          isEditing={editingCell === `${user.id}-bonus`}
                          isDisabled={!selectedForecast}
                          onStartEdit={() => setEditingCell(`${user.id}-bonus`)}
                          onEndEdit={() => setEditingCell(null)}
                        />
                      </Td>
                    </>
                  )}
                  <Td className="text-right p-0">
                    <EditableTimeCell
                      className="text-center"
                      value={userData.forecastHours}
                      onChange={(value) => handleCellChange(user.id, 'forecastHours', value)}
                      isEditing={editingCell === `${user.id}-forecast`}
                      isDisabled={!selectedForecast}
                      onStartEdit={() => setEditingCell(`${user.id}-forecast`)}
                      onEndEdit={() => setEditingCell(null)}
                    />
                  </Td>
                </tr>
              );
            })}
          </TableBody>
        </Table>
        </Card>
      </>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-8">
      {renderUserTable(employees, "Employees", true)}
      {renderUserTable(contractors, "Contractors", false)}
    </div>
  );
}