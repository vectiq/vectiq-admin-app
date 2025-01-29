import { useState } from 'react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

interface ConfirmDialogState extends ConfirmOptions {
  isOpen: boolean;
  resolve: (value: boolean) => void;
}

export function useConfirm() {
  const [dialog, setDialog] = useState<ConfirmDialogState | null>(null);

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({
        ...options,
        isOpen: true,
        resolve,
      });
    });
  };

  const handleClose = (confirmed: boolean) => {
    if (dialog) {
      dialog.resolve(confirmed);
      setDialog(null);
    }
  };

  return {
    confirm,
    dialog,
    handleClose,
  };
}