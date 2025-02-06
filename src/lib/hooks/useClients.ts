import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
  getClients,
  createClient,
  updateClient,
} from '@/lib/services/clients';
import type { Client } from '@/types';

const QUERY_KEY = 'clients';

export function useClients() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [QUERY_KEY],
    queryFn: getClients
  });

  const createMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    }
  });

  const handleCreateClient = useCallback(async (data: Omit<Client, 'id'>) => {
    return createMutation.mutateAsync(data);
  }, [createMutation]);

  const handleUpdateClient = useCallback(async (id: string, data: Partial<Client>) => {
    return updateMutation.mutateAsync(id, data);
  }, [updateMutation]);

  return {
    clients: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createClient: handleCreateClient,
    updateClient: handleUpdateClient,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}