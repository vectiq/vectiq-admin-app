import { Edit, Trash2, ListTodo } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/lib/utils/styles';
import { isAfter } from 'date-fns';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column'; 
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
import type { Project } from '@/types';
import { useState } from 'react';
import { formatDate } from '@/lib/utils/date';

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
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; projectId: string | null }>({
    isOpen: false,
    projectId: null
  });

  const handleDelete = (id: string) => {
    setDeleteConfirmation({ isOpen: true, projectId: id });
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmation.projectId) {
      await onDelete(deleteConfirmation.projectId);
      setDeleteConfirmation({ isOpen: false, projectId: null });
    }
  };

  const nameBodyTemplate = (project: Project) => (
    <div className="font-medium text-gray-900">
      {project.name}
    </div>
  );

  const budgetBodyTemplate = (project: Project) => (
    <div>{formatCurrency(project.budget)}</div>
  );

  const dateBodyTemplate = (project: Project, field: 'startDate' | 'endDate') => (
    <div className={cn(
      field === 'endDate' && project.hasProjectElapsed && 
      "text-red-600 font-medium"
    )}>
      {formatDate(project[field])}
    </div>
  );

  const approvalBodyTemplate = (project: Project) => (
    <Badge variant={project.requiresApproval ? 'warning' : 'success'}>
      {project.requiresApproval ? 'Yes' : 'No'}
    </Badge>
  );

  const statusBodyTemplate = (project: Project) => (
    <Badge variant={project.isActive ? 'success' : 'secondary'}>
      {project.isActive ? 'Active' : 'Inactive'}
    </Badge>
  );

  const tasksBodyTemplate = (project: Project) => (
    <div className="space-y-1">
      {project.tasks?.map(task => (
        <div key={task.id} className="text-sm">
          {task.name}
        </div>
      ))}
    </div>
  );

  const actionsBodyTemplate = (project: Project) => (
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
        onClick={() => handleDelete(project.id)}
        title="Delete project"
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );

  return (
    <div>
    <DataTable
      value={projects}
      paginator
      rows={20}
      rowsPerPageOptions={[20, 50, 100]}
      sortMode="multiple"
      removableSort
      showGridlines
      stripedRows
      className="p-datatable-sm [&_.p-datatable-tbody>tr>td]:transition-none"
      emptyMessage="No projects found"
    >
      <Column 
        field="name" 
        header="Name" 
        body={nameBodyTemplate} 
        sortable 
      />
      <Column 
        field="budget" 
        header="Budget" 
        body={budgetBodyTemplate} 
        sortable 
      />
      <Column 
        field="startDate" 
        header="Start Date" 
        body={(rowData) => dateBodyTemplate(rowData, 'startDate')} 
        sortable 
      />
      <Column 
        field="endDate" 
        header="End Date" 
        body={(rowData) => dateBodyTemplate(rowData, 'endDate')} 
        sortable 
      />
      <Column 
        field="approverEmail" 
        header="Approver Email" 
        sortable 
      />
      <Column 
        field="requiresApproval" 
        header="Approval Required" 
        body={approvalBodyTemplate} 
        sortable 
      />
      <Column 
        field="isActive" 
        header="Status" 
        body={statusBodyTemplate} 
        sortable 
      />
      <Column 
        field="tasks" 
        header="Tasks" 
        body={tasksBodyTemplate} 
      />
      <Column 
        body={actionsBodyTemplate} 
        header="Actions" 
        style={{ width: '150px' }}
      />
    </DataTable>

    <AlertDialog 
      open={deleteConfirmation.isOpen} 
      onOpenChange={(open) => setDeleteConfirmation(prev => ({ ...prev, isOpen: open }))}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Project</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this project? This action cannot be undone.
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