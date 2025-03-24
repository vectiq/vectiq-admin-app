import { format } from 'date-fns';
import { Card } from '@/components/ui/Card';
import { PayRunSummary } from '@/components/payroll/PayRunSummary';
import { PayslipCard } from '@/components/payroll/PayslipCard';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { DollarSign } from 'lucide-react';
import type { PayRun } from '@/types';

interface PayrollTabProps {
  payRun: PayRun;
}

export function PayrollTab({ payRun }: PayrollTabProps) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Pay Run Summary</h3>
              <p className="mt-1 text-sm text-gray-500">
                {format(new Date(payRun.PayRunPeriodStartDate), 'MMM d')} - {format(new Date(payRun.PayRunPeriodEndDate), 'MMM d, yyyy')}
              </p>
            </div>
          </div>

          <PayRunSummary payRun={payRun} />
        </div>
      </Card>

      {/* Payslips */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Payslips</h3>
          <div className="space-y-4">
            {payRun.Payslips.map((payslip) => (
              <PayslipCard key={payslip.PayslipID} payslip={payslip} />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}