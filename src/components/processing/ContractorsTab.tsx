import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, Th, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/Select';
import { useContractors } from '@/lib/hooks/useContractors';
import { useTeams } from '@/lib/hooks/useTeams';
import { usePayroll } from '@/lib/hooks/usePayroll';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils/currency';
import { DollarSign, Loader2 } from 'lucide-react';

interface ContractorsTabProps {
  month: string;
}

export function ContractorsTab({ month }: ContractorsTabProps) {
  const [selectedPayRun, setSelectedPayRun] = useState('');
  const { payRuns } = usePayroll({ selectedDate: new Date(month + '-01') });
  const { teams } = useTeams();
  const { contractors, contractorHours, processContractors, isProcessing } = useContractors({ month });

  // Filter to only show draft pay runs
  const draftPayRuns = useMemo(() => 
    payRuns.filter(run => run.PayRunStatus === 'DRAFT'),
    [payRuns]
  );


  const handleProcessContractors = async () => {
    if (!selectedPayRun) return;
    
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;

    try {
      await processContractors(
        startDate,
        endDate,
        selectedPayRun
      );
      alert('Successfully processed contractor hours');
    } catch (error) {
      console.error('Error processing contractor hours:', error);
      alert('Failed to process contractor hours. Please check the console for details.');
    }
    setSelectedPayRun('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Select
            value={selectedPayRun}
            onValueChange={setSelectedPayRun}
          >
            <SelectTrigger className="w-[300px]">
              {selectedPayRun ? 
                draftPayRuns.find(run => run.PayRunID === selectedPayRun)
                  ? `${format(new Date(draftPayRuns.find(run => run.PayRunID === selectedPayRun)?.PayRunPeriodStartDate), 'MMM d')} - ${format(new Date(draftPayRuns.find(run => run.PayRunID === selectedPayRun)?.PayRunPeriodEndDate), 'MMM d, yyyy')}`
                  : 'Select Pay Run'
                : 'Select Pay Run'}
            </SelectTrigger>
            <SelectContent>
              {draftPayRuns.map(run => (
                <SelectItem key={run.PayRunID} value={run.PayRunID}>
                  {format(new Date(run.PayRunPeriodStartDate), 'MMM d')} - {format(new Date(run.PayRunPeriodEndDate), 'MMM d, yyyy')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            onClick={handleProcessContractors}
            disabled={isProcessing || !selectedPayRun || !contractors.some(c => contractorHours.get(c.id) > 0)}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <DollarSign className="h-4 w-4 mr-2" />
            )}
            Process Contractor Hours
          </Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <tr>
              <Th>Contractor</Th>
              <Th>Team</Th>
              <Th className="text-right">Total Hours</Th>
              <Th className="text-right">Cost Rate</Th>
              <Th className="text-right">Total Cost</Th>
            </tr>
          </TableHeader>
          <TableBody>
            {contractors.map(contractor => {
              const totalHours = contractorHours.get(contractor.id) || 0;
              const costRate = contractor.costRate?.[0]?.costRate || 0;
              const totalCost = totalHours * costRate;

              return (
                <tr key={contractor.id}>
                  <Td className="font-medium">{contractor.name}</Td>
                  <Td>
                    {contractor.teamId ? (
                      <Badge variant="secondary">
                        {teams.find(t => t.id === contractor.teamId)?.name || '-'}
                      </Badge>
                    ) : '-'}
                  </Td>
                  <Td className="text-right">{totalHours.toFixed(1)}</Td>
                  <Td className="text-right">{formatCurrency(costRate)}/hr</Td>
                  <Td className="text-right">{formatCurrency(totalCost)}</Td>
                </tr>
              );
            })}
            {contractors.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">
                  No contractors found
                </td>
              </tr>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}