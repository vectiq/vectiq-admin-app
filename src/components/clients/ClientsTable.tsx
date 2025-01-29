import { Edit, Trash2 } from 'lucide-react';
import { Table, TableHeader, TableBody, Th, Td } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import type { Client } from '@/types';

interface ClientsTableProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
}

export function ClientsTable({ clients, onEdit, onDelete }: ClientsTableProps) {
  return (
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
                <Button variant="secondary" size="sm" onClick={() => onDelete(client.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </Td>
          </tr>
        ))}
      </TableBody>
    </Table>
  );
}