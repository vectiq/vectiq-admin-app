import { useState, useMemo, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, addYears, subYears } from 'date-fns';
import { MultiMonthForecast } from '@/components/forecast/MultiMonthForecast';
import { useUsers } from '@/lib/hooks/useUsers';
import { useProjects } from '@/lib/hooks/useProjects';
import { useForecasts } from '@/lib/hooks/useForecasts';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Button } from '@/components/ui/Button';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/Select';
import { SaveForecastDialog } from '@/components/forecast/SaveForecastDialog';
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
import { Save, Plus, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/AlertDialog';

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
  const [selectedForecastId, setSelectedForecastId] = useState<string>('');
  const [isNewForecastDialogOpen, setIsNewForecastDialogOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [forecasts, setForecasts] = useState<SavedForecast['entries']>([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; forecastId: string | null }>({
    isOpen: false,
    forecastId: null
  });
  const currentMonth = format(currentDate, 'yyyy-MM');
  const workingDays = getWorkingDaysForMonth(currentMonth);
  const [isInitialized, setIsInitialized] = useState(false);

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

  const { users, isLoading: isLoadingUsers } = useUsers();
  const { projects: allProjects, isLoading: isLoadingProjects } = useProjects();
  const { holidays } = usePublicHolidays(currentMonth);
  const { leaveData } = useLeaveForecasts(currentMonth);
  const { bonuses } = useBonuses(currentMonth);

  const { 
    forecasts: savedForecasts, 
    saveForecast, 
    createDefaultForecast,
    updateForecast,
    deleteForecast,
    isSaving,
    isDeleting,
    isLoading: isLoadingForecasts 
  } = useForecasts({ month: currentMonth });

  // Create default forecast if none exists
  useEffect(() => {
    const initializeDefaultForecast = async () => {
      if (!isLoadingForecasts && !isLoadingUsers && !isLoadingProjects && savedForecasts.length === 0 && !isInitialized) {
        setIsInitialized(true);
        const defaultEntries = users.map(user => {
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

        const defaultForecast = await createDefaultForecast(defaultEntries);
        if (defaultForecast) {
          setSelectedForecastId(defaultForecast.id);
          setForecasts(defaultForecast.entries);
        }
      }
    };

    initializeDefaultForecast();
  }, [currentMonth, isLoadingForecasts, isLoadingUsers, isLoadingProjects, savedForecasts.length, isInitialized]);

  // Reset initialization flag when month changes
  useEffect(() => {
    setIsInitialized(false);
  }, [currentMonth]);

  // Auto-select default forecast when available
  useEffect(() => {
    if (!selectedForecastId && savedForecasts.length > 0) {
      const defaultForecast = savedForecasts.find(f => f.name.startsWith('Default -'));
      if (defaultForecast) {
        setSelectedForecastId(defaultForecast.id);
        setForecasts(defaultForecast.entries);
        setHasUnsavedChanges(false);
      }
    }
  }, [savedForecasts, selectedForecastId]);

  // Update forecasts when selected forecast changes
  useEffect(() => {
    const selectedForecast = savedForecasts.find(f => f.id === selectedForecastId);
    if (selectedForecast) {
      setForecasts(selectedForecast.entries);
      setHasUnsavedChanges(false);
    }
  }, [selectedForecastId, savedForecasts]);

  // Filter for active projects only
  const projects = useMemo(() => {
    return allProjects.filter(project => {
      // Get first day of selected month
      const selectedDate = new Date(currentMonth + '-01');
      selectedDate.setHours(0, 0, 0, 0);

      const isActive = project.isActive;
      const hasEndDate = project.endDate && project.endDate.trim().length === 10;
      const endDate = hasEndDate ? new Date(project.endDate + 'T23:59:59') : null;
      const isEndDateValid = endDate ? endDate >= selectedDate : true;
      
      return isActive && (!hasEndDate || isEndDateValid);
    });
  }, [allProjects, currentMonth]);

  const handleSaveForecast = async (name: string) => {
    const forecastEntries = users.map(user => {
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

    await saveForecast(name, forecastEntries);
  };

  const handleSaveCurrentForecast = async () => {
    if (!selectedForecastId) return;
    setHasUnsavedChanges(false);
    const currentForecast = savedForecasts.find(f => f.id === selectedForecastId);
    if (currentForecast) {
      await updateForecast(selectedForecastId, currentMonth, currentForecast.name, forecasts);
    }
  };

  const handleDeleteForecast = async () => {
    if (!deleteConfirmation.forecastId) return;
    
    try {
      await deleteForecast(deleteConfirmation.forecastId);
      setSelectedForecastId('');
    } catch (error) {
      console.error('Failed to delete forecast:', error);
      alert('Failed to delete forecast');
    }
    setDeleteConfirmation({ isOpen: false, forecastId: null });
  };

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

  const handleToday = () => setCurrentDate(startOfMonth(new Date()));

  if (isLoadingUsers || isLoadingProjects || isLoadingForecasts) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Forecast</h1>
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
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsNewForecastDialogOpen(true)}
                className="p-1.5"
                title="Create New Forecast"
              >
                <Plus className="h-4 w-4" />
              </Button>

              <Select
                value={selectedForecastId}
                onValueChange={setSelectedForecastId}
              >
                <SelectTrigger className="w-[250px]">
                  {selectedForecastId ? 
                    savedForecasts.find(f => f.id === selectedForecastId)?.name : 
                    'Select Saved Forecast'}
                </SelectTrigger>
                <SelectContent>
                  {savedForecasts.map(forecast => (
                    <SelectItem key={forecast.id} value={forecast.id}>
                      {forecast.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="secondary"
                size="sm"
                disabled={!selectedForecastId || !hasUnsavedChanges}
                className="p-1.5"
                title="Save Current Forecast"
                onClick={handleSaveCurrentForecast}
              >
                <Save className="h-4 w-4" />
                {hasUnsavedChanges && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-amber-500 rounded-full" />
                )}
              </Button>

              {selectedForecastId && (
                <Button
                  variant="secondary"
                  disabled={savedForecasts.find(f => f.id === selectedForecastId)?.name.startsWith('Default -')}
                  size="sm"
                  className="p-1.5 text-red-500 hover:text-red-600"
                  title="Delete Current Forecast"
                  onClick={() => setDeleteConfirmation({ 
                    isOpen: true, 
                    forecastId: selectedForecastId 
                  })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
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
            users={users}
            projects={projects}
            forecasts={forecasts}
            selectedForecast={savedForecasts.find(f => f.id === selectedForecastId)}
            onForecastChange={(entries) => {
              if (selectedForecastId) {
                setForecasts(entries);
                setHasUnsavedChanges(true);
              }
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

      <SaveForecastDialog
        open={isNewForecastDialogOpen}
        onOpenChange={setIsNewForecastDialogOpen}
        onSave={handleSaveForecast}
        isLoading={isSaving}
      />
      
      <AlertDialog 
        open={deleteConfirmation.isOpen} 
        onOpenChange={(open) => setDeleteConfirmation(prev => ({ ...prev, isOpen: open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Forecast</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this forecast? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteForecast}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}