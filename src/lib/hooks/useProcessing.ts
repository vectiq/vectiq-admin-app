import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { getProcessingData, updateProjectStatus, generateInvoice } from '@/lib/services/processing';
import type { ProcessingProject } from '@/types';

const QUERY_KEY = 'processing';

export function useProcessing(selectedDate: Date) {
  const queryClient = useQueryClient();
  const month = format(selectedDate, 'yyyy-MM');

  // Query for processing data
  const query = useQuery({
    queryKey: [QUERY_KEY, month],
    queryFn: () => getProcessingData(month)
  });

  // Mutation for generating invoice
  const invoiceMutation = useMutation({
    mutationFn: generateInvoice,
    onSuccess: (response, project) => {
      // Optionally invalidate queries if needed
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, month] });
      
      // Update the submittedInvoices cache to immediately reflect the change
      queryClient.setQueryData([QUERY_KEY, month], (oldData: any) => {
        if (!oldData) return oldData;
        
        // Create a new submittedInvoices object with the newly submitted invoice
        const submittedInvoices = { ...oldData.submittedInvoices, [project.id]: true };
        
        return {
          ...oldData,
          submittedInvoices
        };
      });
    }
  });

  // Mutation for updating project status
  const statusMutation = useMutation({
    mutationFn: ({ projectId, status }: { projectId: string, status: 'not started' | 'draft' | 'sent' }) =>
      updateProjectStatus(projectId, month, status),
    onSuccess: () => {
      // Invalidate processing data query to trigger refresh
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, month] });
    }
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    generateInvoice: invoiceMutation.mutateAsync,
    isGeneratingInvoice: invoiceMutation.isPending,
    invoiceError: invoiceMutation.error,
    updateStatus: statusMutation.mutateAsync,
    isUpdating: statusMutation.isPending
  };
}