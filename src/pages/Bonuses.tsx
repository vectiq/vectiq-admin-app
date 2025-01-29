import { useState, useEffect } from 'react';
import { format, startOfMonth, addMonths, subMonths } from 'date-fns';
import { useBonuses } from '@/lib/hooks/useBonuses';
import { useUsers } from '@/lib/hooks/useUsers';
import { useTeams } from '@/lib/hooks/useTeams';
import { usePayroll } from '@/lib/hooks/usePayroll';
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
import { Plus, DollarSign, Calendar, Loader2, Edit2, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/AlertDialog';
import type { Bonus } from '@/types';

export default function Bonuses() {
  const [currentDate, setCurrentDate] = useState(startOfMonth(new Date()));
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [selectedPayRun, setSelectedPayRun] = useState('');
  const [selectedPayItem, setSelectedPayItem] = useState<string>('');
  const [selectedBonuses, setSelectedBonuses] = useState<Set<string>>(new Set());
  const [editingBonus, setEditingBonus] = useState<Bonus | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; bonusId: string | null }>({
    isOpen: false,
    bonusId: null
  });
  const [newBonus, setNewBonus] = useState({
    employeeId: '',
    teamId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    kpis: '',
    amount: ''
  });

  const currentMonth = format(currentDate, 'yyyy-MM');
  const { currentUser } = useUsers();
  const { bonuses, createBonus, processBonuses, isLoading, isCreating, isProcessing, updateBonus, deleteBonus } = useBonuses(currentMonth);
  const { users } = useUsers();
  const { teams } = useTeams();
  const { payRuns, payItems } = usePayroll({ selectedDate: currentDate });
  
  // Set default pay item when payItems are loaded
  useEffect(() => {
    if (payItems.length > 0 && !selectedPayItem) {
      const defaultItem = payItems.find(item => item.Name === 'Bonus and commissions');
      if (defaultItem) {
        setSelectedPayItem(defaultItem.EarningsRateID);
      }
    }
  }, [payItems, selectedPayItem]);

  // Determine if user is a team manager
  const managedTeam = teams.find(team => team.managerId === currentUser?.id);
  const isTeamManager = !!managedTeam;
  const isAdmin = currentUser?.role === 'admin';

  // Filter bonuses based on user role and team management status
  const filteredBonuses = bonuses.filter(bonus => {
    if (isAdmin && !isTeamManager) return true; // Admin sees all bonuses
    if (isTeamManager) return bonus.teamId === managedTeam.id; // Team manager sees only their team's bonuses
    return false; // Regular users see nothing
  });

  // Filter users based on team management status
  const availableUsers = users.filter(user => {
    if (isAdmin && !isTeamManager) return true; // Admin sees all users
    if (isTeamManager) return user.teamId === managedTeam.id; // Team manager sees only their team members
    return false;
  });
  // Filter to only show draft pay runs
  const draftPayRuns = payRuns.filter(run => run.PayRunStatus === 'DRAFT');

  const handlePrevious = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNext = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(startOfMonth(new Date()));

  const handleEditBonus = (bonus: Bonus) => {
    setEditingBonus(bonus);
    setNewBonus({
      employeeId: bonus.employeeId,
      teamId: bonus.teamId || '',
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

    // Set teamId based on user role
    let teamId = newBonus.teamId;
    if (isTeamManager) {
      teamId = managedTeam.id; // Force team manager's team
    } else if (teamId === 'none') {
      teamId = undefined;
    }

    try {
      if (editingBonus) {
        await updateBonus(editingBonus.id, {
          employeeId: newBonus.employeeId,
          teamId,
          date: newBonus.date,
          kpis: newBonus.kpis,
          amount: parseFloat(newBonus.amount)
        });
      } else {
        await createBonus({
          employeeId: newBonus.employeeId,
          teamId,
          date: newBonus.date,
          kpis: newBonus.kpis,
          amount: parseFloat(newBonus.amount),
          paid: false
        });
      }

      setNewBonus({
        employeeId: '',
        teamId: '',
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

  const handleProcessBonuses = async () => {
    if (!selectedPayRun || !selectedPayItem) return;
    const selectedBonusList = bonuses.filter(bonus => selectedBonuses.has(bonus.id));

    try {
      await processBonuses(selectedBonusList, selectedPayRun, selectedPayItem);
      setIsProcessDialogOpen(false);
      setSelectedBonuses(new Set());
      setSelectedPayItem('');
    } catch (error) {
      console.error('Error processing bonuses:', error);
      alert('Failed to process bonuses. Please check the console for details.');
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  const unpaidBonuses = bonuses.filter(bonus => !bonus.paid);
  const totalUnpaid = unpaidBonuses.reduce((sum, bonus) => sum + bonus.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Bonuses</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => setIsScheduleDialogOpen(true)}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Add Bonus
          </Button>
          <Button
            onClick={() => setIsProcessDialogOpen(true)}
            disabled={selectedBonuses.size === 0}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Process Bonuses
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
            <div className="p-2 bg-indigo-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Unpaid Bonuses</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(totalUnpaid)}
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
              <Th className="w-8">
                <input
                  type="checkbox"
                  checked={selectedBonuses.size === filteredBonuses.filter(b => !b.paid).length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedBonuses(new Set(filteredBonuses.filter(b => !b.paid).map(b => b.id)));
                    } else {
                      setSelectedBonuses(new Set());
                    }
                  }}
                  className="rounded border-gray-300"
                />
              </Th>
              <Th>Employee</Th>
              <Th>Team</Th>
              <Th>Date</Th>
              <Th>KPIs</Th>
              <Th className="text-right">Amount</Th>
              <Th>Status</Th>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredBonuses.map((bonus) => {
              const employee = users.find(u => u.id === bonus.employeeId);
              const team = teams.find(t => t.id === bonus.teamId);
              
              return (
                <tr key={bonus.id}>
                  <Td>
                    {!bonus.paid && (
                      <input
                        type="checkbox"
                        checked={selectedBonuses.has(bonus.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedBonuses);
                          if (e.target.checked) {
                            newSelected.add(bonus.id);
                          } else {
                            newSelected.delete(bonus.id);
                          }
                          setSelectedBonuses(newSelected);
                        }}
                        className="rounded border-gray-300"
                      />
                    )}
                  </Td>
                  <Td className="font-medium">{employee?.name}</Td>
                  <Td>{team?.name || '-'}</Td>
                  <Td>{format(new Date(bonus.date), 'MMM d, yyyy')}</Td>
                  <Td>{bonus.kpis || '-'}</Td>
                  <Td className="text-right font-medium">{formatCurrency(bonus.amount)}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={bonus.paid ? 'success' : 'warning'}
                      >
                        {bonus.paid ? 'Included in pay run' : 'Pending'}
                      </Badge>
                      {!bonus.paid && (
                        <div className="flex gap-2">
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
                      )}
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
                onValueChange={(value) => setNewBonus(prev => ({ ...prev, employeeId: value }))}
              >
                <SelectTrigger>
                  {newBonus.employeeId ? users.find(u => u.id === newBonus.employeeId)?.name : 'Select Employee'}
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Team (Optional)">
              <Select
                value={newBonus.teamId}
                disabled={isTeamManager}
                onValueChange={(value) => setNewBonus(prev => ({ ...prev, teamId: value }))}
              >
                <SelectTrigger>
                  {isTeamManager 
                    ? managedTeam.name 
                    : (newBonus.teamId ? teams.find(t => t.id === newBonus.teamId)?.name : 'Select Team')
                  }
                </SelectTrigger>
                {!isTeamManager && (
                  <SelectContent>
                    <SelectItem value="none">No Team</SelectItem> 
                    {teams.map(team => ( 
                      <SelectItem key={team.id} value={team.id}> 
                        {team.name} 
                      </SelectItem> 
                    ))} 
                  </SelectContent> 
                )} 
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

      {/* Process Bonuses Dialog */}
      <SlidePanel
        open={isProcessDialogOpen}
        onClose={() => setIsProcessDialogOpen(false)}
        title="Process Bonuses"
        icon={<DollarSign className="h-5 w-5 text-indigo-500" />}
      >
        <div className="p-6">
          <div className="space-y-4">
            <FormField label="Select Pay Run">
              <Select
                value={selectedPayRun}
                onValueChange={setSelectedPayRun}
              >
                <SelectTrigger>
                  {selectedPayRun ? 
                    draftPayRuns.find(run => run.PayRunID === selectedPayRun)
                      ? `${format(new Date(draftPayRuns.find(run => run.PayRunID === selectedPayRun)?.PayRunPeriodStartDate), 'MMM d')} - ${format(new Date(draftPayRuns.find(run => run.PayRunID === selectedPayRun)?.PayRunPeriodEndDate), 'MMM d, yyyy')}`
                      : 'Select Pay Run'
                    : 'Select Pay Run'}
                </SelectTrigger>
                <SelectContent>
                  {draftPayRuns.map(run => (
                    <SelectItem key={run.PayRunID} value={run.PayRunID}>
                      {format(new Date(run.PayRunPeriodStartDate), 'MMM d')} - {format(new Date(run.PayRunPeriodEndDate), 'MMM d, yyyy')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Pay Item">
              <Select
                value={selectedPayItem}
                onValueChange={setSelectedPayItem}
              >
                <SelectTrigger>
                  {selectedPayItem ? 
                    payItems.find(item => item.EarningsRateID === selectedPayItem)?.Name || 'Select Pay Item'
                    : 'Select Pay Item'}
                </SelectTrigger>
                <SelectContent>
                  {payItems
                    .map(item => (
                      <SelectItem key={item.EarningsRateID} value={item.EarningsRateID}>
                        {item.Name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </FormField>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Selected Bonuses</h3>
              <div className="space-y-2">
                {Array.from(selectedBonuses).map(id => {
                  const bonus = bonuses.find(b => b.id === id);
                  if (!bonus) return null;
                  const employee = users.find(u => u.id === bonus.employeeId);
                  
                  return (
                    <div key={id} className="flex justify-between items-center text-sm">
                      <span>{employee?.name}</span>
                      <span className="font-medium">{formatCurrency(bonus.amount)}</span>
                    </div>
                  );
                })}
                {selectedBonuses.size === 0 && (
                  <p className="text-sm text-gray-500">No bonuses selected</p>
                )}
                {selectedBonuses.size > 0 && (
                  <div className="pt-2 mt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span>Total</span>
                      <span>
                        {formatCurrency(
                          Array.from(selectedBonuses)
                            .map(id => bonuses.find(b => b.id === id)?.amount || 0)
                            .reduce((a, b) => a + b, 0)
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setIsProcessDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleProcessBonuses}
                disabled={isProcessing || !selectedPayRun || !selectedPayItem || selectedBonuses.size === 0}
              >
                {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Process Selected Bonuses
              </Button>
            </div>
          </div>
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