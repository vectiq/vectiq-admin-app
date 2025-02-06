import { useState, useCallback, useMemo } from 'react';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { useUsers } from '@/lib/hooks/useUsers';
import { ReportTabs } from '@/components/reports/ReportTabs';
import { TimeReport } from '@/components/reports/TimeReport';
import type { ReportFilters as ReportFiltersType } from '@/types';

export default function Reports() {
  const { managedTeam, isTeamManager } = useUsers();

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
    teamId: isTeamManager ? managedTeam?.id : undefined
  });

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
        {isTeamManager && (
          <div className="text-sm text-gray-500">
            Showing data for team: <span className="font-medium">{managedTeam?.name}</span>
          </div>
        )}
      </div>

      <ReportTabs activeTab={activeTab} onTabChange={handleTabChange} />

        <TimeReport filters={filters} onFiltersChange={setFilters} />
    </div>
  );
}