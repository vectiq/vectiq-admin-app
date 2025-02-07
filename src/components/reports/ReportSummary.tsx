import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/currency';
import { Clock, DollarSign, Calculator, TrendingUp } from 'lucide-react';

interface ReportSummaryProps {
  data?: {
    summary: {
      totalHours: number;
      totalCost: number;
      totalRevenue: number;
      profitMargin: number;
    };
  };
}

export function ReportSummary({ data }: ReportSummaryProps) {
  if (!data?.summary) return null;

  const { totalHours, totalCost, totalRevenue, profitMargin } = data.summary;
  const grossMargin = totalRevenue - totalCost;

  return (
    <div className="grid grid-cols-4 gap-8">
      {/* Revenue Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 shadow-sm ring-1 ring-blue-100">
        <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-10 rounded-full" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 text-blue-600 mb-4">
            <DollarSign className="h-5 w-5" />
            <h3 className="font-semibold">Revenue</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(totalRevenue)}
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
            <h3 className="font-semibold">Cost</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(totalCost)}
          </p>
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
            {formatCurrency(grossMargin)}
          </p>
        </div>
      </div>

      {/* Total Hours Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-white rounded-xl p-6 shadow-sm ring-1 ring-indigo-100">
        <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-indigo-600 opacity-10 rounded-full" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 text-indigo-600 mb-4">
            <Clock className="h-5 w-5" />
            <h3 className="font-semibold">Total Hours</h3>
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold text-gray-900">
              {totalHours.toFixed(1)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}