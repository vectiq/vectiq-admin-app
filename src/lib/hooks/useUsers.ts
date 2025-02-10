import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState, useEffect } from 'react';
import { updateProfile as updateFirebaseProfile, updateEmail, sendPasswordResetEmail } from 'firebase/auth';
import { getUsers, getCurrentUser, createUser, updateUser, deleteUser, updateUserRates } from '@/lib/services/users';
import { collection, getDocs } from 'firebase/firestore'; 
import { auth, db } from '@/lib/firebase';
import type { User, SalaryItem, CostRate } from '@/types';

const USERS_KEY = 'users';
const CURRENT_USER_KEY = 'currentUser';

export function useUsers() {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: [USERS_KEY],
    queryFn: getUsers,
    staleTime: 1000 * 60 // 1 minute
  });

  const currentUserQuery = useQuery({
    queryKey: [CURRENT_USER_KEY],
    queryFn: getCurrentUser
  });

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
    }
  });
  
  const updateRatesMutation = useMutation({
    mutationFn: ({ id, updates }: { 
      id: string; 
      updates: { 
        salary?: SalaryItem[]; 
        costRate?: CostRate[];
        hoursPerWeek?: number;
        estimatedBillablePercentage?: number;
      }
    }) => updateUserRates(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
    }
  });

  const handleCreateUser = useCallback(async (data: Omit<User, 'id'>) => {
    return createUserMutation.mutateAsync(data);
  }, [createUserMutation]);

  const handleUpdateUser = useCallback(async (id: string, data: Partial<User>) => {
    const currentUser = auth.currentUser;
    if (currentUser?.uid === id) {
      if (data.name) {
        await updateFirebaseProfile(currentUser, { displayName: data.name });
      }
      if (data.email && data.email !== currentUser.email) {
        await updateEmail(currentUser, data.email);
      }
    }
    return updateUserMutation.mutateAsync({ id, data });
  }, [updateUserMutation]);

  const handleUpdateRates = useCallback(async (id: string, updates: {
    salary?: SalaryItem[];
    costRate?: CostRate[];
    hoursPerWeek?: number;
    estimatedBillablePercentage?: number;
  }) => {
    return updateRatesMutation.mutateAsync({ id, updates });
  }, [updateRatesMutation]);

  const handleDeleteUser = useCallback(async (id: string) => {
    return deleteUserMutation.mutateAsync(id);
  }, [deleteUserMutation]);

  const sendPasswordReset = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  // Get teams for team manager check
  const teamsQuery = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, 'teams'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
  });

  // Determine if current user is a team manager
  const managedTeam = teamsQuery.data?.find(team => 
    team.managerId === currentUserQuery.data?.id
  );

  // A user is a global admin if they have admin role but are not a team manager
  const isGlobalAdmin = currentUserQuery.data?.role === 'admin' && !managedTeam;

  return {
    users: usersQuery.data ?? [],
    currentUser: currentUserQuery.data ?? null,
    isGlobalAdmin,
    managedTeam,
    isTeamManager: !!managedTeam,
    isLoading: usersQuery.isLoading,
    error: usersQuery.error,
    createUser: handleCreateUser,
    updateUser: handleUpdateUser,
    updateRates: handleUpdateRates,
    deleteUser: handleDeleteUser,
    isCreating: createUserMutation.isPending,
    isUpdating: updateUserMutation.isPending,
    isUpdatingRates: updateRatesMutation.isPending,
    isDeleting: deleteUserMutation.isPending,
    sendPasswordReset,
  };
}