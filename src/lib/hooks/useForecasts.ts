import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useUsers } from '@/lib/hooks/useUsers';
import { getForecastData, saveForecastDelta, clearForecastDeltas } from '@/lib/services/forecasts';

const QUERY_KEY = 'forecast';

interface UseForecastsOptions {
  month: string;
}

export function useForecasts({ month }: UseForecastsOptions) {
  const queryClient = useQueryClient();
  const { currentUser } = useUsers();

  // Query for all forecast data
  const query = useQuery({
    queryKey: [QUERY_KEY, month],
    queryFn: () => getForecastData(month, currentUser?.id || ''),
    enabled: !!month && !!currentUser?.id,
    retry: false // Don't retry failed requests
  });

  // Mutation for saving forecast delta
  const saveDeltaMutation = useMutation({
    mutationFn: ({ userId, field, value, dynamicValue }: { 
      userId: string;
      field: string;
      value: number;
      dynamicValue: number;
    }) => saveForecastDelta(userId, field, value, dynamicValue, month, currentUser?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, month] });
    }
  });

  // Mutation for clearing all deltas
  const clearDeltasMutation = useMutation({
    mutationFn: () => clearForecastDeltas(month, currentUser?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, month] });
    }
  });

  const handleSaveDelta = useCallback(async (
    userId: string,
    field: string,
    value: number,
    dynamicValue: number
  ) => {
    if (currentUser?.id) return saveDeltaMutation.mutateAsync({ userId, field, value, dynamicValue });
  }, [saveDeltaMutation]);

  const handleClearDeltas = useCallback(async () => {
    if (currentUser?.id) {
      return clearDeltasMutation.mutateAsync();
    }
  }, [clearDeltasMutation]);

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    saveDelta: handleSaveDelta,
    clearDeltas: handleClearDeltas,
    isSaving: saveDeltaMutation.isPending,
    isClearing: clearDeltasMutation.isPending
  };
}