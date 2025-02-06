import { useState } from 'react';
import { useProjects } from '@/lib/hooks/useProjects';
import { useClients } from '@/lib/hooks/useClients';
import { ProjectsTable } from '@/components/projects/ProjectsTable';
import { ClientsTable } from '@/components/clients/ClientsTable';
import { ProjectDialog } from '@/components/projects/ProjectDialog';
import { ClientDialog } from '@/components/clients/ClientDialog';
import { ProjectTasks } from '@/components/projects/ProjectTasks';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Plus } from 'lucide-react';
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
import type { Project, Client } from '@/types';

const TABS = [
  { id: 'clients', name: 'Clients' },
  { id: 'projects', name: 'Projects' }
] as const;

export default function ClientsAndProjects() {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]['id']>('clients');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isTasksDialogOpen, setIsTasksDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ 
    isOpen: boolean; 
    id: string | null;
    type: 'client' | 'project' | null;
  }>({
    isOpen: false,
    id: null,
    type: null
  });

  const { 
    projects, 
    isLoading: isLoadingProjects, 
    createProject, 
    updateProject, 
    deleteProject,
    assignUserToTask,
    removeUserFromTask
  } = useProjects();

  const {
    clients,
    isLoading: isLoadingClients,
    createClient,
    updateClient,
  } = useClients();

  // Get selected project from React Query data
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Filter projects based on active status and end date
  const filteredProjects = projects.filter(project => {
    if (includeInactive) return true;
    
    const isActive = project.isActive;
    const hasEndDate = project.endDate && project.endDate.trim() !== '';
    const endDate = hasEndDate ? new Date(project.endDate) : null;
    const isEndDateInFuture = endDate ? endDate > new Date() : true;
    
    return isActive && (!hasEndDate || isEndDateInFuture);
  });

  const handleProjectSubmit = async (data: Project) => {
    if (selectedProject) {
      await updateProject({ ...data, id: selectedProject.id });
    } else {
      await createProject(data);
    }
    setIsProjectDialogOpen(false);
  };

  const handleClientSubmit = async (data: Client) => {
    if (selectedClient) {
      await updateClient(selectedClient.id, data);
    } else {
      await createClient(data);
    }
    setIsClientDialogOpen(false);
  };

  const handleDelete = async (id: string, type: 'client' | 'project') => {
    setDeleteConfirmation({ isOpen: true, id, type });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.id || !deleteConfirmation.type) return;

    try {
      if (deleteConfirmation.type === 'project') {
        await deleteProject(deleteConfirmation.id);
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete');
    }

    setDeleteConfirmation({ isOpen: false, id: null, type: null });
  };

  const handleUpdateProjectTasks = async (updatedProject: Project) => {
    await updateProject(updatedProject);
  };

  if (isLoadingProjects || isLoadingClients) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Clients & Projects</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Header */}
      <div className="flex justify-end gap-4">
        {activeTab === 'projects' && (
          <Checkbox
            checked={includeInactive}
            onCheckedChange={(checked) => setIncludeInactive(checked)}
            label="Show inactive projects"
          />
        )}
        <Button 
          onClick={() => {
            if (activeTab === 'projects') {
              setSelectedProjectId(null);
              setIsProjectDialogOpen(true);
            } else {
              setSelectedClient(null);
              setIsClientDialogOpen(true);
            }
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          New {activeTab === 'projects' ? 'Project' : 'Client'}
        </Button>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg">
        {activeTab === 'projects' ? (
          <ProjectsTable 
            projects={filteredProjects}
            onEdit={(project) => {
              setSelectedProjectId(project.id);
              setIsProjectDialogOpen(true);
            }}
            onDelete={(id) => handleDelete(id, 'project')}
            onManageAssignments={(project) => {
              setSelectedProjectId(project.id);
              setIsTasksDialogOpen(true);
            }}
          />
        ) : (
          <ClientsTable 
            clients={clients}
            onEdit={(client) => {
              setSelectedClient(client);
              setIsClientDialogOpen(true);
            }}
          />
        )}
      </div>

      <ProjectDialog
        open={isProjectDialogOpen}
        onOpenChange={setIsProjectDialogOpen}
        project={selectedProject || null}
        onSubmit={handleProjectSubmit}
      />

      <ClientDialog
        open={isClientDialogOpen}
        onOpenChange={setIsClientDialogOpen}
        client={selectedClient}
        onSubmit={handleClientSubmit}
      />
      
      <ProjectTasks
        open={isTasksDialogOpen}
        onOpenChange={setIsTasksDialogOpen}
        project={selectedProject || null}
        onAssignUser={assignUserToTask}
        onRemoveUser={(projectId, taskId, assignmentId) => removeUserFromTask(projectId, taskId, assignmentId)}
        onUpdateProject={handleUpdateProjectTasks}
      />

      <AlertDialog 
        open={deleteConfirmation.isOpen} 
        onOpenChange={(open) => setDeleteConfirmation(prev => ({ ...prev, isOpen: open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteConfirmation.type === 'client' ? 'Client' : 'Project'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {deleteConfirmation.type}? This action cannot be undone.
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