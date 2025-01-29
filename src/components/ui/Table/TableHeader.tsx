import { ReactNode } from 'react';

interface TableHeaderProps {
  children: ReactNode;
}

export function TableHeader({ children }: TableHeaderProps) {
  return <thead className="bg-gray-50">{children}</thead>;
}

export function Th({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <th 
      scope="col" 
      className={`px-3 py-3.5 text-left text-sm font-semibold text-gray-900 ${className}`}
    >
      {children}
    </th>
  );
}