import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils/styles';
import { useState } from 'react';

export function Layout() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 relative overflow-hidden">
      {/* Triangular Geometric Pattern with Opacity Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-[80vh] pointer-events-none overflow-hidden">
        {/* Large base triangles - darkest at bottom */}
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#70529c]/15 transform-gpu"
          style={{ clipPath: 'polygon(0 100%, 100% 100%, 0 0)' }} />
        <div className="absolute bottom-0 right-0 w-[800px] h-[500px] bg-[#529c70]/10 transform-gpu"
          style={{ clipPath: 'polygon(100% 100%, 0 100%, 100% 0)' }} />

        {/* Medium triangles - medium opacity */}
        <div className="absolute bottom-[20%] left-[30%] w-[400px] h-[400px] bg-[#70529c]/8 transform-gpu rotate-45"
          style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }} />
        <div className="absolute bottom-[40%] right-[20%] w-[300px] h-[300px] bg-[#529c70]/8 transform-gpu -rotate-12"
          style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }} />

        {/* Small accent triangles - lighter opacity */}
        <div className="absolute bottom-[60%] left-[15%] w-[200px] h-[200px] bg-[#2A2A2A]/5 transform-gpu rotate-[30deg]"
          style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }} />
        <div className="absolute bottom-[45%] right-[40%] w-[150px] h-[150px] bg-[#70529c]/5 transform-gpu -rotate-[15deg]"
          style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }} />

        {/* Tiny detail triangles - lightest opacity */}
        <div className="absolute bottom-[30%] left-[45%] w-[100px] h-[100px] bg-[#529c70]/5 transform-gpu rotate-[60deg]"
          style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }} />
        <div className="absolute bottom-[55%] right-[25%] w-[80px] h-[80px] bg-[#2A2A2A]/5 transform-gpu rotate-[120deg]"
          style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }} />
        <div className="absolute bottom-[25%] left-[60%] w-[120px] h-[120px] bg-[#70529c]/5 transform-gpu -rotate-[45deg]"
          style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }} />
      </div>

      <Navbar />
      <Sidebar isExpanded={isSidebarExpanded} onExpandedChange={setIsSidebarExpanded} />
      <main className={cn(
        "lg:pl-16 pt-16 transition-all duration-300",
        isSidebarExpanded && "lg:pl-72"
      )}>
        <div className={cn(
          "px-4 py-8 sm:px-6 lg:px-8",
          "relative z-10"
        )}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}