import { Table, TableHeader, TableBody, Th, Td } from '@/components/ui/Table';
import { formatCurrency } from '@/lib/utils/currency';
import { usePayroll } from '@/lib/hooks/usePayroll';
import type { Payslip } from '@/types';

interface PayslipLineItemsProps {
  payslip: Payslip;
}

export function PayslipLineItems({ payslip }: PayslipLineItemsProps) {
  const { payItems } = usePayroll({ selectedDate: new Date() });

  // Helper function to get pay item name
  const getPayItemName = (earningsRateId: string) => {
    const payItem = payItems.find(item => item.EarningsRateID === earningsRateId);
    return payItem?.Name || 'Unknown Earnings Type';
  };

  return (
    <div className="space-y-6">
      {/* Earnings */}
      {(payslip.EarningsLines?.length > 0 || 
        payslip.TimesheetEarningsLines?.length > 0 || 
        payslip.LeaveEarningsLines?.length > 0) && (
        <div>
          <h6 className="text-sm font-medium text-gray-900 mb-3">Earnings</h6>
          <Table>
            <TableHeader>
              <tr>
                <Th>Type</Th>
                <Th className="text-right">Units</Th>
                <Th className="text-right">Rate</Th>
                <Th className="text-right">Amount</Th>
              </tr>
            </TableHeader>
            <TableBody>
              {payslip.EarningsLines?.map((line, index) => (
                <tr key={`earnings-${index}`}>
                  <Td>{getPayItemName(line.EarningsRateID)}</Td>
                  <Td className="text-right">{line.NumberOfUnits?.toFixed(2) || '-'}</Td>
                  <Td className="text-right">{line.RatePerUnit ? formatCurrency(line.RatePerUnit) : '-'}</Td>
                  <Td className="text-right">{formatCurrency(line.FixedAmount || (line.NumberOfUnits * line.RatePerUnit))}</Td>
                </tr>
              ))}
              {payslip.TimesheetEarningsLines?.map((line, index) => (
                <tr key={`timesheet-${index}`}>
                  <Td>{getPayItemName(line.EarningsRateID)}</Td>
                  <Td className="text-right">{line.NumberOfUnits.toFixed(2)}</Td>
                  <Td className="text-right">{formatCurrency(line.RatePerUnit)}</Td>
                  <Td className="text-right">{formatCurrency(line.NumberOfUnits * line.RatePerUnit)}</Td>
                </tr>
              ))}
              {payslip.LeaveEarningsLines?.map((line, index) => (
                <tr key={`leave-${index}`}>
                  <Td>{getPayItemName(line.EarningsRateID)}</Td>
                  <Td className="text-right">{line.NumberOfUnits.toFixed(2)}</Td>
                  <Td className="text-right">{formatCurrency(line.RatePerUnit)}</Td>
                  <Td className="text-right">{formatCurrency(line.NumberOfUnits * line.RatePerUnit)}</Td>
                </tr>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Rest of the component remains unchanged... */}
    </div>
  );
}