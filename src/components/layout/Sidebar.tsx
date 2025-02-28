import { Link, useLocation } from 'react-router-dom'; 
import { navigationItems } from '@/lib/constants/navigation';
import { useUsers } from '@/lib/hooks/useUsers';
import { useMemo, useCallback } from 'react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils/styles';
import { ChevronRight } from 'lucide-react';

interface SidebarProps {
  isExpanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

export function Sidebar({ isExpanded, onExpandedChange }: SidebarProps) {
  const location = useLocation();
  const { currentUser, isTeamManager } = useUsers();

  // Filter navigation items based on user role
  const allowedItems = useMemo(() => 
    navigationItems.filter(item => 
      item.roles.includes(currentUser?.role || 'user') &&
      (!isTeamManager || item.allowTeamManager) &&
      (!item.teamManagerOnly || isTeamManager)
    ),
    [currentUser?.role, isTeamManager]
  );

  return (
    <TooltipProvider>
    <div className={cn(
      "hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:flex-col overflow-hidden",
      "transition-all duration-300 bg-white shadow-xl relative",
      isExpanded ? "lg:w-72" : "lg:w-16"
    )}>
      <div className={cn(
        "flex grow flex-col gap-y-5 overflow-y-auto overflow-x-hidden pb-4 pt-20 relative h-full",
        "transition-all duration-300",
        isExpanded ? "px-6" : "px-2"
      )}>

        {/* Color bursts */}
        <div className="absolute bottom-0 left-0 right-0 h-96 overflow-hidden pointer-events-none">
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#70529c]/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/4" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#70529c]/15 rounded-full blur-3xl transform translate-x-1/3 translate-y-1/3" />
          <div className="absolute bottom-12 left-1/2 w-40 h-40 bg-[#70529c]/25 rounded-full blur-3xl transform -translate-x-1/2" />
        </div>

        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {allowedItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;

                  return (
                    <Tooltip key={item.name} delayDuration={0}>
                      <li>
                      <Link
                        to={item.href}
                        className={cn(
                          'group flex items-center rounded-lg p-2 text-sm leading-6 transition-all duration-300',
                          isExpanded ? 'gap-x-3 pl-4' : 'justify-center',
                          'hover:bg-gray-50',
                          isActive
                            ? 'bg-gray-50 text-indigo-600 font-medium'
                            : 'text-gray-700 hover:text-gray-900 font-medium'
                        )}
                      >
                        <TooltipTrigger asChild>
                        <Icon
                          className={cn(
                            'h-6 w-6 shrink-0 transition-transform',
                            'transition-all duration-300 group-hover:scale-110 group-hover:rotate-3',
                            isActive
                              ? 'text-indigo-600'
                              : 'text-gray-500 group-hover:text-gray-900'
                          )}
                        />
                        </TooltipTrigger>
                        {isExpanded && (
                          <span className="font-medium tracking-wide">{item.name}</span>
                        )}
                        {!isExpanded && (
                          <TooltipContent side="right" sideOffset={10}>
                            {item.name}
                          </TooltipContent>
                        )}
                      </Link>
                      </li>
                    </Tooltip>
                  );
                })}
              </ul>
            </li>
            {isExpanded && (
              <li className="mt-auto">
                <div className="rounded-lg bg-gray-50 p-4 shadow-sm border border-gray-100 relative z-10">
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
            )}
            <li className={cn(
              "mt-2 px-2",
              !isExpanded && "mt-auto"
            )}>
              <button
                onClick={() => onExpandedChange(!isExpanded)}
                className={cn(
                  "w-full p-2 flex items-center justify-center rounded-lg",
                  "text-gray-500 hover:text-gray-900 hover:bg-gray-50",
                  "transition-all duration-200"
                )}
                title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
              >
                <ChevronRight 
                  className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    isExpanded && "rotate-180"
                  )} 
                />
              </button>
            </li>
          </ul>
        </nav>
        <button
          onClick={() => onExpandedChange(!isExpanded)}
          className={cn(
            "absolute top-4 -right-3 p-1.5 rounded-full bg-white shadow-md border border-gray-200",
            "hover:bg-gray-50 transition-transform duration-300",
            isExpanded ? "rotate-180" : "rotate-0"
          )}
        >
          <ChevronRight className="h-4 w-4 text-gray-600" />
        </button>
      </div>
    </div>
    </TooltipProvider>
  );
}