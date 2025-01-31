import { useState, useEffect } from 'react';
import { MobileNav } from './MobileNav'; 
import { CommandPalette } from '@/components/ui/CommandPalette';
import { UserMenu } from './UserMenu';
import { Command } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Navbar() {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <nav className="fixed top-0 z-40 w-full bg-white border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              className="hidden md:block h-10 w-auto"
              src="/logo.svg"
              alt="Company Logo"
            />
            <MobileNav />
          </div>
          
          <div className="flex items-center gap-x-4">
            <Button
              variant="secondary"
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden md:flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <Command className="h-4 w-4" />
              <span>Quick Actions</span>
              <kbd className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded">⌘K</kbd>
            </Button>
            <UserMenu />
          </div>
        </div>
      </div>
      </nav>
      
      <CommandPalette 
        open={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </>
  );
}