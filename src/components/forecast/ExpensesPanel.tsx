import { Card } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Receipt } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency'; 
import { useState, useEffect } from 'react';

interface ExpensesPanelProps {
  expenses: number;
  onExpensesChange: (value: number) => void;
}

export function ExpensesPanel({
  expenses,
  onExpensesChange
}: ExpensesPanelProps) {
  const [localValue, setLocalValue] = useState(() => expenses?.toString() || '');

  // Update local value when expenses prop changes
  useEffect(() => {
    setLocalValue(expenses?.toString() || '');
  }, [expenses]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    const numValue = parseFloat(localValue);
    if (!isNaN(numValue)) {
      onExpensesChange(numValue); // Pass the value directly
    } else {
      // Reset to current value if invalid
      setLocalValue(expenses?.toString() || '');
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <Receipt className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">Monthly Expenses</h3>
          <p className="text-sm text-gray-500">
            Enter forecasted expenses for this month
          </p>
        </div>
      </div>

      <FormField label="Expenses">
        <Input
          type="number"
          step="0.01"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter amount..."
        />
      </FormField>
      <div className="mt-4 text-sm text-gray-500">
        Current expenses: {formatCurrency(expenses)}
      </div>
    </Card>
  );
}