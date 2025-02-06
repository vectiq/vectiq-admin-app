import { Edit, Trash2 } from 'lucide-react';
import { Table, TableHeader, TableBody, Th, Td } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/AlertDialog';
import type { Client } from '@/types';
import { useState } from 'react';

interface ClientsTableProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
}

export function ClientsTable({ clients, onEdit, onDelete }: ClientsTableProps) {
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; clientId: string | null }>({
    isOpen: false,
    clientId: null
  });

  const handleDelete = (id: string) => {
    setDeleteConfirmation({ isOpen: true, clientId: id });
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmation.clientId) {
      await onDelete(deleteConfirmation.clientId);
      setDeleteConfirmation({ isOpen: false, clientId: null });
    }
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <tr className="border-b border-gray-200">
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Name</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Contact Email</th>
            <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Actions</th>
          </tr>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <tr key={client.id}>
              <Td className="font-medium text-gray-900">{client.name}</Td>
              <Td>{client.email}</Td>
              <Td className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => onEdit(client)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleDelete(client.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </Td>
            </tr>
          ))}
        </TableBody>
      </Table>

      <AlertDialog 
        open={deleteConfirmation.isOpen} 
        onOpenChange={(open) => setDeleteConfirmation(prev => ({ ...prev, isOpen: open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this client? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}