import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/currency';
import { getSellRateForDate, getCostRateForMonth } from '@/lib/utils/rates';
import { format } from 'date-fns';
import { DollarSign, TrendingUp, PieChart, Calculator } from 'lucide-react';
import type { User, Project, ForecastEntry } from '@/types';

interface ForecastSummaryCardProps {
  users: User[];
  projects: Project[];
  forecasts: ForecastEntry[];
  month: string;
  workingDays: number;
  holidays: { date: string }[];
  bonuses: { employeeId: string; amount: number }[];
}

export function ForecastSummaryCard({
  users,
  projects,
  forecasts,
  month,
  workingDays,
  holidays,
  bonuses
}: ForecastSummaryCardProps) {
  const summary = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalBonuses = 0;

    // Calculate totals from forecast entries
    forecasts.forEach(entry => {
      const user = users.find(u => u.id === entry.userId);
      if (!user) return;

      const forecastHours = entry.forecastHours || 0;
      const sellRate = entry.sellRate || 0;
      const costRate = entry.costRate || 0;
      const plannedBonus = entry.plannedBonus || 0;

      totalRevenue += forecastHours * sellRate;
      totalCost += forecastHours * costRate;
      totalBonuses += plannedBonus;
    });

    totalCost += totalBonuses;

    // Calculate margin
    const grossMargin = totalRevenue - totalCost;
    const marginPercent = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;

    return {
      revenue: totalRevenue,
      cost: totalCost,
      bonuses: totalBonuses,
      grossMargin,
      marginPercent
    };
  }, [forecasts, users]);

  return (
    <Card className="p-6 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-tr from-blue-500/5 to-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="grid grid-cols-4 gap-8 relative">
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
              {formatCurrency(summary.revenue)}
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
              {formatCurrency(summary.cost)}
            </p>
            {summary.bonuses > 0 && (
              <p className="mt-2 text-sm text-purple-600">
                Includes {formatCurrency(summary.bonuses)} in bonuses
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
              {formatCurrency(summary.grossMargin)}
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
                {summary.marginPercent.toFixed(1)}
              </p>
              <span className="text-gray-500">%</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}