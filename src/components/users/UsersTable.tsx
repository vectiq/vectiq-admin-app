import { Edit, Trash2, Calculator } from 'lucide-react';
import { Table, TableHeader, TableBody, Th, Td } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useProjects } from '@/lib/hooks/useProjects';
import type { User } from '@/types';
import { useMemo } from 'react';

interface UsersTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onManageRates: (user: User) => void;
  onDelete: (id: string) => void;
}

export function UsersTable({ 
  users, 
  onEdit, 
  onManageRates,
  onDelete,
}: UsersTableProps) {
  const { projects, isLoading: isLoadingProjects } = useProjects();

  // Get all assignments for a user across all projects
  const getUserAssignments = useMemo(() => (userId: string) => {
    if (isLoadingProjects || !projects) return [];
    
    return projects.flatMap(project => 
      project.tasks.flatMap(task => 
        task.userAssignments
          ?.filter(assignment => assignment.userId === userId)
          .map(assignment => ({
            projectName: project.name,
            taskName: task.name
          })) || []
      )
    );
  }, [projects, isLoadingProjects]);
  return (
    <Table>
      <TableHeader>
        <tr>
          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Name</th>
          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Hours/Week</th>
          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Target Billable %</th>
          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Overtime</th>
          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Role</th>
          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Project Assignments</th>
          <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Actions</th>
        </tr>
      </TableHeader>
      <TableBody>
        {users.map((user) => {
          const assignments = getUserAssignments(user.id);

          return (
            <tr key={user.id}>
              <Td className="font-medium text-gray-900">{user.name}</Td>
              <Td>{user.email}</Td>
              <Td>{user.hoursPerWeek}</Td>
              <Td>
                {user.estimatedBillablePercentage ? (
                  <Badge variant="secondary">
                    {user.estimatedBillablePercentage}%
                  </Badge>
                ) : (
                  <span className="text-gray-500">-</span>
                )}
              </Td>
              <Td>
                <Badge variant="secondary">
                  {user.overtime === 'no' ? 'No Overtime' : 
                   user.overtime === 'billable' ? 'Billable Only' : 
                   'All Hours'}
                </Badge>
              </Td>
              <Td>
                <Badge variant={user.role === 'admin' ? 'warning' : 'secondary'}>
                  {user.role}
                </Badge>
              </Td>
              <Td>
                <div className="space-y-2">
                  {assignments.map((assignment, index) => {
                    return (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">{assignment.projectName}</span>
                        <span className="text-gray-400">-</span>
                        <span className="text-gray-500">{assignment.taskName}</span>
                      </div>
                    );
                  })}
                  {assignments.length === 0 && (
                    <div className="text-sm text-gray-500">
                      No project assignments
                    </div>
                  )}
                </div>
              </Td>
              <Td className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => onManageRates(user)}>
                    <Calculator className="h-4 w-4" />
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => onEdit(user)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => onDelete(user.id)}>
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