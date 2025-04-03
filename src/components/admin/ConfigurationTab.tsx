import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Card } from '@/components/ui/Card';
import { Loader2, X } from 'lucide-react';
import { useClients } from '@/lib/hooks/useClients';
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
    enableDebugDrawer: config.enableDebugDrawer || false,
    hiddenClientsInInvoicing: config.hiddenClientsInInvoicing || []
  });
  const { clients } = useClients();
  const [selectedClient, setSelectedClient] = useState<string>('');

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
            enableDebugDrawer: formState.enableDebugDrawer,
            hiddenClientsInInvoicing: formState.hiddenClientsInInvoicing
          });
        }}
        className="space-y-4"
      >
        <FormField label="Default Hours Per Week">
          <Input
            type="number"
            name="defaultHoursPerWeek"
            defaultValue={config.defaultHoursPerWeek}
            min="1"
            max="168"
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

        <div className="space-y-4 pt-4">
          <h3 className="text-sm font-medium text-gray-700">Hidden Clients in Invoicing</h3>
          <div className="flex gap-3">
            <div className="flex-1">
              <Select
                value={selectedClient}
                onValueChange={setSelectedClient}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client to hide" />
                </SelectTrigger>
                <SelectContent>
                  {clients
                    .filter(client => !formState.hiddenClientsInInvoicing.includes(client.id))
                    .map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              type="button" 
              onClick={() => {
                if (selectedClient) {
                  setFormState(prev => ({
                    ...prev,
                    hiddenClientsInInvoicing: [...prev.hiddenClientsInInvoicing, selectedClient]
                  }));
                  setSelectedClient('');
                }
              }}
              disabled={!selectedClient}
            >
              Add
            </Button>
          </div>
          
          {formState.hiddenClientsInInvoicing.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {formState.hiddenClientsInInvoicing.map(clientId => {
                const client = clients.find(c => c.id === clientId);
                return (
                  <div 
                    key={clientId}
                    className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md text-sm"
                  >
                    <span>{client?.name || 'Unknown Client'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormState(prev => ({
                          ...prev,
                          hiddenClientsInInvoicing: prev.hiddenClientsInInvoicing.filter(id => id !== clientId)
                        }));
                      }}
                      className="text-gray-500 hover:text-red-500 p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Clients added to this list will be hidden from the invoicing table
          </p>
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