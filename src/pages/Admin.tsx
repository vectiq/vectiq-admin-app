import { useState } from 'react';
import { useAdmin } from '@/lib/hooks/useAdmin';
import { ConfigurationTab } from '@/components/admin/ConfigurationTab';
import { UtilitiesTab } from '@/components/admin/UtilitiesTab';
import { CalculationsTab } from '@/components/admin/CalculationsTab';
import { TestDataTab } from '@/components/admin/TestDataTab';
import { IntegrationsTab } from '@/components/admin/IntegrationsTab';
import { PublicHolidaysTab } from '@/components/admin/PublicHolidaysTab';
import { Card } from '@/components/ui/Card';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Settings, Wrench, Calculator, Link2, Calendar, Database } from 'lucide-react';

const tabs = [
  { id: 'configuration', name: 'Configuration', icon: Settings },
  { id: 'integrations', name: 'Integrations', icon: Link2 },
  { id: 'utilities', name: 'Utilities', icon: Wrench },
  { id: 'test-data', name: 'Test Data', icon: Database },
  { id: 'calculations', name: 'Calculations', icon: Calculator },
  { id: 'holidays', name: 'Public Holidays', icon: Calendar }
] as const;

export default function Admin() {
  const {
    config,
    stats,
    holidays,
    xeroConfig,
    isLoading,
    updateConfig,
    updateXeroConfig,
    addHoliday,
    deleteHoliday,
    generateTestData,
    clearTestData,
    recalculateProjectTotals,
    cleanupOrphanedData,
    validateTimeEntries,
    exportCollection,
    exportedData,
    isUpdating,
    isUpdatingXero,
    isAddingHoliday,
    isDeletingHoliday,
    isGenerating,
    isClearing,
    isRecalculating,
    isCleaning,
    isValidating,
    isExporting
  } = useAdmin();
  const [activeTab, setActiveTab] = useState<typeof tabs[number]['id']>('configuration');

  if (isLoading || !config) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Admin</h1>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
            <p className="mt-2 text-3xl font-semibold">{stats.totalUsers}</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Projects</h3>
            <p className="mt-2 text-3xl font-semibold">{stats.totalProjects}</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Hours This Month</h3>
            <p className="mt-2 text-3xl font-semibold">{stats.totalHoursThisMonth.toFixed(1)}</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Billable Hours</h3>
            <p className="mt-2 text-3xl font-semibold">{stats.totalBillableHours.toFixed(1)}</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Utilization</h3>
            <p className="mt-2 text-3xl font-semibold">{stats.averageUtilization}%</p>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-5 w-5 inline-block mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'configuration' && (
          <ConfigurationTab
            config={config}
            isUpdating={isUpdating}
            onUpdateConfig={updateConfig}
          />
        )}

        {activeTab === 'integrations' && (
          <IntegrationsTab
            xeroConfig={xeroConfig}
            isUpdatingXero={isUpdatingXero}
            onUpdateXeroConfig={updateXeroConfig}
          />
        )}

        {activeTab === 'utilities' && (
          <UtilitiesTab
            onGenerateTestData={generateTestData}
            onClearTestData={clearTestData}
            onCleanupOrphanedData={cleanupOrphanedData}
            onValidateTimeEntries={validateTimeEntries}
            onExportCollection={exportCollection}
            exportedData={exportedData}
            isGenerating={isGenerating}
            isClearing={isClearing}
            isCleaning={isCleaning}
            isValidating={isValidating}
            isExporting={isExporting}
          />
        )}

        {activeTab === 'test-data' && (
          <TestDataTab
            onGenerateTestData={generateTestData}
            onClearTestData={clearTestData}
            isGenerating={isGenerating}
            isClearing={isClearing}
          />
        )}

        {activeTab === 'calculations' && (
          <CalculationsTab
            config={config}
            isUpdating={isUpdating}
            onRecalculateProjectTotals={recalculateProjectTotals}
            isRecalculating={isRecalculating}
            onUpdateConfig={updateConfig}
          />
        )}

        {activeTab === 'holidays' && (
          <PublicHolidaysTab
            holidays={holidays}
            isLoading={isLoading}
            onAddHoliday={addHoliday}
            onDeleteHoliday={deleteHoliday}
          />
        )}
      </div>
    </div>
  );
}