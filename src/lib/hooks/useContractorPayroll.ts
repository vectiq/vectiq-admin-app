import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPayRuns, updatePayslip } from '@/lib/services/contractorPayroll';

interface UseContractorPayrollOptions {
  month: string;
  xeroEmployeeId?: string;
}

export function useContractorPayroll({ month }: UseContractorPayrollOptions) {
  const queryClient = useQueryClient();

  const payRunsQuery = useQuery({
    queryKey: ['payruns'],
    queryFn: getPayRuns,
    select: (payRuns) => {
      return payRuns.filter(run => run.PayRunStatus === 'DRAFT');
    }
  });

  const updatePayslipMutation = useMutation({
    mutationFn: updatePayslip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
    }
  });

  return {
    draftPayRuns: payRunsQuery.data || [],
    updatePayslip: updatePayslipMutation.mutateAsync,
    isUpdating: updatePayslipMutation.isPending
  };
}