import { Sheet, SheetContent, SheetTitle } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';

interface SlidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  stats?: Array<{
    value: string | number;
    label: string;
    color?: string;
  }>;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

export function SlidePanel({
  open,
  onClose,
  title,
  subtitle,
  icon,
  stats,
  headerAction,
  children,
}: SlidePanelProps) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent 
        className="w-[600px] sm:max-w-[600px] p-0 overflow-hidden bg-gray-50/80 backdrop-blur-sm"
        title={title}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 bg-white border-b">
            <div className="flex items-center gap-4">
              {icon && (
                <div className="p-2.5 bg-gray-50 rounded-xl shadow-sm ring-1 ring-gray-100">
                  {icon}
                </div>
              )}
              <div>
                <SheetTitle className="text-xl font-semibold text-gray-900 tracking-tight">
                  {title}
                </SheetTitle>
                {subtitle && (
                  <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
                )}
              </div>
            </div>
            {headerAction && (
              <div className="ml-4">
                {headerAction}
              </div>
            )}
          </div>

          {/* Stats Grid */}
          {stats && stats.length > 0 && (
            <div className="grid grid-cols-3 gap-6 py-6 px-6 bg-white border-b">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className="text-center p-4 rounded-xl bg-gray-50 shadow-sm ring-1 ring-gray-100"
                >
                  <div 
                    className={`text-2xl font-semibold ${stat.color || 'text-gray-900'}`}
                  >
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm font-medium text-gray-600">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-white">
            {children}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}