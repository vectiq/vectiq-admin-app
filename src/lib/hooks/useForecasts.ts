import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import { useCallback } from 'react';
import { saveForecastDelta, getForecastDeltas } from '@/lib/services/forecasts';
import type { ForecastOverride } from '@/types';

const QUERY_KEY = 'forecast-deltas';

interface UseForecasts {
  userId?: string;
  month: string;
}

export function useForecasts({ userId, month }: UseForecasts) {
  const queryClient = useQueryClient();


  // Query for forecast deltas
  const deltasQuery = useQuery({
    queryKey: [QUERY_KEY, userId, month],
    queryFn: () => getForecastDeltas(userId, month),
    enabled: !!userId && !!month
  });


  // Mutation for saving forecast delta
  const saveDeltaMutation = useMutation({
    mutationFn: ({ month, field, value, dynamicValue }: { 
      month: string;
      field: string;
      value: number;
      dynamicValue: number;
    }) => saveForecastDelta(userId!, month, field, value, dynamicValue),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    }
  });

  const handleSaveDelta = useCallback(async (
    month: string,
    field: string,
    value: number,
    dynamicValue: number
  ) => {
    if (!userId) return null;
    return saveDeltaMutation.mutateAsync({ month, field, value, dynamicValue });
  }, [userId, saveDeltaMutation]);

  return {
    deltas: deltasQuery.data,
    saveDelta: handleSaveDelta,
    isSaving: saveDeltaMutation.isPending
  };
}