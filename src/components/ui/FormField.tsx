import { ReactNode } from 'react';
import { Label } from '@/components/ui/Label';
import { cn } from '@/lib/utils/styles';

interface FormFieldProps {
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
}

export function FormField({ label, error, children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-2 form-field", className)}>
      <Label>{label}</Label>
      {children}
      {error && (
        <p className="text-sm text-red-600 animate-slide-up">{error}</p>
      )}
    </div>
  );
}