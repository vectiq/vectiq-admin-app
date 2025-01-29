import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Loader2 } from 'lucide-react';
import type { SystemConfig } from '@/types';

interface CalculationsTabProps {
  config: SystemConfig;
  isUpdating: boolean;
  onRecalculateProjectTotals: () => Promise<void>;
  isRecalculating: boolean;
  onUpdateConfig: (config: SystemConfig) => Promise<void>;
}

export function CalculationsTab({
  config,
  isUpdating,
  onRecalculateProjectTotals,
  isRecalculating,
  onUpdateConfig,
}: CalculationsTabProps) {
  const [formState, setFormState] = useState({
    payrollTaxPercentage: config.payrollTaxPercentage,
    payrollTaxFreeThreshold: config.payrollTaxFreeThreshold,
    insurancePercentage: config.insurancePercentage,
    superannuationPercentage: config.superannuationPercentage,
    costRateFormula: config.costRateFormula || '{salary}/52/38*(1+{payrollTaxPercentage}+{insurancePercentage}+{superannuationPercentage})',
  });

  const availableVariables = [
    { name: 'salary', description: 'Annual salary amount' },
    { name: 'payrollTaxPercentage', description: 'Configured payroll tax percentage' },
    { name: 'payrollTaxFreeThreshold', description: 'Payroll tax free threshold amount' },
    { name: 'insurancePercentage', description: 'Insurance percentage' },
    { name: 'superannuationPercentage', description: 'Superannuation percentage' },
  ];

  return (
    <Card className="divide-y divide-gray-200">
      <div className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Cost Rate Calculation</h3>
            <p className="mt-1 text-sm text-gray-500">
              Configure the formula for calculating cost rates from salaries
            </p>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await onUpdateConfig({
                ...config,
                ...formState
              });
            }}
            className="space-y-4"
          >
            <FormField 
              label="Cost Rate Formula"
              description="Enter the formula using variables in {curly braces}"
            >
              <div className="space-y-2">
                <Input
                  value={formState.costRateFormula}
                  onChange={(e) => setFormState(prev => ({
                    ...prev,
                    costRateFormula: e.target.value
                  }))}
                  className="font-mono"
                  placeholder="Example: {salary}/52/38*(1+{payrollTaxPercentage})"
                />
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-sm font-medium text-gray-700 mb-2">Available Variables:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {availableVariables.map(variable => (
                      <div key={variable.name} className="text-sm">
                        <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">
                          {'{' + variable.name + '}'}
                        </code>
                        <span className="text-gray-500 ml-2">{variable.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Payroll Tax Percentage">
                <Input
                  type="number"
                  step="0.01"
                  value={formState.payrollTaxPercentage}
                  onChange={(e) => setFormState(prev => ({
                    ...prev,
                    payrollTaxPercentage: parseFloat(e.target.value)
                  }))}
                />
              </FormField>

              <FormField label="Payroll Tax Free Threshold">
                <Input
                  type="number"
                  step="0.01"
                  value={formState.payrollTaxFreeThreshold}
                  onChange={(e) => setFormState(prev => ({
                    ...prev,
                    payrollTaxFreeThreshold: parseFloat(e.target.value)
                  }))}
                />
              </FormField>

              <FormField label="Insurance Percentage">
                <Input
                  type="number"
                  step="0.01"
                  value={formState.insurancePercentage}
                  onChange={(e) => setFormState(prev => ({
                    ...prev,
                    insurancePercentage: parseFloat(e.target.value)
                  }))}
                />
              </FormField>

              <FormField label="Superannuation Percentage">
                <Input
                  type="number"
                  step="0.01"
                  value={formState.superannuationPercentage}
                  onChange={(e) => setFormState(prev => ({
                    ...prev,
                    superannuationPercentage: parseFloat(e.target.value)
                  }))}
                />
              </FormField>
            </div>

            <div className="pt-4 border-t">
              <Button type="submit" disabled={isUpdating}>
                {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Calculation Settings
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Card>
  );
}