import { useQuery, useMutation } from '@tanstack/react-query';
import { generateOvertimeReport, submitOvertime, checkOvertimeSubmission } from '@/lib/services/overtime';
import type { OvertimeReportData } from '@/types';

interface UseOvertimeOptions {
  startDate: string;
  endDate: string;
}

export function useOvertime({ startDate, endDate }: UseOvertimeOptions) {
  const query = useQuery({
    queryKey: ['overtime', startDate, endDate],
    queryFn: () => generateOvertimeReport({ startDate, endDate })
  });

  const submitMutation = useMutation({
    mutationFn: (args: { 
      data: OvertimeReportData; 
      startDate: string; 
      endDate: string; 
      month: string;
      payRunId: string;
    }) => submitOvertime(
      args.data,
      args.startDate,
      args.endDate,
      args.month,
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