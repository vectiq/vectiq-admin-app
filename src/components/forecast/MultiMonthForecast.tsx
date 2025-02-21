import { useState, useEffect, useMemo } from 'react';
import { format, eachMonthOfInterval, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronDown, ChevronUp, DollarSign, TrendingUp, PieChart, Calculator, Users } from 'lucide-react';
import { DateRangeSelector } from '@/components/reports/DateRangeSelector'; 
import { Table, TableHeader, TableBody, Th, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { calculateForecastTotals } from '@/lib/utils/forecast';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { formatCurrency } from '@/lib/utils/currency';
import { Edit2, ChevronRight, Loader2 } from 'lucide-react';
import { getForecastData } from '@/lib/services/forecasts';
import { useUsers } from '@/lib/hooks/useUsers';
import { getWorkingDaysForUser } from '@/lib/utils/date';
import type { ForecastData } from '@/types';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MultiMonthForecastProps {
  startDate: Date;
  endDate: Date;
  onMonthSelect: (month: Date) => void;
  onDateRangeChange: (range: { startDate: string; endDate: string }) => void;
}

interface MonthlyData {
  month: string;
  data: ForecastData | null;
  isLoading: boolean;
  error: Error | null;
}

interface MonthlyData {
  month: string;
  data: ForecastData | null;
  isLoading: boolean;
  error: Error | null;
}

export function MultiMonthForecast({
  startDate,
  endDate,
  onMonthSelect,
  onDateRangeChange
}: MultiMonthForecastProps) {
  const { currentUser } = useUsers();
  const [isExpanded, setIsExpanded] = useState(false);

  // Get all months in the range
  const months = useMemo(() => 
    eachMonthOfInterval({ start: startDate, end: endDate }),
    [startDate, endDate]
  );

  const [monthlyData, setMonthlyData] = useState<Record<string, MonthlyData>>(() => {
    // Initialize with loading state for all months
    const initialData = {};
    eachMonthOfInterval({ start: startDate, end: endDate }).forEach(month => {
      const monthStr = format(month, 'yyyy-MM');
      initialData[monthStr] = {
        month: monthStr,
        data: null,
        isLoading: true,
        error: null
      };
    });
    return initialData;
  });
  
  // Fetch data for each month
  useEffect(() => {
    if (!currentUser?.id) return;

    async function fetchMonthData(month: string) {
      if (!currentUser?.id) return;
      
      try {
        const data = await getForecastData(month, currentUser.id);
        setMonthlyData(prev => {
          // Only update if the month still exists in state 
          if (!prev[month]) return prev;
          
          return {
            ...prev,
            [month]: {
              month,
              data: { ...data, month }, // Add month to data for reference
              isLoading: false,
              error: null
            }
          };
        });
      } catch (error) {
        setMonthlyData(prev => {
          // Only update if the month still exists in state
          if (!prev[month]) return prev;
          
          return {
            ...prev,
            [month]: {
              month,
              data: null,
              isLoading: false,
              error: error as Error
            }
          };
        });
      }
    }

    // Reset state for new date range
    const newMonthlyData = months.reduce((acc, month) => {
      const monthStr = format(month, 'yyyy-MM');
      acc[monthStr] = {
        month: monthStr,
        data: null,
        isLoading: true,
        error: null
      };
      return acc;
    }, {});
    
    setMonthlyData(newMonthlyData);

    // Fetch data for each month
    months.forEach(month => {
      const monthStr = format(month, 'yyyy-MM');
      fetchMonthData(monthStr);
    });
  }, [months, currentUser?.id, startDate, endDate]);

  const handleEditMonth = (month: Date) => {
    onMonthSelect(month);
  };

  // Calculate totals for each month
  const calculateMonthTotals = (monthData: ForecastData) => {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalBonuses = 0;
    let totalLeaveHours = 0;
    let employeeCount = 0;
    let contractorCount = 0;
    let totalHours = 0;

    // Get month boundaries from the data
    const monthDate = parseISO(monthData.month + '-01');
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);

    // Filter active users for this month
    const activeUsers = monthData.users.filter(user => {
      if (user.startDate && new Date(user.startDate) > monthEnd) return false;
      if (user.endDate && new Date(user.endDate) < monthStart) return false;
      return true;
    });

    // Count employees and contractors
    employeeCount = activeUsers.filter(u => u.employeeType === 'employee').length;
    contractorCount = activeUsers.filter(u => u.employeeType === 'contractor').length;

    // Process employees
    activeUsers.filter(u => u.employeeType === 'employee').forEach(user => {
      const deltas = monthData.deltas || {};
      
      // Calculate effective working days for this user
      const effectiveWorkingDays = getWorkingDaysForUser(
        monthStart,
        monthEnd,
        user.startDate,
        user.endDate
      );

      // Get user values with any deltas applied
      const hoursPerWeek = deltas[`${user.id}_hoursPerWeek`]?.value ?? (user.hoursPerWeek || 40);
      const billablePercentage = deltas[`${user.id}_billablePercentage`]?.value ?? (user.estimatedBillablePercentage || 0);
      const sellRate = deltas[`${user.id}_sellRate`]?.value ?? (user.currentSellRate || 0);
      const costRate = deltas[`${user.id}_costRate`]?.value ?? (user.currentCostRate || 0);
      const bonus = deltas[`${user.id}_plannedBonus`]?.value ?? (monthData.bonuses[user.id] || 0);

      // Calculate hours
      const baseHours = (hoursPerWeek / 5) * effectiveWorkingDays;
      const billableHours = baseHours * (billablePercentage / 100);
      const holidayHours = monthData.holidays.length * 8;
      const leaveHours = monthData.leave
        .filter(l => l.employeeId === user.xeroEmployeeId)
        .reduce((sum, l) => sum + l.numberOfUnits, 0);
      totalLeaveHours += leaveHours;
      
      const forecastHours = Math.max(0, billableHours - holidayHours - leaveHours);

      // Add to totals
      totalHours += forecastHours;
      totalRevenue += forecastHours * sellRate;
      totalCost += forecastHours * costRate;
      totalBonuses += bonus;
    });

    // Process contractors 
    activeUsers.filter(u => u.employeeType === 'contractor').forEach(user => {
      const deltas = monthData.deltas || {};
      
      // Calculate effective working days for this user
      const effectiveWorkingDays = getWorkingDaysForUser(
        monthStart,
        monthEnd,
        user.startDate,
        user.endDate
      );

      // Get user values with any deltas applied
      const hoursPerWeek = deltas[`${user.id}_hoursPerWeek`]?.value ?? (user.hoursPerWeek || 40);
      const sellRate = deltas[`${user.id}_sellRate`]?.value ?? (user.currentSellRate || 0);
      const costRate = deltas[`${user.id}_costRate`]?.value ?? (user.currentCostRate || 0);
      const bonus = deltas[`${user.id}_plannedBonus`]?.value ?? (monthData.bonuses[user.id] || 0);

      // Calculate hours
      const baseHours = (hoursPerWeek / 5) * effectiveWorkingDays;
      const holidayHours = monthData.holidays.length * 8;
      const forecastHours = Math.max(0, baseHours - holidayHours);

      // Add to totals
      totalHours += forecastHours;
      totalRevenue += forecastHours * sellRate;
      totalCost += forecastHours * costRate;
      totalBonuses += bonus;
    });

    // Return totals
    return {
      hours: totalHours,
      revenue: totalRevenue,
      cost: totalCost + totalBonuses, // Add bonuses to total cost
      leaveHours: totalLeaveHours,
      bonuses: totalBonuses,
      margin: totalRevenue - (totalCost + totalBonuses),
      marginPercent: totalRevenue > 0 ? ((totalRevenue - (totalCost + totalBonuses)) / totalRevenue) * 100 : 0,
      employeeCount,
      contractorCount
    };
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Forecast Revenue */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm ring-1 ring-blue-100">
          <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-10 rounded-full" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 text-blue-600 mb-4">
              <DollarSign className="h-5 w-5" />
              <h3 className="font-semibold">Total Revenue</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(
                Object.values(monthlyData)
                  .filter(m => m.data)
                  .reduce((sum, m) => sum + calculateMonthTotals(m.data).revenue, 0)
              )}
            </p>
          </div>
        </Card>

        {/* Total Forecast Cost */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-white p-6 shadow-sm ring-1 ring-purple-100">
          <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-10 rounded-full" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 text-purple-600 mb-4">
              <Calculator className="h-5 w-5" />
              <h3 className="font-semibold">Total Cost</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(
                Object.values(monthlyData)
                  .filter(m => m.data)
                  .reduce((sum, m) => sum + calculateMonthTotals(m.data).cost, 0)
              )}
            </p>
          </div>
        </Card>

        {/* Average Margin */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm ring-1 ring-emerald-100">
          <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-600 opacity-10 rounded-full" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 text-emerald-600 mb-4">
              <TrendingUp className="h-5 w-5" />
              <h3 className="font-semibold">Average Margin</h3>
            </div>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-bold text-gray-900">
                {(() => {
                  const months = Object.values(monthlyData).filter(m => m.data);
                  const avgMargin = months.reduce((sum, m) => 
                    sum + calculateMonthTotals(m.data).marginPercent, 0
                  ) / (months.length || 1);
                  return avgMargin.toFixed(1);
                })()}
              </p>
              <span className="text-gray-500">%</span>
            </div>
          </div>
        </Card>

        {/* Average Headcount */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm ring-1 ring-indigo-100">
          <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-600 opacity-10 rounded-full" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 text-emerald-600 mb-4">
              <TrendingUp className="h-5 w-5" />
              <h3 className="font-semibold">Total Profit</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(
                Object.values(monthlyData)
                  .filter(m => m.data)
                  .reduce((sum, m) => sum + calculateMonthTotals(m.data).margin, 0)
              )}
            </p>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Cost Trend */}
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-6">Revenue vs Cost Trend</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={Object.entries(monthlyData)
                  .filter(([_, m]) => m.data)
                  .map(([month, m]) => {
                    const totals = calculateMonthTotals(m.data);
                    return {
                      month: format(parseISO(month + '-01'), 'MMM yyyy'),
                      revenue: totals.revenue,
                      cost: totals.cost
                    };
                  })}
                margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  angle={-45} 
                  textAnchor="end" 
                  height={60}
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#4F46E5"
                  name="Revenue"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="cost"
                  stroke="#7C3AED"
                  name="Cost"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Headcount Trend */}
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-6">Headcount Trend</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(monthlyData)
                  .filter(([_, m]) => m.data)
                  .map(([month, m]) => {
                    const totals = calculateForecastTotals(m.data);
                    return {
                      month: format(parseISO(month + '-01'), 'MMM yyyy'),
                      Employees: totals.employeeCount,
                      Contractors: totals.contractorCount
                    };
                  })}
                margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  angle={-45} 
                  textAnchor="end" 
                  height={60}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="Employees" 
                  fill="#4F46E5" 
                  stackId="staff"
                />
                <Bar 
                  dataKey="Contractors" 
                  fill="#7C3AED" 
                  stackId="staff"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      {/* Date Range Selector */}
      <div className="flex justify-end">
        <DateRangeSelector
          value={{
            startDate: format(startDate, 'yyyy-MM-dd'),
            endDate: format(endDate, 'yyyy-MM-dd')
          }}
          onChange={onDateRangeChange}
        />
      </div>

      {/* Months Table */}
      <Card className="divide-y divide-gray-200">
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </Button>
            <h3 className="font-medium text-gray-900">Monthly Breakdown</h3>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div>
            <Table>
              <TableHeader>
                <tr>
                  <Th>Month</Th>
                  <Th>Staff</Th>
                  <Th className="text-right">Forecast Hours</Th>
                  <Th className="text-right">Leave Hours</Th>
                  <Th className="text-right">Bonuses</Th>
                  <Th className="text-right">Expenses</Th>
                  <Th className="text-right">Revenue</Th>
                  <Th className="text-right">Cost</Th>
                  <Th className="text-right">Margin</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </TableHeader>
              <TableBody>
                {months.map(month => {
                  const monthStr = format(month, 'yyyy-MM');
                  const monthData = monthlyData[monthStr];

                  if (!monthData || monthData.isLoading) {
                    return (
                      <tr key={monthStr}>
                        <Td className="font-medium">{format(month, 'MMMM yyyy')}</Td>
                        <Td colSpan={5} className="text-center">
                          <div className="flex items-center justify-center gap-2 text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading...
                          </div>
                        </Td>
                      </tr>
                    );
                  }

                  if (monthData.error) {
                    return (
                      <tr key={monthStr}>
                        <Td className="font-medium">{format(month, 'MMMM yyyy')}</Td>
                        <Td colSpan={5} className="text-center">
                          <div className="text-red-500">Failed to load data</div>
                        </Td>
                      </tr>
                    );
                  }

                  const totals = calculateForecastTotals(monthData.data);

                  return (
                    <tr key={monthStr}>
                      <Td className="font-medium">
                        {format(month, 'MMMM yyyy')}
                      </Td>
                      <Td>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {totals.employeeCount} Employees
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {totals.contractorCount} Contractors
                            </Badge>
                          </div>
                        </div>
                      </Td>
                      <Td className="text-right">
                        {totals.hours.toFixed(1)}
                      </Td>
                      <Td className="text-right">
                        {totals.leaveHours.toFixed(1)}
                      </Td>
                      <Td className="text-right">
                        {formatCurrency(totals.bonuses)}
                      </Td>
                      <Td className="text-right">
                        {formatCurrency(monthData.data.expenses || 0)}
                      </Td>
                      <Td className="text-right">
                        {formatCurrency(totals.revenue)}
                      </Td>
                      <Td className="text-right">
                        {formatCurrency(totals.cost)}
                      </Td>
                      <Td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {formatCurrency(totals.margin)}
                          <Badge
                            variant={totals.marginPercent >= 30 ? 'success' : 'warning'}
                          >
                            {totals.marginPercent.toFixed(1)}%
                          </Badge>
                        </div>
                      </Td>
                      <Td>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEditMonth(month)}
                            className="group"
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                            <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                          </Button>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}