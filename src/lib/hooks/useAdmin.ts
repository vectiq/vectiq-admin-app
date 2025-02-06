import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import {
  getXeroConfig,
  updateXeroConfig,
  exportCollectionAsJson,
  getSystemConfig,
  updateSystemConfig,
  getAdminStats,
  recalculateProjectTotals,
  cleanupOrphanedData,
  validateTimeEntries,
  getPublicHolidays,
  addPublicHoliday,
  deletePublicHoliday,
  generateTestData,
  clearTestData
} from '@/lib/services/admin';
import type { SystemConfig, TestDataOptions, XeroConfig } from '@/types';

const QUERY_KEYS = {
  config: 'system-config',
  xeroConfig: 'xero-config',
  stats: 'admin-stats',
  holidays: 'public-holidays'
} as const;

export function useAdmin() {
  const queryClient = useQueryClient();
  const [exportedData, setExportedData] = useState<string | undefined>();

  const xeroConfigQuery = useQuery({
    queryKey: [QUERY_KEYS.xeroConfig],
    queryFn: getXeroConfig
  });

  const configQuery = useQuery({
    queryKey: [QUERY_KEYS.config],
    queryFn: getSystemConfig
  });

  const statsQuery = useQuery({
    queryKey: [QUERY_KEYS.stats],
    queryFn: getAdminStats
  });

  const holidaysQuery = useQuery({
    queryKey: [QUERY_KEYS.holidays],
    queryFn: getPublicHolidays
  });

  const addHolidayMutation = useMutation({
    mutationFn: addPublicHoliday,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.holidays] });
    }
  });

  const deleteHolidayMutation = useMutation({
    mutationFn: deletePublicHoliday,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.holidays] });
    }
  });

  const updateConfigMutation = useMutation({
    mutationFn: updateSystemConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.config] });
    }
  });

  const updateXeroConfigMutation = useMutation({
    mutationFn: updateXeroConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.xeroConfig] });
    }
  });

  const recalculateMutation = useMutation({
    mutationFn: recalculateProjectTotals
  });

  const cleanupMutation = useMutation({
    mutationFn: cleanupOrphanedData
  });

  const generateTestDataMutation = useMutation({
    mutationFn: generateTestData
  });

  const clearTestDataMutation = useMutation({
    mutationFn: clearTestData
  });

  const validateMutation = useMutation({
    mutationFn: validateTimeEntries
  });

  const exportMutation = useMutation({
    mutationFn: async (collectionName: string) => {
      const data = await exportCollectionAsJson(collectionName);
      setExportedData(JSON.stringify(data, null, 2));
    }
  });

  const handleUpdateConfig = useCallback(async (config: SystemConfig) => {
    await updateConfigMutation.mutateAsync(config);
  }, [updateConfigMutation]);

  const handleUpdateXeroConfig = useCallback(async (config: XeroConfig) => {
    await updateXeroConfigMutation.mutateAsync(config);
  }, [updateXeroConfigMutation]);

  return {
    config: configQuery.data,
    stats: statsQuery.data,
    holidays: holidaysQuery.data || [],
    xeroConfig: xeroConfigQuery.data,
    isLoading: configQuery.isLoading || statsQuery.isLoading,
    updateConfig: handleUpdateConfig,
    updateXeroConfig: handleUpdateXeroConfig,
    addHoliday: addHolidayMutation.mutateAsync,
    deleteHoliday: deleteHolidayMutation.mutateAsync,
    recalculateProjectTotals: recalculateMutation.mutateAsync,
    generateTestData: generateTestDataMutation.mutateAsync,
    clearTestData: clearTestDataMutation.mutateAsync,
    cleanupOrphanedData: cleanupMutation.mutateAsync,
    validateTimeEntries: validateMutation.mutateAsync,
    exportCollection: exportMutation.mutateAsync,
    exportedData,
    isUpdating: updateConfigMutation.isPending,
    isUpdatingXero: updateXeroConfigMutation.isPending,
    isAddingHoliday: addHolidayMutation.isPending,
    isDeletingHoliday: deleteHolidayMutation.isPending,
    isGenerating: generateTestDataMutation.isPending,
    isClearing: clearTestDataMutation.isPending,
    isRecalculating: recalculateMutation.isPending,
    isCleaning: cleanupMutation.isPending,
    isValidating: validateMutation.isPending,
    isExporting: exportMutation.isPending
  };
}