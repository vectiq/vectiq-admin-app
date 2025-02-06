import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Loader2, Database, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface TestDataTabProps {
  onGenerateTestData: (options: TestDataOptions) => Promise<void>;
  onClearTestData: () => Promise<void>;
  isGenerating: boolean;
  isClearing: boolean;
}

export function TestDataTab({
  onGenerateTestData,
  onClearTestData,
  isGenerating,
  isClearing
}: TestDataTabProps) {
  const [options, setOptions] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    maxDailyHours: 8
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onGenerateTestData(options);
  };

  return (
    <Card className="divide-y divide-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Test Data Generation</h3>
            <p className="mt-1 text-sm text-gray-500">
              Generate test time entries based on project assignments
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <FormField label="Start Date">
              <Input
                type="date"
                value={options.startDate}
                onChange={(e) => setOptions(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </FormField>

            <FormField label="End Date">
              <Input
                type="date"
                value={options.endDate}
                onChange={(e) => setOptions(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </FormField>
          </div>

          <FormField label="Maximum Daily Hours">
            <Input
              type="number"
              min="1"
              max="24"
              value={options.maxDailyHours}
              onChange={(e) => setOptions(prev => ({ ...prev, maxDailyHours: parseInt(e.target.value) }))}
            />
            <p className="mt-1 text-xs text-gray-500">
              Maximum hours that can be logged per day per user
            </p>
          </FormField>

          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={onClearTestData}
              disabled={isClearing}
              className="text-red-600 hover:text-red-700"
            >
              {isClearing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Clear Test Data
            </Button>

            <Button type="submit" disabled={isGenerating}>
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              Generate Test Data
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}