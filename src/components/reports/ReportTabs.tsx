import { cn } from '@/lib/utils/styles';

interface ReportTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ReportTabs({ activeTab, onTabChange }: ReportTabsProps) {
  const tabs = [
    { id: 'time', name: 'Time Report' }
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium',
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            )}
          >
            {tab.name}
          </button>
        ))}
      </nav>
    </div>
  );
}