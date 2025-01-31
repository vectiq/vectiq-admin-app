import { useState } from 'react';
import { SlidePanel } from '@/components/ui/SlidePanel';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/Select';
import { Users } from 'lucide-react';

interface PotentialStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    employeeType: 'employee' | 'contractor';
    hoursPerWeek: number;
    billablePercentage: number;
    sellRate: number;
    costRate: number;
    startDate: string;
  }) => void;
  isEmployee: boolean;
  workingDays: number;
}

export function PotentialStaffDialog({
  open,
  onOpenChange,
  onSubmit,
  isEmployee,
  workingDays
}: PotentialStaffDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    employeeType: isEmployee ? 'employee' : 'contractor',
    hoursPerWeek: 40,
    billablePercentage: 80,
    sellRate: 0,
    costRate: 0,
    startDate: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onOpenChange(false);
  };

  return (
    <SlidePanel
      open={open}
      onClose={() => onOpenChange(false)}
      title={`Add Potential ${isEmployee ? 'Employee' : 'Contractor'}`}
      icon={<Users className="h-5 w-5 text-indigo-500" />}
    >
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Name">
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter name"
              required
            />
          </FormField>

          <FormField label="Start Date">
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              required
            />
          </FormField>

          <FormField label="Hours Per Week">
            <Input
              type="number"
              value={formData.hoursPerWeek}
              onChange={(e) => setFormData(prev => ({ ...prev, hoursPerWeek: parseFloat(e.target.value) || 0 }))}
              min="0"
              max="168"
              required
            />
          </FormField>

          <FormField label="Target Billable %">
            <Input
              type="number"
              value={formData.billablePercentage}
              onChange={(e) => setFormData(prev => ({ ...prev, billablePercentage: parseFloat(e.target.value) || 0 }))}
              min="0"
              max="100"
              required
            />
          </FormField>

          <FormField label="Sell Rate ($/hr)">
            <Input
              type="number"
              step="0.01"
              value={formData.sellRate}
              onChange={(e) => setFormData(prev => ({ ...prev, sellRate: parseFloat(e.target.value) || 0 }))}
              min="0"
              required
            />
          </FormField>

          <FormField label="Cost Rate ($/hr)">
            <Input
              type="number"
              step="0.01"
              value={formData.costRate}
              onChange={(e) => setFormData(prev => ({ ...prev, costRate: parseFloat(e.target.value) || 0 }))}
              min="0"
              required
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Add Staff Member
            </Button>
          </div>
        </form>
      </div>
    </SlidePanel>
  );
}