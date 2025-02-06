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

  // Function to create default forecast
  const createDefaultForecast = useCallback(async (entries: SavedForecast['entries']) => {
    const defaultName = `Default - ${month.substring(5, 7)}/${month.substring(0, 4)}`;
    
    try {
      // Check if default forecast already exists
      const existingForecasts = await getSavedForecasts(month);
      const defaultForecast = existingForecasts.find(f => f.name === defaultName);
      if (defaultForecast) {
        return defaultForecast;
      }

      // Create new default forecast
      const newForecast = await saveForecast(defaultName, month, entries);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, month] });
      
      return newForecast;
    } catch (error) {
      console.error('Error creating default forecast:', error);
      throw error;
    }
  }, [month]);

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
    createDefaultForecast,
    error: query.error,
    saveForecast: handleSaveForecast,
    updateForecast: handleUpdateForecast,
    deleteForecast: deleteMutation.mutateAsync,
    isSaving: saveMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}