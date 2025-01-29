import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils/styles';
import { Input } from '@/components/ui/Input';

interface ForecastInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: () => void;
  isDefault?: boolean;
}

export function ForecastInput({ 
  value, 
  onChange,
  isEditing,
  onStartEdit,
  onEndEdit,
  isDefault = false
}: ForecastInputProps) {
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
      type="text"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="text-center"
    />
  ) : (
    <div
      onClick={onStartEdit}
      role="button"
      tabIndex={0}
      className={cn(
        "py-2 text-center cursor-pointer rounded hover:bg-gray-50",
        value === null && "text-gray-400",
        isDefault && "text-gray-400 italic"
      )}
      title={isDefault ? "Default value based on working days" : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onStartEdit();
        }
      }}
    >
      {value?.toFixed(2) || '-'}
    </div>
  );
}