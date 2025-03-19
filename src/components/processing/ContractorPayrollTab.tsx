import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, Th, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/AlertDialog';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/Tooltip';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useUsers } from '@/lib/hooks/useUsers';
import { useReports } from '@/lib/hooks/useReports';
import { useContractorPayroll } from '@/lib/hooks/useContractorPayroll';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { format } from 'date-fns';
import { cn } from '@/lib/utils/styles';
import { formatCurrency } from '@/lib/utils/currency';

export function ContractorPayrollTab({ month }: { month: string }) {
  const { users } = useUsers();
  const [selectedContractor, setSelectedContractor] = useState<{
    id: string;
    xeroEmployeeId?: string;
    hours: number;
  } | null>(null);
  const [selectedPayRun, setSelectedPayRun] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<{
    success?: boolean;
    error?: string;
    contractorId?: string;
  }>({});

  const { draftPayRuns, updatePayslip, isUpdating } = useContractorPayroll({
    month,
    xeroEmployeeId: selectedContractor?.xeroEmployeeId || undefined
  });

  const { data, isLoading } = useReports({
    type: 'time',
    startDate: `${month}-01`,
    endDate: `${month}-31`
  });

  // Filter for contractors only
  const contractors = users.filter(user => user.employeeType === 'contractor');

  // Group time entries by contractor
  const contractorHours = contractors.map(contractor => {
    const entries = data?.entries.filter(entry => entry.userName === contractor.name) || [];
    const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
    const totalRevenue = entries.reduce((sum, entry) => sum + entry.revenue, 0);
    
    // Get approval status
    const hasUnapproved = entries.some(entry => 
      entry.approvalStatus === 'pending' || 
      entry.approvalStatus === 'rejected'
    );
    const hasApprovalRequired = entries.some(entry => 
      entry.approvalStatus !== 'Approval Not Required'
    );
    
    let approvalStatus = 'No Approval Required';
    if (hasApprovalRequired) {
      approvalStatus = hasUnapproved ? 'Pending Approval' : 'Approved';
    }

    return {
      id: contractor.id,
      xeroEmployeeId: contractor.xeroEmployeeId,
      name: contractor.name,
      totalHours,
      totalRevenue,
      approvalStatus,
      entries
    };
  });

  const handleGeneratePayslip = async () => {
    if (!selectedContractor || !selectedPayRun) return;
    
    // Find the payslip for this contractor in the selected pay run
    const payRun = draftPayRuns.find(run => run.PayRunID === selectedPayRun);
    const payslip = payRun?.Payslips.find(slip => 
      slip.EmployeeID === selectedContractor.xeroEmployeeId
    );

    if (!payslip) {
      setUpdateStatus({
        error: 'Payslip not found',
        contractorId: selectedContractor.id
      });
      return;
    }

    setUpdateStatus({
      contractorId: selectedContractor.id
    });

    try {
      await updatePayslip({
        payslipId: payslip.PayslipID,
        hours: selectedContractor.hours
      });

      setUpdateStatus({
        success: true,
        contractorId: selectedContractor.id
      });
      
      // Close dialog after a short delay to show success state
      setTimeout(() => {
        setIsDialogOpen(false);
        setSelectedContractor(null);
        setSelectedPayRun('');
      }, 1000);
    } catch (error) {
      setUpdateStatus({
        error: 'Failed to update payslip',
        contractorId: selectedContractor.id
      });
    }
  };

  // Pre-select pay run if only one exists for the contractor
  const handleOpenDialog = async (contractor: { id: string; xeroEmployeeId?: string; hours: number }) => {
    setSelectedContractor(contractor);
    
    // Find draft pay runs containing a payslip for this contractor
    const contractorPayRuns = draftPayRuns.filter(run =>
      run.Payslips.some(slip => slip.EmployeeID === contractor.xeroEmployeeId)
    );

    // If exactly one pay run exists, pre-select it
    if (contractorPayRuns.length === 1) {
      setSelectedPayRun(contractorPayRuns[0].PayRunID);
    }

    setIsDialogOpen(true);
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
              Generate payslips for contractor hours
            </p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <tr>
              <Th>Contractor</Th>
              <Th className="text-right">Total Hours</Th>
              <Th className="text-right">Total Amount</Th>
              <Th>Approval Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </TableHeader>
          <TableBody>
            {contractorHours.map(contractor => (
              <tr key={contractor.id}>
                <Td className="font-medium">{contractor.name}</Td>
                <Td className="text-right">{contractor.totalHours.toFixed(1)}</Td>
                <Td className="text-right">{formatCurrency(contractor.totalRevenue)}</Td>
                <Td>
                  <Badge
                    variant={
                      contractor.approvalStatus === 'Approved' ? 'success' :
                      contractor.approvalStatus === 'Pending Approval' ? 'warning' :
                      'secondary'
                    }
                  >
                    {contractor.approvalStatus}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex justify-end gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={
                              !contractor.xeroEmployeeId ||
                              contractor.totalHours === 0 ||
                              !draftPayRuns.some(run => 
                                run.Payslips.some(slip => 
                                  slip.EmployeeID === contractor.xeroEmployeeId
                                )
                              )
                            }
                            onClick={() => handleOpenDialog({
                                id: contractor.id,
                                xeroEmployeeId: contractor.xeroEmployeeId,
                                hours: contractor.totalHours
                            })}
                            className={cn(
                              updateStatus.contractorId === contractor.id && (
                                updateStatus.success 
                                  ? "bg-green-50 text-green-700 hover:bg-green-100"
                                  : updateStatus.error
                                  ? "bg-red-50 text-red-700 hover:bg-red-100"
                                  : ""
                              )
                            )}
                          >
                            {updateStatus.contractorId === contractor.id ? (
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
                          {!contractor.xeroEmployeeId
                            ? 'No Xero Employee ID configured'
                            : contractor.totalHours === 0
                            ? 'No hours logged'
                            : !draftPayRuns.some(run => 
                                run.Payslips.some(slip => 
                                  slip.EmployeeID === contractor.xeroEmployeeId
                                )
                              )
                            ? 'No draft pay runs found containing a payslip for this contractor'
                            : updateStatus.contractorId === contractor.id && updateStatus.error
                            ? updateStatus.error
                            : 'Generate payslip'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </Td>
              </tr>
            ))}
            {contractorHours.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">
                  No contractors found
                </td>
              </tr>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedContractor(null);
            setSelectedPayRun('');
          }
          setIsDialogOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add Hours to Contractor Payslip</AlertDialogTitle>
            <AlertDialogDescription>
              Select which pay run to update with the contractor's hours.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <Select
              value={selectedPayRun}
              onValueChange={setSelectedPayRun}
            >
              <SelectTrigger>
                {selectedPayRun ? 
                  draftPayRuns.find(run => run.PayRunID === selectedPayRun)
                    ? `${format(new Date(draftPayRuns.find(run => run.PayRunID === selectedPayRun)?.PayRunPeriodStartDate), 'MMM d')} - ${format(new Date(draftPayRuns.find(run => run.PayRunID === selectedPayRun)?.PayRunPeriodEndDate), 'MMM d, yyyy')}`
                    : 'Select Pay Run'
                  : 'Select Pay Run'}
              </SelectTrigger>
              <SelectContent>
                {draftPayRuns.length === 0 && (
                  <div className="p-2 text-sm text-gray-500">
                    No draft pay runs available
                  </div>
                )}
                {draftPayRuns.map(run => (
                  <SelectItem key={run.PayRunID} value={run.PayRunID}>
                    {format(new Date(run.PayRunPeriodStartDate), 'MMM d')} - {format(new Date(run.PayRunPeriodEndDate), 'MMM d, yyyy')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleGeneratePayslip();
              }}
              disabled={isUpdating || !selectedPayRun}
              className={cn(
                "flex items-center",
                isUpdating && "opacity-50 cursor-not-allowed"
              )}
            >
              {isUpdating && (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              )}
              {!isUpdating && (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Update Hours in Payslip
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}