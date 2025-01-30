import { useState } from 'react';
import { format } from 'date-fns';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { PayslipCard } from './PayslipCard';
import { PayRunSummary } from './PayRunSummary';
import type { PayRun } from '@/types';

interface PayRunCardProps {
  payRun: PayRun;
  calendarName?: string;
  calendarType?: string;
}

export function PayRunCard({ payRun, calendarName, calendarType }: PayRunCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-b border-gray-200 last:border-0">
      <div className="py-4">
        <div className="flex items-center justify-between">
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
              <h4 className="text-lg font-medium text-gray-900">
                {format(new Date(payRun.PayRunPeriodStartDate), 'MMM d')} - {format(new Date(payRun.PayRunPeriodEndDate), 'MMM d, yyyy')}
              </h4>
              <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
              {calendarType && (
                  <>
                    <Badge variant="secondary">{calendarType}</Badge>
                  </>
                )}
                <span>{payRun.Payslips.length} Employees,</span>
                <span>Payment Date: {format(new Date(payRun.PaymentDate), 'MMM d, yyyy')}</span>
                <Badge
                  variant={payRun.PayRunStatus === 'POSTED' ? 'success' : 'warning'}
                >
                  {payRun.PayRunStatus}
                </Badge>
                
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-500">Net Pay</div>
            <div className="text-lg font-semibold text-gray-900">
              ${payRun.NetPay.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="py-4 space-y-6">
          <PayRunSummary payRun={payRun} />
          
          <div className="space-y-4">
            {payRun.Payslips.map((payslip) => (
              <PayslipCard key={payslip.PayslipID} payslip={payslip} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}