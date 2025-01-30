import { useState, useCallback } from 'react';
import { useClients } from '@/lib/hooks/useClients';
import { ClientsTable } from '@/components/clients/ClientsTable';
import { ClientDialog } from '@/components/clients/ClientDialog';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { useConfirm } from '@/lib/hooks/useConfirm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Client } from '@/types';

export default function Clients() {
  const { 
    clients, 
    isLoading, 
    createClient, 
    updateClient, 
    deleteClient,
    isCreating,
    isUpdating,
    isDeleting 
  } = useClients();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { confirm, dialog, handleClose } = useConfirm();

  const handleOpenCreateDialog = useCallback(() => {
    setSelectedClient(null);
    setIsDialogOpen(true);
  }, []);

  const handleSubmit = useCallback(async (data: Omit<Client, 'id'>) => {
    if (selectedClient) {
      await updateClient(selectedClient.id, data);
    } else {
      await createClient(data);
    }
    setIsDialogOpen(false);
  }, [selectedClient, updateClient, createClient]);

  const handleEdit = useCallback((client: Client) => {
    setSelectedClient(client);
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Client',
      message: 'Are you sure you want to delete this client? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      await deleteClient(id);
    }
  }, [confirm, deleteClient]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  const isProcessing = isCreating || isUpdating || isDeleting;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
        <Button onClick={handleOpenCreateDialog} disabled={isProcessing}>
          <Plus className="h-4 w-4 mr-2" />
          New Client
        </Button>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg">
        <ClientsTable 
          clients={clients} 
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <ClientDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        client={selectedClient}
        onSubmit={handleSubmit}
      />
      
      {dialog && (
        <ConfirmDialog
          open={dialog.isOpen}
          title={dialog.title}
          message={dialog.message}
          confirmText={dialog.confirmText}
          cancelText={dialog.cancelText}
          onConfirm={() => handleClose(true)}
          onCancel={() => handleClose(false)}
        />
      )}
    </div>
  );
}