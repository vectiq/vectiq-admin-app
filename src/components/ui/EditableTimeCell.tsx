import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils/styles';
import { Input } from '@/components/ui/Input';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/Tooltip';
import { Lock, RefreshCw } from 'lucide-react';

interface EditableTimeCellProps {
  value: number | null;
  onChange: (value: number | null) => void;
  onClear?: () => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: () => void;
  isDisabled?: boolean;
  isModified?: boolean;
  className?: string;
  isLocked?: boolean;
}

export function EditableTimeCell({ 
  value, 
  onChange,
  onClear,
  isEditing,
  onStartEdit,
  onEndEdit,
  isDisabled = false,
  isModified = false,
  className = '',
  isLocked
}: EditableTimeCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState('');

  useEffect(() => {
    if (isEditing) {
      setLocalValue(typeof value === 'number' ? value.toString() : '');
      // Use a small timeout to ensure the input is mounted and ready
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 10);
    }
  }, [isEditing, value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue === '' || /^\d*\.?\d*$/.test(newValue)) {
      setLocalValue(newValue);
    }
  };

  const handleBlur = () => {
    const numValue = localValue === '' ? null : parseFloat(localValue);
    if (numValue !== value) {
      onChange(numValue);
    }
    onEndEdit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const numValue = localValue === '' ? null : parseFloat(localValue);
      if (numValue !== value) {
        onChange(numValue);
      }
      onEndEdit();
    } else if (e.key === 'Escape') {
      setLocalValue(typeof value === 'number' ? value.toString() : '');
      onEndEdit();
    }
  };

  return isEditing ? (
    <Input
      ref={inputRef}
      aria-label="Forecast value"
      type="text"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="text-center w-24 mx-auto"
    />
  ) : (
    <div className="relative">
      <div
        onClick={(isDisabled || isLocked || isModified) ? undefined : onStartEdit}
        role="button"
        tabIndex={0}
        aria-label={`${typeof value === 'number' ? value.toFixed(2) : '-'} hours`}
        className={cn(
          "py-2 text-center rounded",
          !isModified && !isDisabled && !isLocked && "cursor-pointer hover:bg-gray-50",
          value === null && "text-gray-400",
          (isDisabled || isLocked) && "cursor-not-allowed opacity-50 hover:bg-transparent",
          isLocked && "bg-gray-50",
          isModified && "bg-yellow-50 font-medium text-yellow-700",
          className
        )}
        title={isLocked ? `Time entries are locked` : undefined}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!isDisabled && !isLocked && !isModified) {
              onStartEdit();
            }
          }
        }}
      >
        {typeof value === 'number' ? value.toFixed(2) : '-'}
        {isModified && onClear && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                  }}
                  className="absolute -top-1 -right-1 p-0.5 rounded-full bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                Reset to default value
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {isLocked && (
        <Lock className="h-3 w-3 text-gray-400 absolute -top-1 -right-1" />
      )}
    </div>
  );
}