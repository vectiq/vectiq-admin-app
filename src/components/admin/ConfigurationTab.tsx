import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Card } from '@/components/ui/Card';
import { Loader2 } from 'lucide-react';
import type { SystemConfig } from '@/types';

interface ConfigurationTabProps {
  config: SystemConfig;
  isUpdating: boolean;
  onUpdateConfig: (config: SystemConfig) => Promise<void>;
}

export function ConfigurationTab({ 
  config, 
  isUpdating, 
  onUpdateConfig
}: ConfigurationTabProps) {
  const [formState, setFormState] = useState({
    defaultOvertimeType: config.defaultOvertimeType,
    requireApprovalsByDefault: config.requireApprovalsByDefault,
    allowOvertimeByDefault: config.allowOvertimeByDefault,
    defaultBillableStatus: config.defaultBillableStatus,
    enableDebugDrawer: config.enableDebugDrawer || false
  });

  return (
    <Card className="p-6">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await onUpdateConfig({
            defaultHoursPerWeek: Number(e.currentTarget.defaultHoursPerWeek.value),
            defaultOvertimeType: formState.defaultOvertimeType,
            requireApprovalsByDefault: formState.requireApprovalsByDefault,
            allowOvertimeByDefault: formState.allowOvertimeByDefault,
            defaultBillableStatus: formState.defaultBillableStatus,
            enableDebugDrawer: formState.enableDebugDrawer
          });
        }}
        className="space-y-4"
      >
        <FormField label="Default Hours Per Week">
          <Input
            type="number"
            name="defaultHoursPerWeek"
            defaultValue={config.defaultHoursPerWeek}
          />
        </FormField>

        <FormField label="Default Overtime Type">
          <Select
            value={formState.defaultOvertimeType}
            onValueChange={(value) => {
              setFormState(prev => ({ ...prev, defaultOvertimeType: value }));
            }}
          >
            <SelectTrigger>
              {formState.defaultOvertimeType === 'no' ? 'No Overtime' :
               formState.defaultOvertimeType === 'eligible' ? 'Eligible Projects Only' :
               'All Projects'}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no">No Overtime</SelectItem>
              <SelectItem value="eligible">Eligible Projects Only</SelectItem>
              <SelectItem value="all">All Projects</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <div className="space-y-4 pt-4">
          <Checkbox
            name="requireApprovalsByDefault"
            checked={formState.requireApprovalsByDefault}
            onCheckedChange={(checked: boolean) => {
              setFormState(prev => ({ ...prev, requireApprovalsByDefault: checked }));
            }}
            label="Require approvals by default for new projects"
          />

          <Checkbox
            name="allowOvertimeByDefault"
            checked={formState.allowOvertimeByDefault}
            onCheckedChange={(checked: boolean) => {
              setFormState(prev => ({ ...prev, allowOvertimeByDefault: checked }));
            }}
            label="Allow overtime by default for new projects"
          />

          <Checkbox
            name="defaultBillableStatus"
            checked={formState.defaultBillableStatus}
            onCheckedChange={(checked: boolean) => {
              setFormState(prev => ({ ...prev, defaultBillableStatus: checked }));
            }}
            label="Set tasks as billable by default"
          />

          <Checkbox
            name="enableDebugDrawer"
            checked={formState.enableDebugDrawer}
            onCheckedChange={(checked: boolean) => {
              setFormState(prev => ({ ...prev, enableDebugDrawer: checked }));
            }}
            label="Enable Debug Drawer"
          />
        </div>

        <div className="pt-4 border-t">
          <Button type="submit" disabled={isUpdating}>
            {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Configuration
          </Button>
        </div>
      </form>
    </Card>
  );
}