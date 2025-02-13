import { useState, useMemo, useEffect, useCallback } from 'react';
import { format, addMonths, subMonths, startOfMonth, addYears, subYears } from 'date-fns';
import { MultiMonthForecast } from '@/components/forecast/MultiMonthForecast';
import { useUsers } from '@/lib/hooks/useUsers';
import { useProjects } from '@/lib/hooks/useProjects'; 
import { useForecasts } from '@/lib/hooks/useForecasts';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/styles';
import { UserForecastTable } from '@/components/forecast/UserForecastTable';
import { WorkingDaysPanel } from '@/components/forecast/WorkingDaysPanel';
import { DateNavigation } from '@/components/ui/DateNavigation';
import { ForecastSummaryCard } from '@/components/forecast/ForecastSummaryCard';
import { usePublicHolidays } from '@/lib/hooks/usePublicHolidays';
import { useBonuses } from '@/lib/hooks/useBonuses';
import { useLeaveForecasts } from '@/lib/hooks/useLeaveForecasts';
import { getWorkingDaysForMonth } from '@/lib/utils/workingDays';
import { getAverageSellRate, getCostRateForMonth } from '@/lib/utils/rates';

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
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [initialized, setInitialized] = useState(false);

  const currentMonth = format(currentDate, 'yyyy-MM');
  const workingDays = getWorkingDaysForMonth(currentMonth);

  const { currentUser, managedTeam, isTeamManager } = useUsers();
  const { projects: allProjects, isLoading: isLoadingProjects } = useProjects();
  const { users, isLoading: isLoadingUsers } = useUsers();
  const { holidays } = usePublicHolidays(currentMonth);
  const { leaveData } = useLeaveForecasts(currentMonth);
  const { bonuses } = useBonuses(currentMonth);

  // Filter projects and users based on team manager status
  const projects = useMemo(() => {
    return allProjects.filter(project => {
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
  }, [allProjects, currentMonth, isTeamManager, managedTeam?.id]);

  // Filter users based on team manager status
  const filteredUsers = useMemo(() => {
    if (isTeamManager) {
      return users.filter(user => user.teamId === managedTeam.id);
    }
    return users;
  }, [users, isTeamManager, managedTeam?.id]);
  // Handle URL params on initial load
  useEffect(() => {
    if (isInitialLoad) {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      if (viewParam === 'monthly' || viewParam === 'multi') {
        setView(viewParam);
      }
      setIsInitialLoad(false);
    }
  }, [isInitialLoad]);

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


  // Memoize the default entries calculation
  const getDefaultEntries = useCallback(() => {
    return users.map(user => {
      const averageSellRate = getAverageSellRate(projects, user.id, currentMonth + '-01');
      const totalBonuses = bonuses
        .filter(bonus => bonus.employeeId === user.id)
        .reduce((sum, bonus) => sum + bonus.amount, 0);
      const costRate = getCostRateForMonth(user.costRate || [], currentMonth);
      const plannedLeave = leaveData?.leave
        ?.filter(leave => leave.employeeId === user.xeroEmployeeId && leave.status === 'SCHEDULED')
        ?.reduce((sum, leave) => sum + leave.numberOfUnits, 0) || 0;

      return {
        userId: user.id,
        hoursPerWeek: user.hoursPerWeek || 40,
        billablePercentage: user.estimatedBillablePercentage || 0,
        forecastHours: (user.hoursPerWeek || 40) * (workingDays / 5),
        sellRate: averageSellRate,
        costRate: costRate,
        plannedBonus: totalBonuses,
        plannedLeave: plannedLeave,
        publicHolidays: holidays.length * 8
      };
    });
  }, [users, projects, currentMonth, bonuses, leaveData, workingDays, holidays]);

  // Initialize forecast data
  useEffect(() => {
    if (!isLoadingUsers && !isLoadingProjects && !initialized) {
      const defaultEntries = getDefaultEntries();
      setForecasts(defaultEntries);
      setInitialized(true);
    }
  }, [isLoadingUsers, isLoadingProjects, getDefaultEntries, initialized]);

  // Reset initialization when month changes
  useEffect(() => {
    setInitialized(false);
  }, [currentMonth]);

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

  if (isLoadingUsers || isLoadingProjects) {
    return <LoadingScreen />;
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
          </div>

          <ForecastSummaryCard
            users={users}
            projects={projects}
            forecasts={forecasts}
            month={currentMonth}
            workingDays={workingDays}
            holidays={holidays}
            bonuses={bonuses}
          />

          <WorkingDaysPanel selectedDate={currentDate} />

          <UserForecastTable
            users={filteredUsers}
            projects={projects}
            leaveData={leaveData}
            forecasts={forecasts} 
            onForecastChange={(entries) => {
              setForecasts(entries);
            }}
            month={currentMonth}
            workingDays={workingDays}
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