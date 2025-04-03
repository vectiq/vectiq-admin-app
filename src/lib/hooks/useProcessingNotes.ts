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
  month?: string;
  year?: string;
}

function useProcessingNotes({
  projectId,
  month,
  year
}: UseProcessingNotesOptions) {
  const queryClient = useQueryClient();
  const [notesCache, setNotesCache] = useState<Record<string, Note[]>>({});
  
  // Combine month and year if both are provided, otherwise use month
  const monthYear = year && month ? `${year}-${month}` : month;

  // Query for project notes
  const projectNotesQuery = useQuery({
    queryKey: [QUERY_KEYS.projectNotes, projectId, monthYear],
    queryFn: () => getProjectNotes(projectId!, monthYear || ''),
    enabled: !!projectId && !!monthYear
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
    queryKey: [QUERY_KEYS.payRunNotes, monthYear],
    queryFn: () => getPayRunNotes(monthYear || ''),
    enabled: !!monthYear
  });

  // Add project note mutation
  const addProjectNoteMutation = useMutation({
    mutationFn: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) =>
      addProjectNote(projectId!, monthYear || '', note), 
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.projectNotes, projectId, monthYear]
      });
      
      // Update the cache for this project
      const cacheKey = `${projectId}_${monthYear}`;
      setNotesCache(prev => {
        const existingNotes = prev[cacheKey] || [];
        // Create a mock note with a temporary ID
        const mockNote: Note = {
          id: `temp-${Date.now()}`,
          text: 'New note',
          priority: 'medium',
          status: 'pending',
          createdBy: 'Current User',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return {
          ...prev,
          [cacheKey]: [...existingNotes, mockNote]
        };
      });
    }
  });

  // Add monthly note mutation
  const addMonthlyNoteMutation = useMutation({
    mutationFn: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) =>
      addPayRunNote(monthYear!, note),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.payRunNotes, monthYear]
      });
    }
  });

  // Update project note mutation
  const updateProjectNoteMutation = useMutation({
    mutationFn: ({ noteId, updates }: { noteId: string; updates: Partial<Note> }) =>
      updateProjectNote(projectId!, monthYear || '', noteId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.projectNotes, projectId, monthYear]
      });
    }
  });

  // Update monthly note mutation
  const updateMonthlyNoteMutation = useMutation({
    mutationFn: ({ noteId, updates }: { noteId: string; updates: Partial<Note> }) =>
      updatePayRunNote(monthYear!, noteId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.payRunNotes, monthYear]
      });
    }
  });

  // Delete project note mutation
  const deleteProjectNoteMutation = useMutation({
    mutationFn: (noteId: string) =>
      deleteProjectNote(projectId!, monthYear || '', noteId),
    onSuccess: (_, noteId) => {
      // Update the cache directly for immediate UI feedback
      queryClient.setQueryData(
        [QUERY_KEYS.projectNotes, projectId, monthYear],
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            notes: oldData.notes.filter((note: Note) => note.id !== noteId)
          };
        }
      );
      
      // Also invalidate the query to ensure data consistency
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.projectNotes, projectId, monthYear]
      });
    }
  });

  // Delete monthly note mutation
  const deleteMonthlyNoteMutation = useMutation({
    mutationFn: (noteId: string) =>
      deletePayRunNote(monthYear!, noteId),
    onSuccess: (_, noteId) => {
      // Update the cache directly for immediate UI feedback
      queryClient.setQueryData(
        [QUERY_KEYS.payRunNotes, monthYear],
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            notes: oldData.notes.filter((note: Note) => note.id !== noteId)
          };
        }
      );
      
      // Also invalidate the query to ensure data consistency
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.payRunNotes, monthYear]
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