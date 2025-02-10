import { useState } from 'react';
import { useUsers } from '@/lib/hooks/useUsers';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Plus, AlertTriangle, Users as UsersIcon } from 'lucide-react';
import { cn } from '@/lib/utils/styles';
import { UsersTable } from '@/components/users/UsersTable';
import { UserDialog } from '@/components/users/UserDialog';
import { RatesDialog } from '@/components/users/RatesDialog';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
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
import type { User } from '@/types';

export default function Users() {
  const [showPotentialOnly, setShowPotentialOnly] = useState(false);
  const { 
    users, 
    isLoading, 
    createUser, 
    updateUser, 
    updateRates,
    deleteUser,
    isTeamManager,
    managedTeam
  } = useUsers();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRatesUser, setSelectedRatesUser] = useState<User | null>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; userId: string | null }>({
    isOpen: false,
    userId: null
  });

  const handleOpenCreateDialog = () => {
    setSelectedUser(null);
    setIsUserDialogOpen(true);
  };

  const handleManageRates = (user: User) => {
    setSelectedRatesUser(user);
  };

  const handleSubmit = async (data: Omit<User, 'id'>) => {
    // If team manager, force team assignment
    if (isTeamManager) {
      data.teamId = managedTeam.id;
    }

    if (selectedUser) {
      await updateUser(selectedUser.id, data);
    } else {
      await createUser(data);
    }
    setIsUserDialogOpen(false);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsUserDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirmation({ isOpen: true, userId: id });
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmation.userId) {
      await deleteUser(deleteConfirmation.userId);
      setDeleteConfirmation({ isOpen: false, userId: null });
    }
  };

  const handleSaveRates = async (updates: { 
    salary?: SalaryItem[]; 
    costRate?: CostRate[];
    hoursPerWeek?: number;
    estimatedBillablePercentage?: number;
  }) => {
    if (selectedRatesUser) {
      await updateRates(selectedRatesUser.id, updates);
      setSelectedRatesUser(null);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  const filteredUsers = showPotentialOnly 
    ? users.filter(user => user.isPotential && (!isTeamManager || user.teamId === managedTeam?.id))
    : isTeamManager
      ? users.filter(user => user.teamId === managedTeam?.id)
      : users;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Staff</h1>
          {isTeamManager && (
            <p className="mt-1 text-sm text-gray-500">
              Managing team: {managedTeam?.name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={showPotentialOnly}
              onCheckedChange={(checked: boolean) => setShowPotentialOnly(checked)}
              label="Show potential staff only"
            />
          </div>
          <Button onClick={handleOpenCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            New Staff Member
          </Button>
        </div>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg">
        <UsersTable 
          users={filteredUsers}
          onEdit={handleEdit}
          onManageRates={handleManageRates}
          onDelete={handleDelete}
        />
      </div>

      <UserDialog
        open={isUserDialogOpen}
        onOpenChange={setIsUserDialogOpen}
        user={selectedUser}
        onSubmit={handleSubmit}
      />

      <RatesDialog
        open={!!selectedRatesUser}
        onOpenChange={(open) => !open && setSelectedRatesUser(null)}
        user={selectedRatesUser || null}
        onSave={handleSaveRates}
      />

      <AlertDialog 
        open={deleteConfirmation.isOpen} 
        onOpenChange={(open) => setDeleteConfirmation(prev => ({ ...prev, isOpen: open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <AlertDialogTitle>Delete User</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}