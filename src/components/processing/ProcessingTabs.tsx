import { cn } from '@/lib/utils/styles';
import { FileText, DollarSign, Clock, Users } from 'lucide-react';

interface ProcessingTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ProcessingTabs({ activeTab, onTabChange }: ProcessingTabsProps) {
  const tabs = [
    { id: 'invoicing', name: 'Invoicing', icon: FileText },
    { id: 'payroll', name: 'Payroll', icon: DollarSign },
    { id: 'contractor-payroll', name: 'Contractor Payroll', icon: Users },
    { id: 'overtime', name: 'Overtime', icon: Clock }
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && onTabChange(tab.id)}
              disabled={tab.disabled}
              className={cn(
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2',
                'focus:outline-none transition-colors duration-200',
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <Icon className="h-5 w-5" />
              {tab.name}
            </button>
          );
        })}
      </nav>
    </div>
  );
}