import { formatCurrency } from '@/lib/utils/currency';
import { useTasks } from '@/lib/hooks/useTasks';
import { FormField } from '@/components/ui/FormField';
import type { ProjectTask } from '@/types';

interface ProjectRatesProps {
  selectedTaskIds: string[];
  onRateChange: (taskId: string, rates: { costRate: number; sellRate: number }) => void;
  rates: Record<string, ProjectTask>;
}

export function ProjectRates({ selectedTaskIds, onRateChange, rates }: ProjectRatesProps) {
  const { tasks } = useTasks();
  const selectedTasks = tasks.filter(task => selectedTaskIds.includes(task.id));

  const handleRateChange = (taskId: string, rates: { 
    costRate: number; 
    sellRate: number;
    billable: boolean;
  }) => {
    onRateChange(taskId, {
      costRate: rates.costRate || 0,
      sellRate: rates.sellRate || 0,
      billable: rates.billable || false
    });
  };

  return (
    <div className="space-y-4">
      {selectedTasks.map(task => (
        <div key={task.id} className="grid grid-cols-2 gap-4">
          <FormField label={`${task.name} - Cost Rate`}>
            <input
              type="number"
              min="0"
              step="0.01"
              value={rates[task.id]?.costRate || ''}
              onChange={(e) => onRateChange(task.id, {
                costRate: parseFloat(e.target.value) || 0,
                sellRate: rates[task.id]?.sellRate || 0,
              })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </FormField>

          <FormField label={`${task.name} - Sell Rate`}>
            <input
              type="number"
              min="0"
              step="0.01"
              value={rates[task.id]?.sellRate || ''}
              onChange={(e) => onRateChange(task.id, {
                costRate: rates[task.id]?.costRate || 0,
                sellRate: parseFloat(e.target.value) || 0,
              })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </FormField>
        </div>
      ))}

      {selectedTasks.length > 0 && (
        <div className="rounded-lg bg-gray-50 p-4 space-y-2">
          <div className="text-sm text-gray-500">Rate Summary</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total Cost Rate:</span>
              <span className="ml-2 font-medium">
                {formatCurrency(Object.values(rates).reduce((sum, rate) => sum + (rate.costRate || 0), 0))}/hr
              </span>
            </div>
            <div>
              <span className="text-gray-500">Total Bill Rate:</span>
              <span className="ml-2 font-medium">
                {formatCurrency(Object.values(rates).reduce((sum, rate) => sum + (rate.sellRate || 0), 0))}/hr
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}