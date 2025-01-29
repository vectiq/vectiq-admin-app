import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useUsers } from '@/lib/hooks/useUsers';
import { SlidePanel } from '@/components/ui/SlidePanel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/Select';
import { Users } from 'lucide-react';
import type { Team } from '@/types';

interface TeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team?: Team | null;
  onSubmit: (data: Team) => void;
}

export function TeamDialog({
  open,
  onOpenChange,
  team,
  onSubmit,
}: TeamDialogProps) {
  const { users } = useUsers();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
  } = useForm({
    defaultValues: team || {
      name: '',
      managerId: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset(team || {
        name: '',
        managerId: '',
      });
    }
  }, [open, team, reset]);

  const handleFormSubmit = async (data: any) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <SlidePanel
      open={open}
      onClose={() => onOpenChange(false)}
      title={team ? 'Edit Team' : 'New Team'}
      icon={<Users className="h-5 w-5 text-indigo-500" />}
    >
      <div className="p-6">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <FormField label="Team Name">
            <Input
              {...register('name')}
              placeholder="Enter team name"
            />
          </FormField>

          <FormField label="Team Manager">
            <Select
              value={watch('managerId')}
              onValueChange={(value) => setValue('managerId', value)}
            >
              <SelectTrigger>
                {watch('managerId') ? users.find(u => u.id === watch('managerId'))?.name : 'Select Manager'}
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="flex justify-end gap-3 pt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {team ? 'Update' : 'Create'} Team
            </Button>
          </div>
        </form>
      </div>
    </SlidePanel>
  );
}