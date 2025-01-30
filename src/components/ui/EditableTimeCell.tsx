import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils/styles';
import { Input } from '@/components/ui/Input';
import { Lock } from 'lucide-react';

interface EditableTimeCellProps {
  value: number | null;
  onChange: (value: number | null) => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: () => void;
  isDisabled?: boolean;
  isLocked?: boolean;
}

export function EditableTimeCell({ 
  value, 
  onChange,
  isEditing,
  onStartEdit,
  onEndEdit,
  isDisabled = false,
  isLocked
}: EditableTimeCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState('');

  useEffect(() => {
    if (isEditing) {
      setLocalValue(value?.toString() || '');
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      });
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
      setLocalValue(value?.toString() || '');
      onEndEdit();
    }
  };

  return isEditing ? (
    <Input
      ref={inputRef}
      aria-label="Time entry hours"
      type="text"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="text-center"
    />
  ) : (
    <div className="relative">
      <div
        onClick={(isDisabled || isLocked) ? undefined : onStartEdit}
        role="button"
        tabIndex={0}
        aria-label={`${value?.toFixed(2) || '-'} hours`}
        className={cn(
          "py-2 text-center cursor-pointer rounded hover:bg-gray-50",
          value === null && "text-gray-400",
          (isDisabled || isLocked) && "cursor-not-allowed opacity-50 hover:bg-transparent",
          isLocked && "bg-gray-50"
        )}
        title={isLocked ? `Time entries are locked` : undefined}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!isDisabled && !isLocked) {
              onStartEdit();
            }
          }
        }}
      >
        {value?.toFixed(2) || '-'}
      </div>
      {isLocked && (
        <Lock className="h-3 w-3 text-gray-400 absolute -top-1 -right-1" />
      )}
    </div>
  );
}