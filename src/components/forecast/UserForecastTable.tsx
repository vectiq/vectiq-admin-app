import { useMemo, useState, useEffect } from 'react';
import { EmployeeForecastTable } from './EmployeeForecastTable';
import { ContractorForecastTable } from './ContractorForecastTable';
import { useLeaveForecasts } from '@/lib/hooks/useLeaveForecasts';
import { usePublicHolidays } from '@/lib/hooks/usePublicHolidays';
import { useBonuses } from '@/lib/hooks/useBonuses';
import { getAverageSellRate, getCostRateForMonth } from '@/lib/utils/rates';
import type { User, Project } from '@/types';

interface UserForecastTableProps {
  users: User[];
  projects: Project[];
  forecasts: any[];
  month: string;
  workingDays: number;
  selectedForecast?: any;
  onForecastChange?: (changes: any) => void;
}

export function UserForecastTable({
  users,
  projects,
  forecasts,
  month,
  workingDays,
  selectedForecast,
  onForecastChange
}: UserForecastTableProps) {
  const [localData, setLocalData] = useState<Record<string, any>>({});
  const { leaveData } = useLeaveForecasts(month);
  const { holidays } = usePublicHolidays(month);
  const { bonuses } = useBonuses(month);
  const [initialized, setInitialized] = useState(false);

  // Separate users by type
  const { employees, contractors } = useMemo(() => {
    return users.reduce((acc, user) => {
      if (user.employeeType === 'employee') {
        acc.employees.push(user);
      } else if (user.employeeType === 'contractor') {
        acc.contractors.push(user);
      }
      return acc;
    }, { employees: [] as User[], contractors: [] as User[] });
  }, [users]);

  // Initialize local data from selected forecast
  useEffect(() => {
    if (!users.length || !month || !workingDays || !forecasts || initialized) return;

    const monthStart = new Date(month + '-01');
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0);

    const newLocalData: Record<string, any> = {};

    // Initialize from forecasts array
    forecasts.forEach(entry => {
      if (entry && entry.userId) {
        let forecastHours = entry.forecastHours;
        
        // Adjust hours for potential staff based on start date
        if (entry.isPotential && entry.startDate) {
          const startDate = new Date(entry.startDate);
          if (startDate > monthEnd) {
            forecastHours = 0;
          } else if (startDate > monthStart) {
            const remainingWorkingDays = workingDays * (monthEnd.getDate() - startDate.getDate() + 1) / monthEnd.getDate();
            forecastHours = (entry.hoursPerWeek / 5) * remainingWorkingDays;
          }
        }

        newLocalData[entry.userId] = {
          hoursPerWeek: entry.hoursPerWeek,
          billablePercentage: entry.billablePercentage,
          sellRate: entry.sellRate,
          costRate: entry.costRate,
          plannedBonus: entry.plannedBonus,
          forecastHours,
          name: entry.name,
          isPotential: entry.isPotential,
          startDate: entry.startDate
        };
      }
    });

    // For any users not in forecasts, initialize with defaults
    users.forEach(user => {
      if (!newLocalData[user.id]) {
        const averageSellRate = getAverageSellRate(projects, user.id, month + '-01');
        const totalBonuses = bonuses
          .filter(bonus => bonus.employeeId === user.id)
          .reduce((sum, bonus) => sum + bonus.amount, 0);
        const costRate = getCostRateForMonth(user.costRate || [], month);

        newLocalData[user.id] = {
          hoursPerWeek: user.hoursPerWeek || 40,
          billablePercentage: user.estimatedBillablePercentage || 0,
          sellRate: averageSellRate,
          costRate: costRate,
          plannedBonus: totalBonuses,
          forecastHours: (user.hoursPerWeek || 40) * (workingDays / 5)
        };
      }
    });

    setLocalData(newLocalData);
    setInitialized(true);
  }, [forecasts, month, workingDays, users, projects, bonuses]);

  // Reset initialization when key dependencies change
  useEffect(() => {
    setInitialized(false);
  }, [month, workingDays]);
  const handleCellChange = (userId: string, field: string, value: number) => {
    const newData = {
      ...localData,
      [userId]: {
        ...localData[userId],
        [field]: value
      }
    };

    // If changing hoursPerWeek, recalculate forecast hours
    if (field === 'hoursPerWeek') {
      const userData = localData[userId];
      if (userData.isPotential && userData.startDate) {
        const startDate = new Date(userData.startDate);
        const monthStart = new Date(month + '-01');
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);

        if (startDate > monthEnd) {
          newData[userId].forecastHours = 0;
        } else if (startDate > monthStart) {
          const remainingWorkingDays = workingDays * (monthEnd.getDate() - startDate.getDate() + 1) / monthEnd.getDate();
          newData[userId].forecastHours = (value / 5) * remainingWorkingDays;
        } else {
          newData[userId].forecastHours = (value / 5) * workingDays;
        }
      }
    }

    setLocalData(newData);
    
    if (onForecastChange) {
      const entries = users.map(user => {
        const userData = newData[user.id];
        const plannedLeave = leaveData?.leave
          ?.filter(leave => leave.employeeId === user.xeroEmployeeId && leave.status === 'SCHEDULED')
          ?.reduce((sum, leave) => sum + leave.numberOfUnits, 0) || 0;

        return {
          userId: user.id,
          hoursPerWeek: userData.hoursPerWeek,
          billablePercentage: userData.billablePercentage,
          forecastHours: userData.forecastHours,
          sellRate: userData.sellRate,
          costRate: userData.costRate,
          plannedBonus: userData.plannedBonus,
          plannedLeave: plannedLeave,
          publicHolidays: holidays.length * 8
        };
      });
      onForecastChange(entries);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8">
      <EmployeeForecastTable
        users={employees}
        localData={localData}
        holidays={holidays}
        leaveData={leaveData}
        month={month}
        selectedForecast={selectedForecast}
        onCellChange={handleCellChange}
      />
      <ContractorForecastTable
        users={contractors}
        localData={localData}
        holidays={holidays}
        selectedForecast={selectedForecast}
        onCellChange={handleCellChange}
      />
    </div>
  );
}