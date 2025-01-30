import { ReactNode } from 'react';

interface TableBodyProps {
  children: ReactNode;
}

export function TableBody({ children }: TableBodyProps) {
  return (
    <tbody className="divide-y divide-gray-200 bg-white">
      {children}
    </tbody>
  );
}

export function Td({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <td className={`whitespace-nowrap px-3 py-4 text-sm text-gray-500 transition-all duration-200 group-hover:bg-gray-50/80 ${className}`}>
      {children}
    </td>
  );
}