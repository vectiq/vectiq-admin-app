import { useState, useEffect, useMemo, useCallback } from 'react';
import { format, eachMonthOfInterval } from 'date-fns';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/Select';
import { DateRangeSelector } from '@/components/reports/DateRangeSelector';
import { Plus, DollarSign, TrendingUp, PieChart, Calculator, Users, ArrowUpRight, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils/currency';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { SavedForecast } from '@/types';

interface MultiMonthForecastProps {
  startDate: Date;
  endDate: Date;
  onDateRangeChange: (range: { startDate: string; endDate: string }) => void;
}

interface MonthForecasts {
  [key: string]: SavedForecast[];
}

async function fetchMonthForecasts(month: string): Promise<SavedForecast[]> {
  const forecastsRef = collection(db, 'forecasts');
  const q = query(forecastsRef, where('month', '==', month));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as SavedForecast[];
}

export function MultiMonthForecast({
  startDate,
  endDate,
  onDateRangeChange
}: MultiMonthForecastProps) {
  const navigate = useNavigate();
  const [monthForecasts, setMonthForecasts] = useState<MonthForecasts>({});
  const [selectedForecasts, setSelectedForecasts] = useState<Record<string, string>>({});
  const [isSelectionExpanded, setIsSelectionExpanded] = useState(true);

  // Get all months in the range
  const months = useMemo(() => {
    return eachMonthOfInterval({ start: startDate, end: endDate });
  }, [startDate, endDate]);
  
  // Calculate month-over-month changes
  const monthlyTrends = useMemo(() => {
    const trends = months.map(month => {
      const monthStr = format(month, 'yyyy-MM');
      const forecast = monthForecasts[monthStr]?.find(f => f.id === selectedForecasts[monthStr]);
      
      if (!forecast) return {
        month: format(month, 'MMM yyyy'),
        revenue: 0,
        cost: 0,
        margin: 0,
        headcount: 0
      };

      let revenue = 0;
      let cost = 0;
      let headcount = 0;
      let potentialHeadcount = 0;

      forecast.entries.forEach(entry => {
        const forecastHours = entry.forecastHours || 0;
        const sellRate = entry.sellRate || 0;
        const costRate = entry.costRate || 0;
        const plannedBonus = entry.plannedBonus || 0;

        revenue += forecastHours * sellRate;
        cost += (forecastHours * costRate) + plannedBonus;
        
        if (entry.isPotential) {
          potentialHeadcount++;
        } else {
          headcount++;
        }
      });

      return {
        month: format(month, 'MMM yyyy'),
        revenue,
        cost,
        margin: revenue - cost,
        headcount,
        potentialHeadcount
      };
    });

    return trends;
  }, [months, monthForecasts, selectedForecasts]);

  // Calculate growth rates
  const growthRates = useMemo(() => {
    if (monthlyTrends.length < 2) return { revenue: 0, headcount: 0 };
    
    const firstMonth = monthlyTrends[0];
    const lastMonth = monthlyTrends[monthlyTrends.length - 1];
    
    const monthsCount = monthlyTrends.length - 1;
    
    const revenueGrowth = firstMonth.revenue === 0 ? 0 :
      ((lastMonth.revenue - firstMonth.revenue) / firstMonth.revenue) * 100;
      
    const headcountGrowth = firstMonth.headcount === 0 ? 0 :
      ((lastMonth.headcount - firstMonth.headcount) / firstMonth.headcount) * 100;
      
    return {
      revenue: revenueGrowth / monthsCount, // Monthly rate
      headcount: headcountGrowth / monthsCount // Monthly rate
    };
  }, [monthlyTrends]);
  // Calculate totals from selected forecasts
  const totals = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalBonuses = 0;
    let totalHours = 0;

    Object.entries(selectedForecasts).forEach(([month, forecastId]) => {
      const forecast = monthForecasts[month]?.find(f => f.id === forecastId);
      if (!forecast) return;

      forecast.entries.forEach(entry => {
        const forecastHours = entry.forecastHours || 0;
        const sellRate = entry.sellRate || 0;
        const costRate = entry.costRate || 0;
        const plannedBonus = entry.plannedBonus || 0;

        totalRevenue += forecastHours * sellRate;
        totalCost += (forecastHours * costRate) + plannedBonus;
        totalBonuses += plannedBonus;
        totalHours += forecastHours;
      });
    });

    const grossMargin = totalRevenue - totalCost;
    const marginPercent = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;

    return {
      revenue: totalRevenue,
      cost: totalCost,
      bonuses: totalBonuses,
      hours: totalHours,
      grossMargin,
      marginPercent
    };
  }, [selectedForecasts, monthForecasts]);

  // Fetch forecasts for each month
  useEffect(() => {
    const fetchForecasts = async () => {
      const forecasts: MonthForecasts = {};
      try {
        for (const month of months) {
          const monthStr = format(month, 'yyyy-MM');
          const monthForecasts = await fetchMonthForecasts(monthStr);
          forecasts[monthStr] = monthForecasts;
        }
        setMonthForecasts(forecasts);
      } catch (error) {
        console.error('Error fetching forecasts:', error);
      }
    };
    
    fetchForecasts();
  }, [months]);

  const handleSelectForecast = useCallback((month: Date, forecastId: string) => {
    const monthStr = format(month, 'yyyy-MM');
    setSelectedForecasts(prev => ({
      ...prev,
      [monthStr]: forecastId
    }));
  }, []);

  const handleCreateForecast = useCallback((month: Date) => {
    const params = new URLSearchParams();
    params.set('view', 'monthly');
    params.set('month', format(month, 'yyyy-MM'));
    navigate(`/forecast?${params.toString()}`);
  }, [navigate]);


  return (
    <div className="space-y-6">
      <Card>
        <div className="p-4 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSelectionExpanded(!isSelectionExpanded)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {isSelectionExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </Button>
            <h3 className="font-medium text-gray-900">Forecast Selection</h3>
          </div>
          <DateRangeSelector
            value={{
              startDate: format(startDate, 'yyyy-MM-dd'),
              endDate: format(endDate, 'yyyy-MM-dd')
            }}
            onChange={onDateRangeChange}
          />
        </div>

        {isSelectionExpanded && (
          <div className="divide-y divide-gray-200">
            {months.map((month) => {
              const monthStr = format(month, 'yyyy-MM');
              const forecasts = monthForecasts[monthStr] || [];

              return (
                <div key={monthStr} className="flex items-center justify-between p-4">
                  <div className="font-medium">
                    {format(month, 'MMMM yyyy')}
                  </div>
                  <div className="flex items-center gap-3">
                    <Select
                      value={selectedForecasts[monthStr] || ''}
                      onValueChange={(value) => handleSelectForecast(month, value)}
                    >
                      <SelectTrigger className="w-[250px]">
                        {selectedForecasts[monthStr] 
                          ? forecasts.find(f => f.id === selectedForecasts[monthStr])?.name 
                          : forecasts.length > 0 ? 'Select Forecast' : 'No Forecasts'
                        }
                      </SelectTrigger>
                      <SelectContent>
                        {forecasts.map(forecast => (
                          <SelectItem 
                            key={forecast.id} 
                            value={forecast.id}
                          >
                            {forecast.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCreateForecast(month)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {Object.keys(selectedForecasts).length > 0 && !isSelectionExpanded && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500">
            {Object.keys(selectedForecasts).length} forecasts selected
          </div>
        </div>
      )}

      {Object.keys(selectedForecasts).length > 0 && (
        <>
        <div className="grid grid-cols-4 gap-8">
          {/* Revenue Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 shadow-sm ring-1 ring-blue-100">
            <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-10 rounded-full" />
            </div>
            <div className="relative">
              <div className="flex items-center gap-2 text-blue-600 mb-4">
                <DollarSign className="h-5 w-5" />
                <h3 className="font-semibold">Projected Revenue</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(totals.revenue)}
              </p>
            </div>
          </div>

          {/* Cost Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-white rounded-xl p-6 shadow-sm ring-1 ring-purple-100">
            <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-10 rounded-full" />
            </div>
            <div className="relative">
              <div className="flex items-center gap-2 text-purple-600 mb-4">
                <Calculator className="h-5 w-5" />
                <h3 className="font-semibold">Projected Cost</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(totals.cost)}
              </p>
              {totals.bonuses > 0 && (
                <p className="mt-2 text-sm text-purple-600">
                  Includes {formatCurrency(totals.bonuses)} in bonuses
                </p>
              )}
            </div>
          </div>

          {/* Gross Margin Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-white rounded-xl p-6 shadow-sm ring-1 ring-emerald-100">
            <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-600 opacity-10 rounded-full" />
            </div>
            <div className="relative">
              <div className="flex items-center gap-2 text-emerald-600 mb-4">
                <TrendingUp className="h-5 w-5" />
                <h3 className="font-semibold">Gross Margin</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(totals.grossMargin)}
              </p>
            </div>
          </div>

          {/* Margin Percentage Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-white rounded-xl p-6 shadow-sm ring-1 ring-indigo-100">
            <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-indigo-600 opacity-10 rounded-full" />
            </div>
            <div className="relative">
              <div className="flex items-center gap-2 text-indigo-600 mb-4">
                <PieChart className="h-5 w-5" />
                <h3 className="font-semibold">Margin Percentage</h3>
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-bold text-gray-900">
                  {totals.marginPercent.toFixed(1)}
                </p>
                <span className="text-gray-500">%</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Growth & Headcount Section */}
        <div className="grid grid-cols-2 gap-8 mt-8">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-6">Monthly Growth Rates</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <ArrowUpRight className="h-5 w-5" />
                  <span className="font-medium">Revenue Growth</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {growthRates.revenue.toFixed(1)}%
                </div>
                <p className="text-sm text-gray-500 mt-1">per month</p>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <Users className="h-5 w-5" />
                  <span className="font-medium">Headcount Growth</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {growthRates.headcount.toFixed(1)}%
                </div>
                <p className="text-sm text-gray-500 mt-1">per month</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-medium mb-6">Headcount Forecast</h3>
            <div className="space-y-4">
              {monthlyTrends.map(trend => (
                <div key={trend.month} className="flex items-center justify-between">
                  <span className="font-medium">{trend.month}</span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>{trend.headcount}</span>
                    </div>
                    {trend.potentialHeadcount > 0 && (
                      <div className="flex items-center gap-2 text-amber-600">
                        <Users className="h-4 w-4" />
                        <span>+{trend.potentialHeadcount}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-2 gap-8 mt-8">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-6">Revenue vs Cost Trend</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#4F46E5" 
                    name="Revenue"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cost" 
                    stroke="#7C3AED" 
                    name="Cost"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-medium mb-6">Monthly Margin Analysis</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar 
                    dataKey="margin" 
                    fill="#10B981"
                    name="Gross Margin" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        </>
      )}
    </div>
  );
}