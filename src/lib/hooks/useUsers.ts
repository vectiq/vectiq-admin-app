import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState, useEffect } from 'react';
import { updateProfile as updateFirebaseProfile, updateEmail, sendPasswordResetEmail } from 'firebase/auth';
import { getUsers, getCurrentUser, createUser, updateUser, deleteUser } from '@/lib/services/users';
import { auth } from '@/lib/firebase';
import type { User } from '@/types';

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

  const handleDeleteUser = useCallback(async (id: string) => {
    return deleteUserMutation.mutateAsync(id);
  }, [deleteUserMutation]);

  const sendPasswordReset = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  return {
    users: usersQuery.data ?? [],
    currentUser: currentUserQuery.data ?? null,
    isAdmin: currentUserQuery.data?.role === 'admin',
    isLoading: usersQuery.isLoading,
    error: usersQuery.error,
    createUser: handleCreateUser,
    updateUser: handleUpdateUser,
    deleteUser: handleDeleteUser,
    isCreating: createUserMutation.isPending,
    isUpdating: updateUserMutation.isPending,
    isDeleting: deleteUserMutation.isPending,
    sendPasswordReset,
  };
}