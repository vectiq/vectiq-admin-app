import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, Th, Td } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/Tooltip';
import { FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useContractorPayroll } from '@/lib/hooks/useContractorPayroll';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import type { PayRun } from '@/types';

interface ContractorPayrollTabProps {
  payRun: PayRun;
  onPayRunChange: (id: string) => void;
}

export function ContractorPayrollTab({ 
  payRun,
  onPayRunChange
}: ContractorPayrollTabProps) {
  const [updateStatus, setUpdateStatus] = useState<{
    success?: boolean;
    error?: string;
    contractorId?: string;
  }>({});

  const { contractorHours, isLoading, updatePayslip, isUpdating } = useContractorPayroll({
    payRun
  });

  const handleUpdatePayslip = async (contractorId: string, payslipId: string, hours: number) => {
    if (!payslipId) return;

    setUpdateStatus({
      contractorId
    });

    try {
      await updatePayslip({
        payslipId,
        hours
      });

      setUpdateStatus({
        success: true,
        contractorId
      });
    } catch (error) {
      setUpdateStatus({
        error: 'Failed to update payslip',
        contractorId
      });
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Contractor Hours</h3>
            <p className="mt-1 text-sm text-gray-500">
              Manage contractor hours for the selected pay run
            </p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <tr>
              <Th>Contractor</Th>
              <Th className="text-right">Total Hours</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </TableHeader>
          <TableBody>
            {contractorHours.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-4 text-gray-500">
                  No contractors found in this pay run
                </td>
              </tr>
            )}
            {contractorHours.map((contractor) => (
              <tr key={contractor.userId}>
                <Td className="font-medium">{contractor.name}</Td>
                <Td className="text-right">{contractor.hours.toFixed(1)}</Td>
                <Td>
                  <div className="flex justify-end gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={isUpdating || !contractor.payslipId}
                            onClick={() => handleUpdatePayslip(
                              contractor.userId,
                              contractor.payslipId!,
                              contractor.hours
                            )}
                            className={updateStatus.contractorId === contractor.userId && (
                              updateStatus.success 
                                ? "bg-green-50 text-green-700 hover:bg-green-100"
                                : updateStatus.error
                                ? "bg-red-50 text-red-700 hover:bg-red-100"
                                : ""
                            )}
                          >
                            {updateStatus.contractorId === contractor.userId ? (
                              updateStatus.success ? (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                  Updated
                                </>
                              ) : updateStatus.error ? (
                                <>
                                  <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
                                  Failed
                                </>
                              ) : isUpdating ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Updating...
                                </>
                              ) : (
                                <>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Add Hours
                                </>
                              )
                            ) : (
                              <>
                                <FileText className="h-4 w-4 mr-2" />
                                Add Hours
                              </>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {!contractor.payslipId
                            ? 'No payslip found'
                            : contractor.hours === 0
                            ? 'No hours logged'
                            : updateStatus.contractorId === contractor.userId && updateStatus.error
                            ? updateStatus.error
                            : 'Update hours in payslip'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </Td>
              </tr>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}