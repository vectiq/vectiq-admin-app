import { Edit, Trash2 } from 'lucide-react';
import { Table, TableHeader, TableBody, Th, Td } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { useUsers } from '@/lib/hooks/useUsers';
import type { Team } from '@/types';

interface TeamsTableProps {
  teams: Team[];
  onEdit: (team: Team) => void;
  onDelete: (id: string) => void;
}

export function TeamsTable({ teams, onEdit, onDelete }: TeamsTableProps) {
  const { users } = useUsers();

  return (
    <Table>
      <TableHeader>
        <tr>
          <Th>Team Name</Th>
          <Th>Manager</Th>
          <Th className="text-right">Actions</Th>
        </tr>
      </TableHeader>
      <TableBody>
        {teams.map((team) => {
          const manager = users.find(u => u.id === team.managerId);
          
          return (
            <tr key={team.id}>
              <Td className="font-medium text-gray-900">{team.name}</Td>
              <Td>{manager?.name || 'No manager assigned'}</Td>
              <Td className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => onEdit(team)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => onDelete(team.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </Td>
            </tr>
          );
        })}
      </TableBody>
    </Table>
  );
}