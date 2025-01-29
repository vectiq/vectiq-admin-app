import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Loader2, Search, Database, Trash2, Users } from 'lucide-react';
import { format } from 'date-fns';
import type { TestDataOptions } from '@/types';
import { useUsers } from '@/lib/hooks/useUsers';
import { useProjects } from '@/lib/hooks/useProjects';

interface UtilitiesTabProps {
  onGenerateTestData: (options: TestDataOptions) => Promise<void>;
  onClearTestData: () => Promise<void>;
  onCleanupOrphanedData: () => Promise<void>;
  onValidateTimeEntries: () => Promise<{ invalid: number; fixed: number }>;
  onExportCollection: (collectionName: string) => Promise<void>;
  isGenerating: boolean;
  isClearing: boolean;
  isCleaning: boolean;
  isValidating: boolean;
  isExporting: boolean;
  exportedData?: string;
}

export function UtilitiesTab({
  onGenerateTestData,
  onClearTestData,
  onCleanupOrphanedData,
  onValidateTimeEntries,
  onExportCollection,
  isGenerating,
  isClearing,
  isCleaning,
  isValidating,
  isExporting,
  exportedData
}: UtilitiesTabProps) {
  const { users } = useUsers();
  const { projects } = useProjects();
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});

  // Calculate default date range (last 3 months)
  const today = new Date();
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(today.getMonth() - 3);
  
  const defaultStartDate = format(threeMonthsAgo, 'yyyy-MM-dd');
  const defaultEndDate = format(today, 'yyyy-MM-dd');

  const [weights, setWeights] = useState({
    pendingWeight: '10',
    approvedWeight: '80',
    rejectedWeight: '5',
    withdrawnWeight: '5'
  });
  const [collectionName, setCollectionName] = useState('');
  const [exportError, setExportError] = useState('');

  const handleExport = async () => {
    if (!collectionName.trim()) {
      setExportError('Please enter a collection name');
      return;
    }
    setExportError('');
    try {
      await onExportCollection(collectionName.trim());
    } catch (error) {
      setExportError(error.message);
    }
  };

  return (
    <Card className="divide-y divide-gray-200">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Export Collection Data</h3>
            <p className="mt-1 text-sm text-gray-500">
              Export a Firestore collection as JSON
            </p>
          </div>
          <div className="flex items-end gap-3">
            <FormField label="Collection Name" error={exportError}>
              <Input
                type="text"
                value={collectionName}
                onChange={(e) => {
                  setCollectionName(e.target.value);
                  setExportError('');
                }}
                placeholder="e.g., users"
                className="w-64"
              />
            </FormField>
            <Button
              onClick={handleExport}
              disabled={isExporting || !collectionName.trim()}
              className="mb-4"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              View Collection
            </Button>
          </div>
        </div>
        {exportedData && (
          <div className="mt-4">
            <textarea
              readOnly
              value={exportedData}
              className="w-full h-96 font-mono text-sm p-4 rounded-md border border-gray-200 bg-gray-50"
            />
          </div>
        )}
      </div>
    </Card>
  );
}