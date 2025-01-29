import { ReactNode } from 'react';

interface TableProps {
  children: ReactNode;
}

export function Table({ children }: TableProps) {
  return (
    <div className="overflow-x-auto relative">
      <div className="absolute inset-0 pointer-events-none rounded-lg bg-gradient-to-r from-white via-transparent to-white opacity-0 transition-opacity duration-300 hover:opacity-100"></div>
      <table className="min-w-full divide-y divide-gray-300 relative">
        {children}
      </table>
    </div>
  );
}