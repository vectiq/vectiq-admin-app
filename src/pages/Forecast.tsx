import { useState, useMemo, useEffect, useCallback } from 'react';
import { format, addMonths, subMonths, startOfMonth, addYears, subYears } from 'date-fns';
import { MultiMonthForecast } from '@/components/forecast/MultiMonthForecast';
import { useUsers } from '@/lib/hooks/useUsers';
import { useForecasts } from '@/lib/hooks/useForecasts';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/styles';
import { UserForecastTable } from '@/components/forecast/UserForecastTable';
import { WorkingDaysPanel } from '@/components/forecast/WorkingDaysPanel';
import { DateNavigation } from '@/components/ui/DateNavigation';
import { ForecastSummaryCard } from '@/components/forecast/ForecastSummaryCard';
import { Loader2, RefreshCw } from 'lucide-react';

const VIEW_OPTIONS = [
  { id: 'monthly', label: 'Single Month' },
  { id: 'multi', label: 'Multi-Month' }
] as const;

export default function Forecast() {
  const [view, setView] = useState<'monthly' | 'multi'>('monthly');
  const [currentDate, setCurrentDate] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const monthParam = params.get('month');
    return monthParam ? 
      startOfMonth(new Date(monthParam + '-01')) : 
      startOfMonth(new Date());
  });
  const [dateRange, setDateRange] = useState({
    startDate: format(currentDate, 'yyyy-MM-dd'),
    endDate: format(addMonths(currentDate, 5), 'yyyy-MM-dd')
  });
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const currentMonth = format(currentDate, 'yyyy-MM');

  const { currentUser, managedTeam, isTeamManager } = useUsers();
  const { data, isLoading, saveDelta, clearDeltas, isClearing } = useForecasts({ month: currentMonth });

  // Handle URL params on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam === 'monthly' || viewParam === 'multi') {
      setView(viewParam);
    }
    setIsInitialLoad(false);
  }, []);

  // Filter projects and users based on team manager status
  const projects = useMemo(() => {
    if (!data?.projects) return [];
    return data.projects.filter(project => {
      // Get first day of selected month
      const selectedDate = new Date(currentMonth + '-01');
      selectedDate.setHours(0, 0, 0, 0);

      const isActive = project.isActive;
      const hasEndDate = project.endDate && project.endDate.trim().length === 10;
      const endDate = hasEndDate ? new Date(project.endDate + 'T23:59:59') : null;
      const isEndDateValid = endDate ? endDate >= selectedDate : true;
      
      // For team managers, only show projects with tasks assigned to their team
      if (isTeamManager) {
        const hasTeamTasks = project.tasks.some(task => task.teamId === managedTeam.id);
        return isActive && (!hasEndDate || isEndDateValid) && hasTeamTasks;
      }
      
      return isActive && (!hasEndDate || isEndDateValid);
    });
  }, [data?.projects, currentMonth, isTeamManager, managedTeam?.id]);

  // Filter users based on team manager status
  const filteredUsers = useMemo(() => {
    if (!data?.users) return [];
    if (isTeamManager) {
      return data.users.filter(user => user.teamId === managedTeam.id);
    }
    return data.users;
  }, [data?.users, isTeamManager, managedTeam?.id]);

  // Update URL when view or date changes
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('view', view);
    if (view === 'monthly') {
      params.set('month', format(currentDate, 'yyyy-MM'));
    }
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  }, [view, currentDate]);

  // Get financial year dates
  const financialYearStart = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    // If before July, use previous year as start
    const fyStartYear = month < 6 ? year - 1 : year;
    return new Date(fyStartYear, 6, 1); // July 1st
  }, [currentDate]);

  const financialYearEnd = useMemo(() => {
    return new Date(financialYearStart.getFullYear() + 1, 5, 30); // June 30th
  }, [financialYearStart]);

  const handlePrevious = () => {
    if (view === 'monthly') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subYears(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (view === 'monthly') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addYears(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(startOfMonth(new Date()));
  };

  // Show loading screen only if loading and no data
  if (isLoading && !data) {
    return <LoadingScreen />;
  }

  // Show error if there is one
  if (!data) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Failed to load forecast data</h2>
          <p className="text-sm text-gray-500">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900">Forecast</h1>
          {isTeamManager && (
            <p className="text-sm text-gray-500">
              Managing forecasts for {managedTeam.name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg shadow-sm">
            {VIEW_OPTIONS.map(option => (
              <Button
                key={option.id}
                variant={view === option.id ? 'primary' : 'secondary'}
                className={cn(
                  option.id === 'monthly' && 'rounded-r-none',
                  option.id === 'multi' && 'rounded-l-none'
                )}
                onClick={() => setView(option.id)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {view === 'monthly' ? (
        <>
          <div className="flex justify-between items-center">
            <DateNavigation
              currentDate={currentDate}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onToday={handleToday}
              formatString="MMMM yyyy"
            />
            <Button
              variant="secondary"
              onClick={clearDeltas}
              disabled={isClearing || !data?.deltas || Object.keys(data.deltas).length === 0}
            >
              {isClearing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Clear Modified Values
            </Button>
          </div>

          <ForecastSummaryCard
            users={data.users}
            projects={projects}
            forecasts={data.forecasts}
            month={currentMonth}
            workingDays={data.workingDays}
            holidays={data.holidays}
            bonuses={data.bonuses}
          />

          <WorkingDaysPanel selectedDate={currentDate} />

          <UserForecastTable
            users={filteredUsers}
            projects={projects}
            data={data}
            onForecastChange={saveDelta}
            month={currentMonth}
          />
        </>
      ) : (
        <MultiMonthForecast
          startDate={new Date(dateRange.startDate)}
          endDate={new Date(dateRange.endDate)}
          onDateRangeChange={setDateRange}
        />
      )}
    </div>
  );
}