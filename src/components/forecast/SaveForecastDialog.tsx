import { useState } from 'react';
import { SlidePanel } from '@/components/ui/SlidePanel';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Save } from 'lucide-react';

interface SaveForecastDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => Promise<void>;
  isLoading?: boolean;
}

export function SaveForecastDialog({
  open,
  onOpenChange,
  onSave,
  isLoading
}: SaveForecastDialogProps) {
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    await onSave(name.trim());
    setName('');
    onOpenChange(false);
  };

  return (
    <SlidePanel
      open={open}
      onClose={() => onOpenChange(false)}
      title="Save Forecast"
      icon={<Save className="h-5 w-5 text-indigo-500" />}
    >
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Forecast Name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Q1 2024 Base Forecast"
              autoFocus
            />
          </FormField>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !name.trim()}
            >
              Save Forecast
            </Button>
          </div>
        </form>
      </div>
    </SlidePanel>
  );
}