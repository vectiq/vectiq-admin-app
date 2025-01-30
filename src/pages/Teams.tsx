import { useState, useCallback } from 'react';
import { useTeams } from '@/lib/hooks/useTeams';
import { TeamsTable } from '@/components/teams/TeamsTable';
import { TeamDialog } from '@/components/teams/TeamDialog';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Button } from '@/components/ui/Button';
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
import type { Team } from '@/types';

export default function Teams() {
  const { 
    teams, 
    isLoading, 
    createTeam, 
    updateTeam, 
    deleteTeam,
    isCreating,
    isUpdating,
    isDeleting 
  } = useTeams();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; teamId: string | null }>({
    isOpen: false,
    teamId: null
  });

  const handleOpenCreateDialog = useCallback(() => {
    setSelectedTeam(null);
    setIsDialogOpen(true);
  }, []);

  const handleSubmit = useCallback(async (data: Team) => {
    if (selectedTeam) {
      await updateTeam(selectedTeam.id, data);
    } else {
      await createTeam(data);
    }
    setIsDialogOpen(false);
  }, [selectedTeam, updateTeam, createTeam]);

  const handleEdit = useCallback((team: Team) => {
    setSelectedTeam(team);
    setIsDialogOpen(true);
  }, []);

  const handleDelete = async (id: string) => {
    setDeleteConfirmation({ isOpen: true, teamId: id });
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmation.teamId) {
      await deleteTeam(deleteConfirmation.teamId);
      setDeleteConfirmation({ isOpen: false, teamId: null });
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  const isProcessing = isCreating || isUpdating || isDeleting;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Teams</h1>
        <Button onClick={handleOpenCreateDialog} disabled={isProcessing}>
          <Plus className="h-4 w-4 mr-2" />
          New Team
        </Button>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg">
        <TeamsTable 
          teams={teams} 
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <TeamDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        team={selectedTeam}
        onSubmit={handleSubmit}
      />
      
      <AlertDialog 
        open={deleteConfirmation.isOpen} 
        onOpenChange={(open) => setDeleteConfirmation(prev => ({ ...prev, isOpen: open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this team? This action cannot be undone.
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