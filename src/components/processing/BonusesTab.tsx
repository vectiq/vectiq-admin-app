import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, Th, Td } from '@/components/ui/Table';
import { Badge  } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/Tooltip';
import { useUsers } from '@/lib/hooks/useUsers';
import { useBonuses } from '@/lib/hooks/useBonuses';
import { useTeams } from '@/lib/hooks/useTeams';
import { formatCurrency } from '@/lib/utils/currency';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Loader2, DollarSign, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import type { PayRun, XeroConfig } from '@/types';

interface BonusesTabProps {
  payRun: PayRun;
}

export function BonusesTab({ payRun }: BonusesTabProps) {
  const [processingBonus, setProcessingBonus] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<{
    success?: boolean;
    error?: string;
    bonusId?: string;
  }>({});
  const [xeroConfig, setXeroConfig] = useState<XeroConfig | null>(null);
  const { users } = useUsers();
  const { teams } = useTeams();
  const { bonuses, processBonus } = useBonuses();

  // Get Xero config when component mounts
  useEffect(() => {
    async function getXeroConfig() {
      const configRef = doc(db, 'config', 'xero_config');
      const configDoc = await getDoc(configRef);
      if (configDoc.exists()) {
        setXeroConfig(configDoc.data() as XeroConfig);
      }
    }
    getXeroConfig();
  }, []);

  // Filter bonuses that fall within the pay run period
  const payRunBonuses = bonuses.filter(bonus => {
    const bonusDate = parseISO(bonus.date);
    const startDate = parseISO(payRun.PayRunPeriodStartDate);
    const endDate = parseISO(payRun.PayRunPeriodEndDate);
    return bonusDate >= startDate && bonusDate <= endDate;
  });

  // Get employees who have payslips in this pay run
  const payslipEmployees = new Set(
    payRun.Payslips.map(slip => slip.EmployeeID)
  );

  // Filter bonuses to only show those for employees in the pay run
  const eligibleBonuses = payRunBonuses.filter(bonus => {
    const employee = users.find(u => u.id === bonus.employeeId);
    return employee && payslipEmployees.has(employee.xeroEmployeeId);
  });

  const handleProcessBonus = async (bonus: any) => {
    if (bonus.paid) return;
    if (!xeroConfig?.bonusPayItemId) {
      setUpdateStatus({
        error: 'Bonus pay item not configured in Xero settings',
        bonusId: bonus.id
      });
      return;
    }
    
    setProcessingBonus(bonus.id);
    setUpdateStatus({ bonusId: bonus.id });

    // Get employee's Xero ID
    const employee = users.find(u => u.id === bonus.employeeId);
    if (!employee?.xeroEmployeeId) {
      setUpdateStatus({
        error: 'Employee has no Xero ID configured',
        bonusId: bonus.id
      });
      setProcessingBonus(null);
      return;
    }

    // Get payslip for employee
    const payslip = payRun.Payslips.find(slip => slip.EmployeeID === employee.xeroEmployeeId);
    if (!payslip) {
      setUpdateStatus({
        error: 'No payslip found for employee',
        bonusId: bonus.id
      });
      setProcessingBonus(null);
      return;
    }

    try {
      await processBonus(bonus, payslip.PayslipID, xeroConfig.bonusPayItemId!);

      setUpdateStatus({
        success: true,
        bonusId: bonus.id
      });
    } catch (error) {
      console.error('Failed to process bonuses:', error);
      setUpdateStatus({
        error: error.message || 'Failed to process bonus',
        bonusId: bonus.id
      });
    } finally {
      setProcessingBonus(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Bonuses</h3>
          <p className="mt-1 text-sm text-gray-500">
            Process bonuses for the current pay run
          </p>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <tr>
              <Th>Employee</Th>
              <Th>Team</Th>
              <Th>Date</Th>
              <Th>KPIs</Th>
              <Th className="text-right">Amount</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </TableHeader>
          <TableBody>
            {eligibleBonuses.map((bonus) => {
              const employee = users.find(u => u.id === bonus.employeeId);
              
              return (
                <tr key={bonus.id}>
                  <Td className="font-medium">{employee?.name}</Td>
                  <Td>
                    {employee?.teamId ? (
                      <Badge variant="secondary">
                        {teams.find(t => t.id === employee.teamId)?.name || '-'}
                      </Badge>
                    ) : '-'}
                  </Td>
                  <Td>{format(parseISO(bonus.date), 'MMM d, yyyy')}</Td>
                  <Td>{bonus.kpis || '-'}</Td>
                  <Td className="text-right font-medium">{formatCurrency(bonus.amount)}</Td>
                  <Td>
                    <Badge
                      variant={bonus.paid ? 'success' : 'warning'}
                    >
                      {bonus.paid ? 'Processed' : 'Pending'}
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
                              disabled={processingBonus === bonus.id || bonus.paid || !xeroConfig?.bonusPayItemId}
                              onClick={() => handleProcessBonus(bonus)}
                              className={updateStatus.bonusId === bonus.id && (
                                updateStatus.success 
                                  ? "bg-green-50 text-green-700 hover:bg-green-100"
                                  : updateStatus.error
                                  ? "bg-red-50 text-red-700 hover:bg-red-100"
                                  : ""
                              )}
                            >
                              {updateStatus.bonusId === bonus.id ? (
                                updateStatus.success ? (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                    Added
                                  </>
                                ) : updateStatus.error ? (
                                  <>
                                    <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
                                    Failed
                                  </>
                                ) : processingBonus === bonus.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Adding...
                                  </>
                                ) : (
                                  <>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Add to Payrun
                                  </>
                                )
                              ) : (
                                <>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Add to Payrun
                                </>
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {bonus.paid
                              ? 'Bonus already processed'
                              : !xeroConfig?.bonusPayItemId
                              ? 'Bonus pay item not configured'
                              : updateStatus.bonusId === bonus.id && updateStatus.error
                              ? updateStatus.error
                              : 'Add bonus to payrun'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </Td>
                </tr>
              );
            })}
            {eligibleBonuses.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-4 text-gray-500">
                  No bonuses found for this pay run period
                </td>
              </tr>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}