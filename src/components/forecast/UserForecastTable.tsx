import { useMemo } from 'react';
import { EmployeeForecastTable } from './EmployeeForecastTable';
import { ContractorForecastTable } from './ContractorForecastTable';
import { parseISO, startOfMonth, endOfMonth } from 'date-fns';
import type { User, Project } from '@/types';

interface UserForecastTableProps {
  users: User[];
  projects: Project[];
  data: {
    users: User[];
    projects: Project[];
    bonuses: any[];
    leave: any[];
    holidays: any[];
    workingDays: number;
    deltas: Record<string, any>;
  };
  month: string;
  onForecastChange: (userId: string, field: string, value: number, dynamicValue: number) => void;
}

export function UserForecastTable({
  users,
  projects,
  data,
  month,
  onForecastChange
}: UserForecastTableProps) {
  // Get month boundaries
  const monthStart = startOfMonth(parseISO(month + '-01'));
  const monthEnd = endOfMonth(monthStart);

  // Filter users based on start/end dates
  const activeUsers = useMemo(() => {
    return users.filter(user => {
      // Check start date
      if (user.startDate && new Date(user.startDate) > monthEnd) {
        return false; // User starts after this month
      }
      
      // Check end date
      if (user.endDate && new Date(user.endDate) < monthStart) {
        return false; // User ended before this month
      }
      
      return true;
    });
  }, [users, monthStart, monthEnd]);

  // Track which cells have been modified from their dynamic values
  // Calculate leave hours for each user
  const leaveHours = useMemo(() => {
    const hours = {};
    data.leave?.forEach(leave => {
      if (leave.status === 'SCHEDULED') {
        const userId = users.find(u => u.xeroEmployeeId === leave.employeeId)?.id;
        if (userId) {
          hours[userId] = (hours[userId] || 0) + (leave.numberOfUnits || 0);
        }
      }
    });
    return hours;
  }, [data.leave, users]);
  // Separate users by type
  const { employees, contractors } = useMemo(() => {
    return activeUsers.reduce((acc, user) => {
      if (user.employeeType === 'employee') {
        acc.employees.push(user);
      } else if (user.employeeType === 'contractor') {
        acc.contractors.push(user);
      }
      return acc;
    }, { employees: [] as User[], contractors: [] as User[] }); 
  }, [activeUsers]);

  // Get modified cells from deltas
  const modifiedCells = useMemo(() => {
    const cells = new Set<string>();
    if (data.deltas) {
      Object.keys(data.deltas).forEach(key => {
        if (key !== 'id' && key !== 'updatedAt') {
          cells.add(key);
        }
      });
    }
    return cells;
  }, [data.deltas]);

  return (
    <div className="grid grid-cols-1 gap-8">
      <EmployeeForecastTable
        users={employees}
        data={data}
        holidays={data.holidays}
        workingDays={data.workingDays}
        leaveHours={leaveHours}
        month={month}
        modifiedCells={modifiedCells}
        onCellChange={onForecastChange}
      />
      <ContractorForecastTable
        users={contractors}
        data={data}
        holidays={data.holidays}
        workingDays={data.workingDays}
        month={month}
        modifiedCells={modifiedCells}
        onCellChange={onForecastChange}
      />
    </div>
  );
}