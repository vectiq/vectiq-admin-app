import { SlidePanel } from '@/components/ui/SlidePanel';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <SlidePanel
      open={open}
      onClose={onCancel}
      title={title}
      icon={<AlertTriangle className="h-5 w-5 text-yellow-500" />}
    >
      <div className="p-6">
        <p className="text-sm text-gray-500">{message}</p>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </SlidePanel>
  );
}