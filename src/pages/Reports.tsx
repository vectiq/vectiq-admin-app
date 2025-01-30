import { useState, useCallback, useMemo } from 'react';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { ReportTabs } from '@/components/reports/ReportTabs';
import { TimeReport } from '@/components/reports/TimeReport';
import type { ReportFilters as ReportFiltersType } from '@/types';

export default function Reports() {
  // Get current month's date range
  const defaultDateRange = useMemo(() => {
    const now = new Date();
    return {
      startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(now), 'yyyy-MM-dd')
    };
  }, []);

  const [activeTab, setActiveTab] = useState('time');
  const [filters, setFilters] = useState<ReportFiltersType>({
    startDate: defaultDateRange.startDate,
    endDate: defaultDateRange.endDate,
    clientIds: [],
    projectIds: [],
    taskIds: [],
  });

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
      </div>

      <ReportTabs activeTab={activeTab} onTabChange={handleTabChange} />

        <TimeReport filters={filters} onFiltersChange={setFilters} />
    </div>
  );
}