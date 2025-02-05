import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  assignUserToTask,
  removeUserFromTask
} from '@/lib/services/projects';
import type { Project } from '@/types';

const QUERY_KEY = 'projects';

export function useProjects() {
  const queryClient = useQueryClient();

  const query = useQuery<Project[]>({
    queryKey: [QUERY_KEY],
    queryFn: getProjects,
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true // Refetch when component mounts
  });

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: Project) => updateProject(data),
    onSuccess: () => {
      // Force a refetch instead of just invalidating
      return queryClient.refetchQueries({ queryKey: [QUERY_KEY] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    }
  });

  const handleCreateProject = useCallback(async (data: Omit<Project, 'id'>) => {
    return createMutation.mutateAsync(data);
  }, [createMutation]);

  const handleUpdateProject = useCallback(async (data: Project) => {
    if (!data.id) throw new Error('Project ID is required for update');
    await updateMutation.mutateAsync({
      ...data,
      tasks: data.tasks || []
    });
    
    // Force a refetch after update
    await queryClient.refetchQueries({ queryKey: [QUERY_KEY] });
  }, [updateMutation]);

  const handleDeleteProject = useCallback(async (id: string) => {
    return deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const handleAssignUser = useCallback(async (
    taskId: string,
    userId: string,
    userName: string,
    projectId?: string
  ) => {
    const projectsData = query.data || [];
    // Get project ID from task ID if not provided
    const project = projectsData.find(p => p.tasks.some(t => t.id === taskId));
    if (!project) throw new Error('Project not found');
    projectId = project.id;

    await assignUserToTask(projectId, taskId, userId, userName);
    // Invalidate projects query to refresh the data
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
  }, [query.data, queryClient]);

  const handleRemoveUser = useCallback(async (
    projectId: string,
    taskId: string,
    assignmentId: string
  ) => {
    await removeUserFromTask(projectId, taskId, assignmentId);
    // Force a refetch after update
    await queryClient.refetchQueries({ queryKey: [QUERY_KEY] });
  }, [queryClient]);

  return {
    projects: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createProject: handleCreateProject,
    updateProject: handleUpdateProject,
    deleteProject: handleDeleteProject,
    assignUserToTask: handleAssignUser,
    removeUserFromTask: handleRemoveUser,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}