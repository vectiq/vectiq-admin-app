import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useUsers } from '@/lib/hooks/useUsers';
import { cn } from '@/lib/utils/styles';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import { SlidePanel } from '@/components/ui/SlidePanel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { FormField } from '@/components/ui/FormField';
import { Link, User as UserIcon, Briefcase, Users } from 'lucide-react';
import type { User } from '@/types';
import { useTeams } from '@/lib/hooks/useTeams';

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSubmit: (data: User) => void;
}

export function UserDialog({
  open,
  onOpenChange,
  user,
  onSubmit,
}: UserDialogProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }, 
  } = useForm<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>({
    defaultValues: user || {
      email: '',
      name: '',
      employeeType: 'employee',
      role: 'user',
      projectAssignments: [],
      overtime: 'no',
    },
    shouldUnregister: false, // Prevent fields from being unregistered when removed
  });

  const { users } = useUsers();
  const { teams } = useTeams();
  const employeeType = watch('employeeType');
  
  useEffect(() => {
    if (open) {
      reset(user || {
        email: '',
        name: '',
        role: 'user',
        hoursPerWeek: 40,
        overtime: 'no',
        projectAssignments: [],
      });
    }
  }, [open, user, reset]);

  const handleFormSubmit = async (data: any) => {
    const userData = user ? { ...data, id: user.id } : data;
    await onSubmit(userData);
    onOpenChange(false);
  };

  return (
    <SlidePanel
      open={open}
      onClose={() => onOpenChange(false)}
      title={user ? 'Edit Staff Member' : 'New Staff Member'}
      subtitle={!user ? 'A temporary password will be generated and a password reset email will be sent.' : undefined}
      icon={<UserIcon className="h-5 w-5 text-indigo-500" />}
    >
      <div className="p-6">

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <UserIcon className="h-4 w-4" />
              Basic Information
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Name">
                <Input
                  {...register('name')}
                  placeholder="Enter full name"
                />
              </FormField>

              <FormField label="Email">
                <Input
                  {...register('email')}
                  readOnly={!!user}
                  disabled={!!user}
                  className={cn(
                    user && "bg-gray-50"
                  )}
                  placeholder="email@example.com"
                />
                {user && (
                  <p className="mt-1 text-xs text-gray-500">
                    Email can only be changed in profile settings
                  </p>
                )}
              </FormField>
            </div>

            <FormField label="Role">
              <Select 
                value={watch('role')} 
                onValueChange={(value) => setValue('role', value)}
              >
                <SelectTrigger>
                  {watch('role') === 'admin' ? 'Admin' : 'User'}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Briefcase className="h-4 w-4" />
              Employment Details
            </div>
            
            <div className="space-y-4">
              <FormField label="Employee Type">
                <Select 
                  value={watch('employeeType')} 
                  onValueChange={(value) => setValue('employeeType', value)}
                >
                  <SelectTrigger>
                    {watch('employeeType')?.charAt(0).toUpperCase() + watch('employeeType')?.slice(1) || 'Select Type'}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Overtime">
                <Select 
                  value={watch('overtime')} 
                  onValueChange={(value) => setValue('overtime', value)}
                >
                  <SelectTrigger>
                    {watch('overtime') === 'no' ? 'No Overtime' :
                     watch('overtime') === 'eligible' ? 'Eligible Projects Only' :
                     watch('overtime') === 'all' ? 'All Projects' : 'Select Overtime Type'}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No Overtime</SelectItem>
                    <SelectItem value="eligible">Eligible Projects Only</SelectItem>
                    <SelectItem value="all">All Projects</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </div>

          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Users className="h-4 w-4" />
              Team Assignment
            </div>
            
            <FormField label="Team">
              <Select 
                value={watch('teamId') || 'null'} 
                onValueChange={(value) => setValue('teamId', value)}
              >
                <SelectTrigger>
                  {watch('teamId') ? teams.find(t => t.id === watch('teamId'))?.name : 'Select Team'}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">No Team</SelectItem>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Link className="h-4 w-4" />
              Integration Settings
            </div>
            <FormField label="Xero Employee ID">
              <Input
                {...register('xeroEmployeeId')}
                placeholder="e.g., EMP001"
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)} 
            >
              Cancel
            </Button>
            <Button type="submit">
              {user ? 'Update' : 'Create'} Staff Member
            </Button>
          </div>
        </form>
      </div>
    </SlidePanel>
  );
}