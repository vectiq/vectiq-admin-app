import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import {
  getProjectNotes,
  getPayRunNotes,
  addProjectNote,
  addPayRunNote,
  updateProjectNote,
  updatePayRunNote,
  deleteProjectNote,
  deletePayRunNote
} from '@/lib/services/processingNotes';
import type { Note } from '@/types';

const QUERY_KEYS = {
  projectNotes: 'project-notes',
  payRunNotes: 'payrun-notes'
};

interface UseProcessingNotesOptions {
  projectId?: string;
  payRunId?: string;
}

function useProcessingNotes({
  projectId,
  payRunId
}: UseProcessingNotesOptions) {
  const queryClient = useQueryClient();
  const [notesCache, setNotesCache] = useState<Record<string, Note[]>>({});

  // Query for project notes
  const projectNotesQuery = useQuery({
    queryKey: [QUERY_KEYS.projectNotes, projectId, payRunId],
    queryFn: () => getProjectNotes(projectId!, payRunId || ''),
    enabled: !!projectId && !!payRunId
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
    queryKey: [QUERY_KEYS.payRunNotes, payRunId],
    queryFn: () => getPayRunNotes(payRunId || ''),
    enabled: !!payRunId
  });

  // Add project note mutation
  const addProjectNoteMutation = useMutation({
    mutationFn: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) =>
      addProjectNote(projectId!, payRunId || '', note),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.projectNotes, projectId, payRunId]
      });
    }
  });

  // Add monthly note mutation
  const addMonthlyNoteMutation = useMutation({
    mutationFn: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) =>
      addPayRunNote(payRunId!, note),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.payRunNotes, payRunId]
      });
    }
  });

  // Update project note mutation
  const updateProjectNoteMutation = useMutation({
    mutationFn: ({ noteId, updates }: { noteId: string; updates: Partial<Note> }) =>
      updateProjectNote(projectId!, payRunId || '', noteId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.projectNotes, projectId, payRunId]
      });
    }
  });

  // Update monthly note mutation
  const updateMonthlyNoteMutation = useMutation({
    mutationFn: ({ noteId, updates }: { noteId: string; updates: Partial<Note> }) =>
      updatePayRunNote(payRunId!, noteId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.payRunNotes, payRunId]
      });
    }
  });

  // Delete project note mutation
  const deleteProjectNoteMutation = useMutation({
    mutationFn: (noteId: string) =>
      deleteProjectNote(projectId!, payRunId || '', noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.projectNotes, projectId, payRunId]
      });
    }
  });

  // Delete monthly note mutation
  const deleteMonthlyNoteMutation = useMutation({
    mutationFn: (noteId: string) =>
      deletePayRunNote(payRunId!, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.payRunNotes, payRunId]
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

export { useProcessingNotes }