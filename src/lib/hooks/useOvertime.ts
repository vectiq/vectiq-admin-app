import { useQuery, useMutation } from '@tanstack/react-query';
import { generateOvertimeReport, submitOvertime, checkOvertimeSubmission } from '@/lib/services/overtime';
import type { OvertimeReportData, PayRun } from '@/types';

interface UseOvertimeOptions {
  payRun: PayRun | null;
}

export function useOvertime({ payRun }: UseOvertimeOptions) {
  const query = useQuery({
    queryKey: ['overtime', payRun?.PayRunID],
    queryFn: () => generateOvertimeReport(payRun!),
    enabled: !!payRun
  });

  const submitMutation = useMutation({
    mutationFn: (args: { 
      data: OvertimeReportData; 
      payRunId: string;
    }) => submitOvertime(
      args.data,
      args.payRunId
    )
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    submitOvertime: submitMutation.mutateAsync,
    isSubmitting: submitMutation.isPending,
    checkSubmission: checkOvertimeSubmission
  };
}