import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import {
  getProjectNotes,
  getMonthlyNotes,
  addProjectNote,
  addMonthlyNote,
  updateProjectNote,
  updateMonthlyNote,
  deleteProjectNote,
  deleteMonthlyNote
} from '@/lib/services/processingNotes';
import type { Note } from '@/types';

const QUERY_KEYS = {
  projectNotes: 'project-notes',
  monthlyNotes: 'monthly-notes'
};

interface UseProcessingNotesOptions {
  projectId?: string;
  month: string;
}

export function useProcessingNotes({ projectId, month }: UseProcessingNotesOptions) {
  const queryClient = useQueryClient();
  const [notesCache, setNotesCache] = useState<Record<string, Note[]>>({});

  // Query for project notes
  const projectNotesQuery = useQuery({
    queryKey: [QUERY_KEYS.projectNotes, projectId, month],
    queryFn: () => getProjectNotes(projectId!, month),
    enabled: !!projectId && !!month
  });

  // Function to get notes for any project
  const getProjectNotesForId = useCallback(async (id: string, monthStr: string) => {
    // Check cache first
    const cacheKey = `${id}_${monthStr}`;
    if (notesCache[cacheKey]) {
      return { notes: notesCache[cacheKey] };
    }

    try {
      const notes = await getProjectNotes(id, monthStr);
      if (notes) {
        setNotesCache(prev => ({
          ...prev,
          [cacheKey]: notes.notes
        }));
      }
      return notes;
    } catch (error) {
      console.error('Error fetching notes:', error);
      return { notes: [] };
    }
  }, [notesCache]);
  // Query for monthly notes
  const monthlyNotesQuery = useQuery({
    queryKey: [QUERY_KEYS.monthlyNotes, month],
    queryFn: () => getMonthlyNotes(month),
    enabled: !!month
  });

  // Add project note mutation
  const addProjectNoteMutation = useMutation({
    mutationFn: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) =>
      addProjectNote(projectId!, month, note),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.projectNotes, projectId, month]
      });
    }
  });

  // Add monthly note mutation
  const addMonthlyNoteMutation = useMutation({
    mutationFn: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) =>
      addMonthlyNote(month, note),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.monthlyNotes, month]
      });
    }
  });

  // Update project note mutation
  const updateProjectNoteMutation = useMutation({
    mutationFn: ({ noteId, updates }: { noteId: string; updates: Partial<Note> }) =>
      updateProjectNote(projectId!, month, noteId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.projectNotes, projectId, month]
      });
    }
  });

  // Update monthly note mutation
  const updateMonthlyNoteMutation = useMutation({
    mutationFn: ({ noteId, updates }: { noteId: string; updates: Partial<Note> }) =>
      updateMonthlyNote(month, noteId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.monthlyNotes, month]
      });
    }
  });

  // Delete project note mutation
  const deleteProjectNoteMutation = useMutation({
    mutationFn: (noteId: string) =>
      deleteProjectNote(projectId!, month, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.projectNotes, projectId, month]
      });
    }
  });

  // Delete monthly note mutation
  const deleteMonthlyNoteMutation = useMutation({
    mutationFn: (noteId: string) =>
      deleteMonthlyNote(month, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.monthlyNotes, month]
      });
    }
  });

  // Callback handlers
  const handleAddProjectNote = useCallback(async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    return addProjectNoteMutation.mutateAsync(note);
  }, [addProjectNoteMutation]);

  const handleAddMonthlyNote = useCallback(async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    return addMonthlyNoteMutation.mutateAsync(note);
  }, [addMonthlyNoteMutation]);

  const handleUpdateProjectNote = useCallback(async (noteId: string, updates: Partial<Note>) => {
    return updateProjectNoteMutation.mutateAsync({ noteId, updates });
  }, [updateProjectNoteMutation]);

  const handleUpdateMonthlyNote = useCallback(async (noteId: string, updates: Partial<Note>) => {
    return updateMonthlyNoteMutation.mutateAsync({ noteId, updates });
  }, [updateMonthlyNoteMutation]);

  const handleDeleteProjectNote = useCallback(async (noteId: string) => {
    return deleteProjectNoteMutation.mutateAsync(noteId);
  }, [deleteProjectNoteMutation]);

  const handleDeleteMonthlyNote = useCallback(async (noteId: string) => {
    return deleteMonthlyNoteMutation.mutateAsync(noteId);
  }, [deleteMonthlyNoteMutation]);

  return {
    // Project notes
    projectNotes: projectNotesQuery.data?.notes || [],
    getProjectNotes: getProjectNotesForId,
    isLoadingProjectNotes: projectNotesQuery.isLoading,
    addProjectNote: handleAddProjectNote,
    updateProjectNote: handleUpdateProjectNote,
    deleteProjectNote: handleDeleteProjectNote,
    isAddingProjectNote: addProjectNoteMutation.isPending,
    isUpdatingProjectNote: updateProjectNoteMutation.isPending,
    isDeletingProjectNote: deleteProjectNoteMutation.isPending,

    // Monthly notes
    monthlyNotes: monthlyNotesQuery.data?.notes || [],
    isLoadingMonthlyNotes: monthlyNotesQuery.isLoading,
    addMonthlyNote: handleAddMonthlyNote,
    updateMonthlyNote: handleUpdateMonthlyNote,
    deleteMonthlyNote: handleDeleteMonthlyNote,
    isAddingMonthlyNote: addMonthlyNoteMutation.isPending,
    isUpdatingMonthlyNote: updateMonthlyNoteMutation.isPending,
    isDeletingMonthlyNote: deleteMonthlyNoteMutation.isPending,
  };
}