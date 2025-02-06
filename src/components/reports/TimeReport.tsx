import { useState } from 'react';
import { ReportFilters } from './ReportFilters';
import { ReportTable } from './ReportTable';
import { ReportSummary } from './ReportSummary';
import { useReports } from '@/lib/hooks/useReports';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Clock, DollarSign, Calculator, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import type { ReportFilters as ReportFiltersType } from '@/types';

interface TimeReportProps {
  filters: ReportFiltersType;
  onFiltersChange: (filters: ReportFiltersType) => void;
}

export function TimeReport({ filters, onFiltersChange }: TimeReportProps) {
  const { data, isLoading } = useReports({ ...filters, type: 'time' });

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <ReportFilters 
        filters={filters} 
        onChange={onFiltersChange}
        data={data}
      />
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Clock className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Hours</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data?.summary.totalHours.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(data?.summary.totalRevenue || 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Calculator className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Cost</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(data?.summary.totalCost || 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Profit Margin</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data?.summary.profitMargin}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Time Entries Table */}
      <Card>
        <div className="p-6">
          <ReportTable data={data?.entries} />
        </div>
      </Card>
    </div>
  );
}