import { Edit, Trash2, ListTodo } from 'lucide-react';
import { Table, TableHeader, TableBody, Th, Td } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import type { Project } from '@/types';

interface ProjectsTableProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onManageAssignments: (project: Project) => void;
}

export function ProjectsTable({ 
  projects, 
  onEdit, 
  onDelete,
  onManageAssignments
}: ProjectsTableProps) {
  return (
    <Table>
      <TableHeader>
        <tr className="border-b border-gray-200">
          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Name</th>
          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Budget</th>
          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Start Date</th>
          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">End Date</th>
          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Approver Email</th>
          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Approval Required</th>
          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tasks</th>
          <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Actions</th>
        </tr>
      </TableHeader>
      <TableBody>
        {projects?.map((project) => (
          <tr key={project.id}>
            <Td className="font-medium text-gray-900">{project.name}</Td>
            <Td>{formatCurrency(project.budget)}</Td>
            <Td>{formatDate(project.startDate)}</Td>
            <Td>{formatDate(project.endDate)}</Td>
            <Td>{project.approverEmail}</Td>
            <Td>
              <Badge variant={project.requiresApproval ? 'warning' : 'success'}>
                {project.requiresApproval ? 'Yes' : 'No'}
              </Badge>
            </Td>
            <Td>
              <Badge variant={project.isActive ? 'success' : 'secondary'}>
                {project.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </Td>
            <Td>
              <div className="space-y-1">
                {project.tasks?.map(task => (
                  <div key={task.id} className="text-sm">
                    {task.name}
                  </div>
                ))}
              </div>
            </Td>
            <Td className="text-right">
              <div className="flex justify-end gap-2">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => onManageAssignments(project)}
                  title="Manage tasks and assignments"
                >
                  <ListTodo className="h-4 w-4" />
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => onEdit(project)}
                  title="Edit project details"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => onDelete(project.id)}
                  title="Delete project"
                >
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