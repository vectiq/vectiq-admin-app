import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { getSavedForecasts, saveForecast, updateForecast, deleteForecast } from '@/lib/services/forecasts';
import type { SavedForecast } from '@/types';

const QUERY_KEY = 'forecasts';

interface UseForecastsOptions {
  month: string;
}

export function useForecasts({ month }: UseForecastsOptions) {
  const queryClient = useQueryClient();

  // Query for saved forecasts
  const query = useQuery({
    queryKey: [QUERY_KEY, month],
    queryFn: () => getSavedForecasts(month),
  });

  // Mutation for saving forecasts
  const saveMutation = useMutation({
    mutationFn: async ({ name, entries }: { 
      name: string; 
      entries: SavedForecast['entries'];
    }) => {
      return saveForecast(name, month, entries);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, month] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (args: {
      id: string;
      month: string;
      name: string;
      entries: SavedForecast['entries'];
    }) => {
      return updateForecast(args.id, args.month, args.name, args.entries);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, month] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteForecast(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, month] });
    }
  });

  const handleSaveForecast = useCallback(async (name: string, entries: SavedForecast['entries']) => {
    return saveMutation.mutateAsync({ name, entries });
  }, [saveMutation]);

  const handleUpdateForecast = useCallback(async (id: string, month: string, name: string, entries: SavedForecast['entries']) => {
    return updateMutation.mutateAsync({ id, month, name, entries });
  }, [updateMutation]);

  return {
    forecasts: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    saveForecast: handleSaveForecast,
    updateForecast: handleUpdateForecast,
    deleteForecast: deleteMutation.mutateAsync,
    isSaving: saveMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}