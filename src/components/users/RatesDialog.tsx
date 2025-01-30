import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { calculateCostRate } from '@/lib/utils/costRate';
import { Loader2 } from 'lucide-react';
import { SlidePanel } from '@/components/ui/SlidePanel';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Table, TableHeader, TableBody, Th, Td } from '@/components/ui/Table';
import { DollarSign, Plus, Trash2, Calculator } from 'lucide-react';
import { format } from 'date-fns';
import type { User, SalaryItem, CostRate, SystemConfig } from '@/types';

interface RatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  onSave: (updates: { salary?: SalaryItem[]; costRate?: CostRate[] }) => Promise<void>;
}

export function RatesDialog({
  open,
  onOpenChange,
  user,
  onSave,
}: RatesDialogProps) {
  // Initialize salary history
  const [salaryHistory, setSalaryHistory] = useState<SalaryItem[]>([]);

  // Initialize cost rate history
  const [costRateHistory, setCostRateHistory] = useState<CostRate[]>([]);

  // Helper function to safely format dates
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Never';
    try {
      return format(new Date(date), 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Form state
  const [newSalary, setNewSalary] = useState('');
  const [newCostRate, setNewCostRate] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState(user?.hoursPerWeek || 40);
  const [effectiveDate, setEffectiveDate] = useState('');
  const [estimatedBillablePercentage, setEstimatedBillablePercentage] = useState(user?.estimatedBillablePercentage || 0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize history when user changes
  useEffect(() => {
    if (user) {
      // Initialize billable percentage
      setHoursPerWeek(user.hoursPerWeek || 40);
      setEstimatedBillablePercentage(user?.estimatedBillablePercentage || 0);
      
      // Initialize salary history
      const initialSalaryHistory = Array.isArray(user.salary) ? user.salary : [];
      setSalaryHistory(initialSalaryHistory.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
      
      // Initialize cost rate history
      const initialCostRateHistory = Array.isArray(user.costRate) ? user.costRate : [];
      setCostRateHistory(initialCostRateHistory.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
    }
  }, [user]);

  const handleAddSalary = async () => {
    const salary = parseFloat(newSalary);
    const date = new Date(effectiveDate);
    
    // Input validation
    if (isNaN(salary) || !date || !isFinite(date.getTime())) {
      alert('Please enter a valid salary and date');
      return;
    }

    if (salary <= 0) {
      alert('Salary must be greater than zero');
      return;
    }

    try {
      setIsCalculating(true);

      // Format date consistently
      const isoDate = date.toISOString();

      const newHistory = [
        { salary, date: isoDate },
        ...salaryHistory
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setSalaryHistory(newHistory);

      // Clear form only on success
      setNewSalary('');
      setEffectiveDate('');
    } catch (error) {
      console.error('Error adding salary:', error);
      alert('Failed to add salary. Please try again.');
      return;
    } finally {
      setIsCalculating(false);
    }
  };

  const handleAddCostRate = () => {
    const costRate = parseFloat(newCostRate);
    const date = new Date(effectiveDate);
    const isoDate = date.toISOString();

    if (isNaN(costRate) || !date || !isFinite(date.getTime())) return;

    // Check if date is valid
    const latestDate = costRateHistory[0]?.date ? new Date(costRateHistory[0].date) : null;
    if (latestDate && date < latestDate) {
      alert('New date cannot be before the latest existing date');
      return;
    }

    const newHistory = [
      { costRate, date: isoDate },
      ...costRateHistory
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setCostRateHistory(newHistory);
    setNewCostRate('');
    setEffectiveDate('');
  };

  const handleRemoveSalary = (index: number) => {
    const newHistory = [...salaryHistory];
    newHistory.splice(index, 1);
    setSalaryHistory(newHistory);
  };

  const handleRemoveCostRate = (index: number) => {
    const newHistory = [...costRateHistory];
    newHistory.splice(index, 1);
    setCostRateHistory(newHistory);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // Sort histories by date descending to ensure latest entries are first
      const sortedSalaryHistory = [...salaryHistory].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const sortedCostRateHistory = [...costRateHistory].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      await onSave({
        salary: sortedSalaryHistory,
        costRate: sortedCostRateHistory,
        hoursPerWeek,
        estimatedBillablePercentage: estimatedBillablePercentage
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save rates:', error);
      alert('Failed to save changes');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SlidePanel
      open={open}
      onClose={() => onOpenChange(false)}
      title={user ? "Manage Rates" : "Loading..."}
      subtitle={user?.name}
      icon={<Calculator className="h-5 w-5 text-indigo-500" />}
    >
      {!user ? (
        <div className="p-6 text-center text-gray-500">Loading user data...</div>
      ) : (
      <div className="p-6 space-y-8">
        {/* Current Rates Summary */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg p-6 shadow-sm ring-1 ring-blue-100">
            <div className="text-sm font-medium text-blue-600 mb-2">Target Billable Utilization</div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-900">
                {estimatedBillablePercentage || 0}
              </span>
              <span className="text-sm text-gray-500">%</span>
            </div>
          </div>
          {user.employeeType === 'employee' && (
            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-lg p-6 shadow-sm ring-1 ring-indigo-100">
              <div className="text-sm font-medium text-indigo-600 mb-2">Current Annual Salary</div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900">
                  ${salaryHistory[0]?.salary.toLocaleString() || '0'}
                </span>
                <span className="text-sm text-gray-500">/year</span>
              </div>
              <div className="text-sm text-gray-500 mt-2"> 
                Last updated: {formatDate(salaryHistory[0]?.date)}
              </div>
            </div>
          )}
          <div className="bg-gradient-to-br from-emerald-50 to-white rounded-lg p-6 shadow-sm ring-1 ring-emerald-100">
            <div className="text-sm font-medium text-emerald-600 mb-2">Current Cost Rate</div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-900">
                ${costRateHistory[0]?.costRate.toLocaleString() || '0'}
              </span>
              <span className="text-sm text-gray-500 ml-1">/hour</span>
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Last updated: {formatDate(costRateHistory[0]?.date)}
            </div>
          </div>
        </div>

        {/* Hours Per Week */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Working Hours</h3>
          </div>

          <div className="space-y-4">
            <FormField label="Hours Per Week">
              <Input
                type="number"
                min="0"
                max="168"
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(parseInt(e.target.value) || 40)}
                placeholder="e.g., 40"
              />
              <p className="mt-1 text-xs text-gray-500">
                Standard working hours per week for this user
              </p>
            </FormField>
          </div>
        </div>

        {/* Billable Percentage */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Target Billable Utilization</h3>
          </div>

          <div className="space-y-4">
            <FormField label="Estimated Billable Percentage">
              <Input
                type="number"
                min="0"
                max="100"
                step="1"
                value={estimatedBillablePercentage}
                onChange={(e) => setEstimatedBillablePercentage(parseInt(e.target.value) || 0)}
                placeholder="e.g., 80"
              />
              <p className="mt-1 text-xs text-gray-500">
                Target percentage of billable hours for this user
              </p>
            </FormField>
          </div>
        </div>

        {/* Salary Section */}
        {user.employeeType === 'employee' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Salary History</h3>
              <div className="text-sm text-gray-500">
                Cost rate is auto-calculated
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Annual Salary">
                  <Input
                    type="number"
                    value={newSalary}
                    onChange={(e) => setNewSalary(e.target.value)}
                    placeholder="Enter salary"
                  />
                </FormField>
                <FormField label="Effective Date">
                  <Input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                  />
                </FormField>
              </div>
              <Button onClick={handleAddSalary} disabled={!newSalary || !effectiveDate}>
                {isCalculating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Plus className="h-4 w-4 mr-2" />
                Add Salary
              </Button>
            </div>

            <Table>
              <TableHeader>
                <tr>
                  <Th>Annual Salary</Th>
                  <Th>Effective Date</Th>
                  <Th></Th>
                </tr>
              </TableHeader>
              <TableBody>
                {salaryHistory.map((item, index) => (
                  <tr key={index}>
                    <Td>${item.salary.toLocaleString()}</Td>
                    <Td>{formatDate(item.date)}</Td>
                    <Td>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRemoveSalary(index)}
                        disabled={index === salaryHistory.length - 1}
                        title={index === salaryHistory.length - 1 ? "Cannot remove oldest salary record" : undefined}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </Td>
                  </tr>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Cost Rate Section */}
        {user.employeeType !== 'employee' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Cost Rate History</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Cost Rate">
                  <Input
                    type="number"
                    value={newCostRate}
                    onChange={(e) => setNewCostRate(e.target.value)}
                    placeholder="Enter cost rate"
                  />
                </FormField>
                <FormField label="Effective Date">
                  <Input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                  />
                </FormField>
              </div>
              <Button onClick={handleAddCostRate} disabled={!newCostRate || !effectiveDate}>
                <Plus className="h-4 w-4 mr-2" />
                Add Cost Rate
              </Button>
            </div>

            <Table>
              <TableHeader>
                <tr>
                  <Th>Cost Rate</Th>
                  <Th>Effective Date</Th>
                  <Th></Th>
                </tr>
              </TableHeader>
              <TableBody>
                {costRateHistory.map((item, index) => (
                  <tr key={index}>
                    <Td>${item.costRate.toLocaleString()}/hr</Td>
                    <Td>{formatDate(item.date)}</Td>
                    <Td>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRemoveCostRate(index)}
                        disabled={index === costRateHistory.length - 1}
                        title={index === costRateHistory.length - 1 ? "Cannot remove oldest cost rate record" : undefined}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </Td>
                  </tr>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </div>
      )}
    </SlidePanel>
  );
}