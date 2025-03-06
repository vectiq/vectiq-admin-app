import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { processContractorHours } from '@/lib/services/contractors';
import { useUsers } from '@/lib/hooks/useUsers';
import { useProcessing } from '@/lib/hooks/useProcessing';
import type { User } from '@/types';

const QUERY_KEY = 'contractors';

interface UseContractorsOptions {
  month: string;
}

export function useContractors({ month }: UseContractorsOptions) {
  const queryClient = useQueryClient();
  const { users } = useUsers();
  const { data: processingData } = useProcessing(new Date(month + '-01'));

  // Get contractors and their hours
  const contractors = users.filter(user => user.employeeType === 'contractor');
  const contractorHours = new Map<string, number>();

  // Calculate hours for each contractor
  processingData?.projects.forEach(project => {
    project.assignments.forEach(assignment => {
      const user = contractors.find(c => c.id === assignment.userId);
      if (user) {
        contractorHours.set(
          user.id,
          (contractorHours.get(user.id) || 0) + assignment.hours
        );
      }
    });
  });

  // Process contractors mutation
  const processMutation = useMutation({
    mutationFn: async ({ 
      startDate, 
      endDate, 
      contractors, 
      contractorHours, 
      payRunId 
    }: {
      startDate: string;
      endDate: string;
      contractors: User[];
      contractorHours: Map<string, number>;
      payRunId: string;
    }) => {
      await processContractorHours(
        startDate,
        endDate,
        contractors,
        contractorHours,
        payRunId
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, month] });
    }
  });

  const handleProcessContractors = useCallback(async (
    startDate: string,
    endDate: string,
    payRunId: string
  ) => {
    return processMutation.mutateAsync({
      startDate,
      endDate,
      contractors,
      contractorHours,
      payRunId
    });
  }, [contractors, contractorHours, processMutation]);

  return {
    contractors,
    contractorHours,
    processContractors: handleProcessContractors,
    isProcessing: processMutation.isPending
  };
}