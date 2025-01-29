import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { getSavedForecasts, saveForecast, deleteForecast } from '@/lib/services/forecasts';
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
    queryFn: () => getSavedForecasts(month)
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
    mutationFn: async ({ id, entries }: {
      id: string;
      entries: SavedForecast['entries'];
    }) => {
      const forecast = query.data?.find(f => f.id === id);
      if (!forecast) throw new Error('Forecast not found');
      
      return updateForecast(id, month, forecast.name, entries);
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

  const handleUpdateForecast = useCallback(async (id: string, entries: SavedForecast['entries']) => {
    return updateMutation.mutateAsync({ id, entries });
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