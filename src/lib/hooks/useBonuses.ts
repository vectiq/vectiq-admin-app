import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
  getBonuses,
  createBonus,
  deleteBonus,
  updateBonus,
  processXeroBonus,
} from '@/lib/services/bonuses';
import type { Bonus } from '@/types';

const QUERY_KEY = 'bonuses';

export function useBonuses(month?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [QUERY_KEY, month],
    queryFn: () => getBonuses(month)
  });

  const createMutation = useMutation({
    mutationFn: createBonus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBonus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Bonus> }) => updateBonus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    }
  });

  const processMutation = useMutation({
    mutationFn: ({ bonus, payslipId, payItemId }: { bonus: Bonus; payslipId: string; payItemId: string }) => 
      processXeroBonus(bonus, payslipId, payItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    }
  });

  const handleCreateBonus = useCallback(async (data: Omit<Bonus, 'id'>) => {
    return createMutation.mutateAsync(data);
  }, [createMutation]);

  const handleUpdateBonus = useCallback(async (id: string, data: Partial<Bonus>) => {
    return updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const handleDeleteBonus = useCallback(async (id: string) => {
    return deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const handleProcessBonus = useCallback(async (bonus: Bonus, payslipId: string, payItemId: string) => {
    return processMutation.mutateAsync({ bonus, payslipId, payItemId });
  }, [processMutation]);

  return {
    bonuses: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createBonus: handleCreateBonus,
    updateBonus: handleUpdateBonus,
    deleteBonus: handleDeleteBonus,
    processBonus: handleProcessBonus,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isProcessing: processMutation.isPending,
  };
}