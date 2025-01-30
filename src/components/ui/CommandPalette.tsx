import { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { Search, Calendar, ChevronRight } from 'lucide-react';
import { navigationItems } from '@/lib/constants/navigation';
import { useUsers } from '@/lib/hooks/useUsers';
import { useProjects } from '@/lib/hooks/useProjects';
import { useClients } from '@/lib/hooks/useClients';
import { cn } from '@/lib/utils/styles';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { currentUser } = useUsers();
  const { projects } = useProjects();
  const { clients } = useClients();

  // Filter items based on user role
  const allowedItems = navigationItems.filter(item =>
    item.roles.includes(currentUser?.role || 'user')
  );

  // Quick actions
  const quickActions = [
    { name: 'Add Time Entry', icon: navigationItems[0].icon, action: () => { navigate('/'); } },
    { name: 'View Monthly Report', icon: Calendar, action: () => { navigate('/reports'); } },
  ];

  // Filter items based on search query
  const filteredItems = query === ''
    ? []
    : [
        ...allowedItems.filter(item =>
          item.name.toLowerCase().includes(query.toLowerCase())
        ),
        ...projects.filter(project =>
          project.name.toLowerCase().includes(query.toLowerCase())
        ),
        ...clients.filter(client =>
          client.name.toLowerCase().includes(query.toLowerCase())
        ),
      ];

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault(); 
        open ? onClose() : onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500/75 transition-opacity backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto p-4 sm:p-6 md:p-20">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="mx-auto max-w-2xl transform divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 transition-all">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                  placeholder="Search..."
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              {query === '' && (
                <div className="p-2">
                  <div className="px-2 py-3 text-xs font-semibold text-gray-500">Quick Actions</div>
                  {quickActions.map((item) => (
                    <button
                      key={item.name}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        item.action();
                        onClose();
                      }}
                    >
                      <item.icon className="h-4 w-4 text-gray-400" />
                      {item.name}
                    </button>
                  ))}
                </div>
              )}

              {filteredItems.length > 0 && (
                <div className="flex-1 overflow-y-auto">
                  <div className="p-2">
                    {filteredItems.map((item: any) => (
                      <button
                        key={item.name}
                        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          if (item.href) {
                            navigate(item.href);
                          }
                          onClose();
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {item.icon && <item.icon className="h-4 w-4 text-gray-400" />}
                          <span>{item.name}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-2 flex justify-between text-xs text-gray-500">
                <div className="flex gap-3">
                  <span>
                    <kbd className="rounded bg-gray-100 px-2 py-1">↵</kbd> to select
                  </span>
                  <span>
                    <kbd className="rounded bg-gray-100 px-2 py-1">↑</kbd>
                    <kbd className="rounded bg-gray-100 px-2 py-1 ml-1">↓</kbd> to navigate
                  </span>
                </div>
                <div>
                  <kbd className="rounded bg-gray-100 px-2 py-1">esc</kbd> to close
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}