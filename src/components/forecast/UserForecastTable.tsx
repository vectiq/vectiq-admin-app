import { useMemo, useState, useEffect } from 'react';
import { EmployeeForecastTable } from './EmployeeForecastTable';
import { ContractorForecastTable } from './ContractorForecastTable';
import { useForecasts } from '@/lib/hooks/useForecasts';
import { useUsers } from '@/lib/hooks/useUsers';
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
  onForecastChange?: (changes: any) => void;
}

export function UserForecastTable({
  users,
  projects,
  forecasts,
  month,
  workingDays,
  onForecastChange
}: UserForecastTableProps) {
  const [localData, setLocalData] = useState<Record<string, any>>({});
  const { currentUser } = useUsers();
  const { saveDelta, deltas } = useForecasts({
    userId: currentUser?.id,
    month
  });
  const { leaveData } = useLeaveForecasts(month);
  const { holidays } = usePublicHolidays(month);
  const { bonuses } = useBonuses(month);
  const [initialized, setInitialized] = useState(false);

  // Track which cells have been modified from their dynamic values
  const [modifiedCells, setModifiedCells] = useState<Set<string>>(new Set());
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
    // Apply saved forecast deltas if they exist
    if (deltas) {
      Object.entries(deltas).forEach(([field, delta]) => {
        if (newLocalData[field]) {
          Object.entries(delta).forEach(([key, value]) => {
            if (key !== 'updatedAt' && key !== 'dynamicValue') {
            }
          }
          )
        }
      }
      )
      Object.entries(deltas).forEach(([key, override]) => {
        if (key === 'id' || key === 'updatedAt' || !override) return;

        // Extract userId and field from the key (e.g., "userId_hoursPerWeek")
        const parts = key.split('_');
        if (parts.length !== 2) return;

        const [userId, field] = parts;
        if (newLocalData[userId] && override && typeof override === 'object' && 'value' in override) {
          newLocalData[userId][field] = override.value;
          setModifiedCells(prev => new Set([...prev, key]));
        }
      });
    }

    setLocalData(newLocalData);
    setInitialized(true);
  }, [forecasts, month, workingDays, users, projects, bonuses]);

  // Separate effect for applying deltas
  useEffect(() => {
    if (!deltas || !initialized) return;

    setLocalData(prevData => {
      const newData = { ...prevData };
      Object.entries(deltas).forEach(([key, override]) => {
        if (key === 'id' || key === 'updatedAt' || !override) return;

        const [userId, field] = key.split('_');
        if (newData[userId] && override && typeof override === 'object' && 'value' in override) {
          newData[userId][field] = override.value;
          setModifiedCells(prev => new Set([...prev, key]));
        }
      });
      return newData;
    });
  }, [deltas, initialized]);

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
    // Mark cell as modified
    setModifiedCells(prev => new Set(prev).add(`${userId}_${field}`));
    
    // Get the dynamic value for this field
    const user = users.find(u => u.id === userId);
    let dynamicValue = 0;
    
    if (user) {
      switch (field) {
        case 'hoursPerWeek':
          dynamicValue = user.hoursPerWeek || 40;
          break;
        case 'billablePercentage':
          dynamicValue = user.estimatedBillablePercentage || 0;
          break;
        case 'sellRate':
          dynamicValue = getAverageSellRate(projects, user.id, month + '-01');
          break;
        case 'costRate':
          dynamicValue = getCostRateForMonth(user.costRate || [], month);
          break;
        case 'forecastHours':
          dynamicValue = (user.hoursPerWeek || 40) * (workingDays / 5);
          break;
        case 'plannedBonus':
          dynamicValue = bonuses
            .filter(bonus => bonus.employeeId === user.id)
            .reduce((sum, bonus) => sum + bonus.amount, 0);
          break;
      }
    }

    // Save or clear the override
    saveDelta(month, field, value === dynamicValue ? null : value, user.id);
    
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
        modifiedCells={modifiedCells}
        onCellChange={handleCellChange}
      />
      <ContractorForecastTable
        users={contractors}
        localData={localData}
        holidays={holidays}
        modifiedCells={modifiedCells}
        onCellChange={handleCellChange}
      />
    </div>
  );
}