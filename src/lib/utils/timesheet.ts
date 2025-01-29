import { format } from 'date-fns';
import type { TimeEntry } from '@/types';

export function formatTimesheetBreakdown(
  entries: TimeEntry[],
  tasks: { id: string; name: string }[]
): string {
  // Sort entries chronologically
  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  // Calculate task totals
  const taskTotals = sortedEntries.reduce((totals, entry) => {
    const taskId = entry.taskId;
    if (!totals[taskId]) {
      totals[taskId] = 0;
    }
    totals[taskId] += entry.hours;
    return totals;
  }, {} as Record<string, number>);

  // Generate table rows
  const tableRows = sortedEntries.map(entry => {
    const task = tasks.find(t => t.id === entry.taskId);
    const date = format(new Date(entry.date), 'EEE, MMM d');

    return `
      <tr>
        <td style="padding: 8px; border: 1px solid #e5e7eb;">${date}</td>
        <td style="padding: 8px; border: 1px solid #e5e7eb;">${task?.name || 'Unknown Task'}</td>
        <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">
          ${entry.hours.toFixed(2)}
        </td>
      </tr>
    `;
  });

  // Calculate total hours
  const totalHours = sortedEntries.reduce((sum, entry) => sum + entry.hours, 0);
  
  // Generate task summary rows
  const taskSummaryRows = Object.entries(taskTotals).map(([taskId, hours]) => {
    const task = tasks.find(t => t.id === taskId);
    return `
      <tr style="background-color: #f9fafb;">
        <td style="padding: 8px; border: 1px solid #e5e7eb;" colspan="2">
          <strong>${task?.name || 'Unknown Task'} Total</strong>
        </td>
        <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">
          <strong>${hours.toFixed(2)}</strong>
        </td>
      </tr>
    `;
  });
  
  // Add grand total row
  const totalRow = `
    <tr style="font-weight: 600; background-color: #f3f4f6;">
      <td style="padding: 8px; border: 1px solid #e5e7eb;" colspan="2">
        <strong>Grand Total</strong>
      </td>
      <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">
        <strong>${totalHours.toFixed(2)}</strong>
      </td>
    </tr>
  `;

  return `
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; background-color: white;">
      <thead style="background-color: #f3f4f6;">
        <tr>
          <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Date</th>
          <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Task</th>
          <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">Hours</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows.join('')}
        <tr><td colspan="3" style="padding: 12px 0; border: none;"></td></tr>
        ${taskSummaryRows.join('')}
        ${totalRow}
      </tbody>
    </table>
  `;
}