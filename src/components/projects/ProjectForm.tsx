import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { FormField } from '@/components/ui/FormField';
import { format, parse } from 'date-fns';
import { useClients } from '@/lib/hooks/useClients';
import type { Project, ProjectTask } from '@/types';

interface ProjectFormProps {
  project?: Project | null;
  onSubmit: (data: Project) => void;
  onCancel: () => void;
}

export function ProjectForm({ project, onSubmit, onCancel }: ProjectFormProps) {
  const { clients } = useClients();

  // Initialize form with project data or defaults
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
  } = useForm({
    defaultValues: project || {
      name: '',
      clientId: '', 
      xeroContactId: '',
      purchaseOrderNumber: '',
      xeroProjectId: '',
      approverEmail: '',
      budget: 0,
      startDate: '',
      endDate: '',
      requiresApproval: false,
      overtimeInclusive: true,
      isActive: true,
      xeroLeaveTypeId: '',
    },
    shouldUnregister: false, // Prevent fields from being unregistered when removed
  });

  useEffect(() => {
    if (project) {
      reset(project);
    }
  }, [project, reset]);

  // Format dates when loading project data
  useEffect(() => {
    if (project) {
      if (project.startDate) {
        setValue('startDate', format(new Date(project.startDate), 'yyyy-MM-dd'));
      }
      if (project.endDate) {
        setValue('endDate', format(new Date(project.endDate), 'yyyy-MM-dd'));
      }
    }
  }, [project, setValue]);

  const handleFormSubmit = async (data: any) => {
    const projectId = project?.id || crypto.randomUUID();
    const projectData: Project = {
      id: projectId,
      name: data.name || '',
      clientId: data.clientId || '',
      purchaseOrderNumber: data.purchaseOrderNumber || '',
      xeroProjectId: data.xeroProjectId || '',
      xeroContactId: data.xeroContactId || '',
      budget: data.budget || 0,
      startDate: data.startDate || '',
      endDate: data.endDate || '',
      approverEmail: data.approverEmail || '',
      requiresApproval: data.requiresApproval || false,
      overtimeInclusive: data.overtimeInclusive || false,
      tasks: project?.tasks || []
    };
    
    try {
      await onSubmit(projectData);
    } catch (error) {
      console.error('Error submitting project:', error);
      throw error;
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Project Name">
          <Input
            {...register('name')}
            placeholder="e.g., Website Redesign"
          />
          </FormField>

          <FormField label="Client">
            <Select
              value={watch('clientId')}
              onValueChange={(value) => {
                setValue('clientId', value);
                // Reset dependent fields
                setValue('projectId', '');
                setValue('taskId', '');
              }}
            >
              <SelectTrigger>
                {watch('clientId') ? clients.find(c => c.id === watch('clientId'))?.name : 'Select Client'}
              </SelectTrigger>
              <SelectContent>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        <FormField label="Xero Contact ID">
          <Input
            {...register('xeroContactId')}
            placeholder="e.g., 00000000-0000-0000-0000-000000000000"
          />
          <p className="mt-1 text-xs text-gray-500">
            The Xero contact ID for invoice generation
          </p>
        </FormField>

        <FormField label="Purchase Order Number">
          <Input
            {...register('purchaseOrderNumber')}
            placeholder="e.g., PO-2024-001"
          />
          <p className="mt-1 text-xs text-gray-500">
            The purchase order number for this project
          </p>
        </FormField>

        <div className="grid grid-cols-3 gap-4">
          <FormField label="Budget">
            <Input
              type="number"
              step="0.01"
              {...register('budget', { valueAsNumber: true })}
            />
          </FormField>

          <FormField label="Start Date">
            <Input
              type="date"
              className="[&::-webkit-calendar-picker-indicator]:opacity-100"
              {...register('startDate')}
            />
          </FormField>

          <FormField label="End Date">
            <Input
              type="date"
              className="[&::-webkit-calendar-picker-indicator]:opacity-100"
              {...register('endDate')}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Approver Email">
            <Input
              type="email"
              {...register('approverEmail')}
              placeholder="e.g., approver@company.com"
            />
          </FormField>

          <div className="flex gap-6 items-center mt-8">
            <Checkbox
              {...register('requiresApproval')}
              label="Require approval"
            />
            <Checkbox
              {...register('overtimeInclusive')}
              label="Include overtime"
            />
          </div>
        </div>
        <div className="flex gap-6 items-center">
          <Checkbox
            {...register('isActive')}
            label="Project is active"
          />
        </div>

      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {project ? 'Update' : 'Create'} Project
        </Button>
      </div>
    </form>
  );
}