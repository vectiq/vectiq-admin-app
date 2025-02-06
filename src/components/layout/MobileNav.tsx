import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/Sheet';
import { Menu } from 'lucide-react';
import { navigationItems } from '@/lib/constants/navigation';
import { Link, useLocation } from 'react-router-dom';
import { useUsers } from '@/lib/hooks/useUsers';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

export function MobileNav() {
  const location = useLocation();
  const { currentUser, isTeamManager } = useUsers();

  const handleLinkClick = () => {
    const sheetTrigger = document.querySelector('[data-state="open"]');
    if (sheetTrigger) {
      (sheetTrigger as HTMLButtonElement).click();
    }
  };

  // Filter navigation items based on user role
  const allowedItems = useMemo(() => 
    navigationItems.filter(item => 
      item.roles.includes(currentUser?.role || 'user') && 
      (!isTeamManager || item.allowTeamManager)
    ),
    [currentUser?.role, isTeamManager]
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="lg:hidden -m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <div className="flex h-16 shrink-0 items-center -m-6 px-6 mb-0">
          <div className="flex items-center gap-3">
            <img
              className="h-6 w-auto"
              src="/logo.svg"
              alt="Company Logo"
            />
          </div>
        </div>
        <nav className="flex flex-1 flex-col -mx-6 px-6 h-full relative">
          <ul role="list" className="flex flex-1 flex-col gap-y-1">
            {allowedItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={cn(
                      'group relative flex gap-x-3 rounded-lg py-1.5 px-3 text-sm leading-6 transition-none',
                      isActive
                        ? 'bg-gray-50 text-indigo-600 font-medium'
                        : 'text-gray-700 font-medium'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-6 w-6 shrink-0',
                        'transition-all duration-300 group-hover:scale-110 group-hover:rotate-3',
                        isActive
                          ? 'text-indigo-600'
                          : 'text-gray-500'
                      )}
                    />
                    <span className="font-medium tracking-wide">{item.name}</span>
                    
                  </Link>
                </li>
              );
            })}
            <li className="mt-auto pt-4">
              <div className="rounded-lg bg-gray-50 p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-600 text-sm font-medium">
                      {currentUser?.name?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate tracking-wide">
                      {currentUser?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {currentUser?.email || ''}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}