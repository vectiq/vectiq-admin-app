import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { PayslipLineItems } from './PayslipLineItems';
import { formatCurrency } from '@/lib/utils/currency';
import type { Payslip } from '@/types';

interface PayslipCardProps {
  payslip: Payslip;
}

export function PayslipCard({ payslip }: PayslipCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate totals
  const totalEarnings = [
    ...(payslip.EarningsLines || []),
    ...(payslip.TimesheetEarningsLines || []),
    ...(payslip.LeaveEarningsLines || [])
  ].reduce((sum, line) => {
    const amount = line.FixedAmount || (line.NumberOfUnits * line.RatePerUnit);
    return sum + amount;
  }, 0);

  return (
    <Card className="overflow-hidden">
      <div className="p-4 flex items-center justify-between bg-gray-50 border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </Button>
          <div>
            <h5 className="font-medium text-gray-900">
              {payslip.FirstName} {payslip.LastName}
            </h5>
            <div className="text-sm text-gray-500">
              Employee ID: {payslip.EmployeeID}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Net Pay</div>
          <div className="font-semibold text-gray-900">
            {formatCurrency(payslip.NetPay)}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4">
          <PayslipLineItems payslip={payslip} />
        </div>
      )}
    </Card>
  );
}