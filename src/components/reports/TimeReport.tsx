import { useState } from 'react';
import { ReportFilters } from './ReportFilters';
import { ReportTable } from './ReportTable';
import { ReportSummary } from './ReportSummary';
import { useReports } from '@/lib/hooks/useReports';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReportFilters as ReportFiltersType } from '@/types';

const ITEMS_PER_PAGE = 50;

interface TimeReportProps {
  filters: ReportFiltersType;
  onFiltersChange: (filters: ReportFiltersType) => void;
}

export function TimeReport({ filters, onFiltersChange }: TimeReportProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading } = useReports({ ...filters, type: 'time' });

  if (isLoading) {
    return <LoadingScreen />;
  }


  return (
    <div className="space-y-6">
      <ReportFilters filters={filters} onChange={onFiltersChange} />
      <ReportSummary data={data?.summary} />
      <ReportTable data={data?.entries} approvals={data?.approvals} />
      
    </div>
  );
}