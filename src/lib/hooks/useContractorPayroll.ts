import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getContractorHours, updateContractorPayslip } from '@/lib/services/contractors';
import type { PayRun } from '@/types';

interface UseContractorPayrollOptions {
  payRun: PayRun | null;
}

export function useContractorPayroll({ payRun }: UseContractorPayrollOptions) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['contractor-hours', payRun?.PayRunID],
    queryFn: () => getContractorHours(payRun!),
    enabled: !!payRun
  });

  const updatePayslipMutation = useMutation({
    mutationFn: ({ payslipId, hours }: { payslipId: string; hours: number }) =>
      updateContractorPayslip(payslipId, hours),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractor-hours'] });
    }
  });

  return {
    contractorHours: query.data || [],
    isLoading: query.isLoading,
    updatePayslip: updatePayslipMutation.mutateAsync,
    isUpdating: updatePayslipMutation.isPending
  };
}