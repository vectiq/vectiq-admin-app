import { useState, useEffect } from 'react';
import { format, startOfMonth, addMonths, subMonths } from 'date-fns';
import { useBonuses } from '@/lib/hooks/useBonuses';
import { useUsers } from '@/lib/hooks/useUsers';
import { DollarSign } from 'lucide-react';
import { useTeams } from '@/lib/hooks/useTeams';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, Th, Td } from '@/components/ui/Table';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { DateNavigation } from '@/components/ui/DateNavigation';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { SlidePanel } from '@/components/ui/SlidePanel';
import { formatCurrency } from '@/lib/utils/currency';
import { Plus, Calendar, Loader2, Edit2, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/AlertDialog';
import type { Bonus } from '@/types';

export default function Bonuses() {
  const [currentDate, setCurrentDate] = useState(startOfMonth(new Date()));
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [editingBonus, setEditingBonus] = useState<Bonus | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; bonusId: string | null }>({
    isOpen: false,
    bonusId: null
  });
  const [newBonus, setNewBonus] = useState({
    employeeId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    kpis: '',
    amount: ''
  });

  const currentMonth = format(currentDate, 'yyyy-MM');
  const { currentUser, managedTeam, isTeamManager } = useUsers();
  const { bonuses, createBonus, isLoading, isCreating, updateBonus, deleteBonus } = useBonuses(currentMonth);
  const { users } = useUsers();
  const { teams } = useTeams();

  // Filter bonuses based on user role and team management status
  const filteredBonuses = bonuses.filter(bonus => {
    const employee = users.find(u => u.id === bonus.employeeId);
    if (!employee) return false;
    
    if (currentUser?.role === 'admin') {
      if (isTeamManager) {
        // Admin who is also team manager only sees their team's bonuses
        return employee.teamId === managedTeam?.id;
      }
      // Regular admin sees all bonuses
      return true;
    }
    return false; // Regular users see nothing
  });

  // Filter users based on team management status
  const availableUsers = users.filter(user => {
    if (currentUser?.role === 'admin') {
      // Only allow employees to receive bonuses
      const isEmployee = user.employeeType === 'employee';
      
      if (isTeamManager) {
        // Admin who is also team manager only sees their team members
        return isEmployee && user.teamId === managedTeam?.id;
      }
      // Regular admin sees all users
      return isEmployee;
    }
    return false;
  });

  const handlePrevious = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNext = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(startOfMonth(new Date()));

  const handleEditBonus = (bonus: Bonus) => {
    setEditingBonus(bonus);
    setNewBonus({
      employeeId: bonus.employeeId,
      date: format(new Date(bonus.date), 'yyyy-MM-dd'),
      kpis: bonus.kpis || '',
      amount: bonus.amount.toString()
    });
    setIsScheduleDialogOpen(true);
  };

  const handleDeleteBonus = (id: string) => {
    setDeleteConfirmation({ isOpen: true, bonusId: id });
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmation.bonusId) {
      try {
        await deleteBonus(deleteConfirmation.bonusId);
      } catch (error) {
        console.error('Error deleting bonus:', error);
        alert('Failed to delete bonus');
      }
    }
    setDeleteConfirmation({ isOpen: false, bonusId: null });
  };

  const handleCreateBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBonus.employeeId || !newBonus.date || !newBonus.amount) return;

    // Get the employee's team ID
    const employee = users.find(u => u.id === newBonus.employeeId);
    if (!employee) return;

    // Use employee's assigned team
    const teamId = employee.teamId;

    try {
      if (editingBonus) {
        await updateBonus(editingBonus.id, {
          employeeId: newBonus.employeeId,
          teamId: teamId,
          date: newBonus.date,
          kpis: newBonus.kpis,
          amount: parseFloat(newBonus.amount)
        });
      } else {
        await createBonus({
          employeeId: newBonus.employeeId,
          teamId: teamId,
          date: newBonus.date,
          kpis: newBonus.kpis,
          amount: parseFloat(newBonus.amount),
          paid: false
        });
      }

      setNewBonus({
        employeeId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        kpis: '',
        amount: ''
      });
      setEditingBonus(null);
      setIsScheduleDialogOpen(false);
    } catch (error) {
      console.error('Error saving bonus:', error);
      alert('Failed to save bonus');
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  const totalBonuses = bonuses.reduce((sum, bonus) => sum + bonus.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Bonuses</h1>
          {isTeamManager && (
            <p className="mt-1 text-sm text-gray-500">
              Managing bonuses for {managedTeam.name}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => setIsScheduleDialogOpen(true)}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Add Bonus
          </Button>
          <DateNavigation
            currentDate={currentDate}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onToday={handleToday}
            formatString="MMMM yyyy"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bonuses</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(totalBonuses)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Bonuses Table */}
      <Card>
        <Table>
          <TableHeader>
            <tr>
              <Th>Employee</Th>
              <Th>Team</Th>
              <Th>Date</Th>
              <Th>KPIs</Th>
              <Th className="text-right">Amount</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredBonuses.map((bonus) => {
              const employee = users.find(u => u.id === bonus.employeeId);
              
              return (
                <tr key={bonus.id}>
                  <Td className="font-medium">{employee?.name}</Td>
                  <Td>
                    {employee?.teamId ? (
                      <Badge variant="secondary">
                        {teams.find(t => t.id === employee.teamId)?.name || '-'}
                      </Badge>
                    ) : '-'}
                  </Td>
                  <Td>{format(new Date(bonus.date), 'MMM d, yyyy')}</Td>
                  <Td>{bonus.kpis || '-'}</Td>
                  <Td className="text-right font-medium">{formatCurrency(bonus.amount)}</Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEditBonus(bonus)}
                        className="p-1.5"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDeleteBonus(bonus.id)}
                        className="p-1.5 text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Td>
                </tr>
              );
            })}
            {bonuses.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-4 text-gray-500">
                  No bonuses found for this month
                </td>
              </tr>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Schedule Bonus Dialog */}
      <SlidePanel
        open={isScheduleDialogOpen}
        onClose={() => setIsScheduleDialogOpen(false)}
        title={editingBonus ? 'Edit Bonus' : 'Schedule Bonus'}
        icon={<Calendar className="h-5 w-5 text-indigo-500" />}
      >
        <div className="p-6">
          <form onSubmit={handleCreateBonus} className="space-y-4">
            <FormField label="Employee">
              <Select
                value={newBonus.employeeId}
                onValueChange={(value) => {
                  setNewBonus(prev => ({ ...prev, employeeId: value }));
                }}
              >
                <SelectTrigger>
                  {newBonus.employeeId ? (
                    <div className="flex items-center gap-2">
                      <span>{users.find(u => u.id === newBonus.employeeId)?.name}</span>
                      {users.find(u => u.id === newBonus.employeeId)?.teamId && (
                        <Badge variant="secondary" className="ml-2">
                          {teams.find(t => t.id === users.find(u => u.id === newBonus.employeeId)?.teamId)?.name}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    'Select employee'
                  )}
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <span>{user.name}</span>
                        {user.teamId && (
                          <Badge variant="secondary" className="ml-2">
                            {teams.find(t => t.id === user.teamId)?.name}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Date">
              <Input
                type="date"
                value={newBonus.date}
                onChange={(e) => setNewBonus(prev => ({ ...prev, date: e.target.value }))}
              />
            </FormField>

            <FormField label="KPIs">
              <textarea
                value={newBonus.kpis}
                onChange={(e) => setNewBonus(prev => ({ ...prev, kpis: e.target.value }))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                rows={3}
                placeholder="Describe the KPIs or reason for this bonus..."
              />
            </FormField>

            <FormField label="Amount">
              <Input
                type="number"
                step="0.01"
                value={newBonus.amount}
                onChange={(e) => setNewBonus(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
              />
            </FormField>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditingBonus(null);
                  setIsScheduleDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating || !newBonus.employeeId || !newBonus.date || !newBonus.amount}
              >
                {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingBonus ? 'Update Bonus' : 'Schedule Bonus'}
              </Button>
            </div>
          </form>
        </div>
      </SlidePanel>

      <AlertDialog 
        open={deleteConfirmation.isOpen} 
        onOpenChange={(open) => setDeleteConfirmation(prev => ({ ...prev, isOpen: open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bonus</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this bonus? This action cannot be undone.
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