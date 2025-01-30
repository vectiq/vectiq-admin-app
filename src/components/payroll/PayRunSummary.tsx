import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/currency';
import type { PayRun } from '@/types';

interface PayRunSummaryProps {
  payRun: PayRun;
}

export function PayRunSummary({ payRun }: PayRunSummaryProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm font-medium text-gray-600">Wages</p>
        <p className="mt-2 text-lg font-semibold text-gray-900">
          {formatCurrency(payRun.Wages)}
        </p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm font-medium text-gray-600">Tax</p>
        <p className="mt-2 text-lg font-semibold text-gray-900">
          {formatCurrency(payRun.Tax)}
        </p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm font-medium text-gray-600">Super</p>
        <p className="mt-2 text-lg font-semibold text-gray-900">
          {formatCurrency(payRun.Super)}
        </p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm font-medium text-gray-600">Deductions</p>
        <p className="mt-2 text-lg font-semibold text-gray-900">
          {formatCurrency(payRun.Deductions)}
        </p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm font-medium text-gray-600">Reimbursements</p>
        <p className="mt-2 text-lg font-semibold text-gray-900">
          {formatCurrency(payRun.Reimbursement)}
        </p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm font-medium text-gray-600">Net Pay</p>
        <p className="mt-2 text-lg font-semibold text-indigo-600">
          {formatCurrency(payRun.NetPay)}
        </p>
      </div>
    </div>
  );
}