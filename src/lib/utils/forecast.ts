import { parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { getWorkingDaysForUser } from './date';
import type { ForecastData, User } from '@/types';

interface ForecastTotals {
  hours: number;
  revenue: number;
  cost: number;
  leaveHours: number;
  bonuses: number;
  margin: number;
  marginPercent: number;
  employeeCount: number;
  contractorCount: number;
}

export function calculateForecastTotals(data: ForecastData): ForecastTotals {
  if (!data.month) {
    console.error('Month is missing from forecast data');
    return {
      hours: 0,
      revenue: 0,
      cost: 0,
      leaveHours: 0,
      bonuses: 0,
      margin: 0,
      marginPercent: 0,
      employeeCount: 0,
      contractorCount: 0
    };
  }

  let totalRevenue = 0;
  let totalCost = 0;
  let totalBonuses = 0;
  let totalHours = 0;
  let totalLeaveHours = 0;
  let employeeCount = 0;
  let contractorCount = 0;

  // Get month boundaries
  const monthStart = startOfMonth(parseISO(data.month + '-01'));
  const monthEnd = endOfMonth(monthStart);

  // Filter active users for this month
  const activeUsers = data.users.filter(user => {
    if (user.startDate && new Date(user.startDate) > monthEnd) return false;
    if (user.endDate && new Date(user.endDate) < monthStart) return false;
    return true;
  });

  // Count employees and contractors
  employeeCount = activeUsers.filter(u => u.employeeType === 'employee').length;
  contractorCount = activeUsers.filter(u => u.employeeType === 'contractor').length;

  // Process employees
  activeUsers.filter(u => u.employeeType === 'employee').forEach(user => {
    const deltas = data.deltas || {};

    // Calculate effective working days for this user
    const effectiveWorkingDays = getWorkingDaysForUser(
      monthStart,
      monthEnd,
      user.startDate,
      user.endDate
    );

    // For employees, cost is based on all working days
    const baseHours = ((deltas[`${user.id}_hoursPerWeek`]?.value ?? (user.hoursPerWeek || 40)) / 5) * effectiveWorkingDays;
    
    // Only revenue is affected by billable percentage and holidays/leave
    const billableHours = baseHours * ((deltas[`${user.id}_billablePercentage`]?.value ?? (user.estimatedBillablePercentage || 0)) / 100);
    
    const holidayHours = data.holidays.length * 8;
    const leaveHours = data.leave.filter(l => l.employeeId === user.xeroEmployeeId).reduce((sum, l) => sum + l.numberOfUnits, 0);
    totalLeaveHours += leaveHours;
    
    const forecastHours = Math.max(0, billableHours - holidayHours - leaveHours);

    // Get rates
    const sellRate = deltas[`${user.id}_sellRate`]?.value ?? (user.currentSellRate || 0);
    const costRate = deltas[`${user.id}_costRate`]?.value ?? (user.currentCostRate || 0);
    const bonus = deltas[`${user.id}_plannedBonus`]?.value ?? (data.bonuses[user.id] || 0);

    // Calculate revenue from forecast hours
    totalRevenue += forecastHours * sellRate;
    // Calculate cost from base hours (all working days)
    totalCost += baseHours * costRate;
    totalBonuses += bonus;
    totalHours += forecastHours;
  });

  // Process contractors
  activeUsers.filter(u => u.employeeType === 'contractor').forEach(user => {
    const deltas = data.deltas || {};

    // Calculate effective working days for this user
    const effectiveWorkingDays = getWorkingDaysForUser(
      monthStart,
      monthEnd,
      user.startDate,
      user.endDate
    );

    // Calculate base hours
    const baseHours = ((deltas[`${user.id}_hoursPerWeek`]?.value ?? (user.hoursPerWeek || 40)) / 5) * effectiveWorkingDays;
    
    // Subtract holidays only
    const holidayHours = data.holidays.length * 8;
    const forecastHours = Math.max(0, baseHours - holidayHours);

    // Get rates
    const sellRate = deltas[`${user.id}_sellRate`]?.value ?? (user.currentSellRate || 0);
    const costRate = deltas[`${user.id}_costRate`]?.value ?? (user.currentCostRate || 0);
    const bonus = deltas[`${user.id}_plannedBonus`]?.value ?? (data.bonuses[user.id] || 0);

    // Calculate totals
    totalRevenue += forecastHours * sellRate;
    // For contractors, cost is only incurred for forecast hours
    totalCost += forecastHours * costRate;
    totalBonuses += bonus;
    totalHours += forecastHours;
  });

  // Add bonuses to total cost
  totalCost += totalBonuses;

  // Calculate margin
  const margin = totalRevenue - totalCost;
  const marginPercent = totalRevenue > 0 ? (margin / totalRevenue) * 100 : 0;

  return {
    hours: totalHours,
    revenue: totalRevenue,
    cost: totalCost,
    leaveHours: totalLeaveHours,
    bonuses: totalBonuses,
    margin,
    marginPercent,
    employeeCount,
    contractorCount
  };
}