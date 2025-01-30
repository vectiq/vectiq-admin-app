import * as React from 'react';
import { cn } from '@/lib/utils/styles';
import { Check } from 'lucide-react';

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, onCheckedChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) onChange(e);
      if (onCheckedChange) onCheckedChange(e.target.checked);
    };

    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            className="peer sr-only"
            ref={ref}
            onChange={handleChange}
            {...props}
          />
          <div className={cn(
            "h-4 w-4 rounded border border-gray-300",
            "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500",
            "peer-checked:bg-indigo-600 peer-checked:border-indigo-600",
            "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
            className
          )}>
            <Check className="h-3 w-3 text-white hidden peer-checked:block absolute top-0.5 left-0.5" />
          </div>
        </div>
        {label && <span className="text-sm text-gray-600">{label}</span>}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };