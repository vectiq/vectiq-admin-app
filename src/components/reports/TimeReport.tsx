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
      
      <ReportSummary data={data} />
      

      {/* Time Entries Table */}
      <Card>
        <div className="p-6">
          <ReportTable data={data?.entries} onFilter={(filteredData) => {
            // Recalculate summary based on filtered data
            const summary = filteredData.reduce((acc, entry) => ({
              totalHours: acc.totalHours + entry.hours,
              totalCost: acc.totalCost + entry.cost,
              totalRevenue: acc.totalRevenue + entry.revenue,
              profitMargin: 0
            }), {
              totalHours: 0,
              totalCost: 0,
              totalRevenue: 0,
              profitMargin: 0
            });
            
            // Calculate profit margin
            summary.profitMargin = summary.totalRevenue > 0
              ? Math.round(((summary.totalRevenue - summary.totalCost) / summary.totalRevenue) * 100)
              : 0;

            // Update data with new summary
            data.summary = summary;
          }} />
        </div>
      </Card>
    </div>
  );
}