import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Card } from '@/components/ui/Card';
import { ExternalLink } from 'lucide-react';
import type { XeroConfig, XeroPayItem } from '@/types';

interface IntegrationsTabProps {
  xeroConfig: XeroConfig;
  isUpdatingXero: boolean;
  onUpdateXeroConfig: (config: XeroConfig) => Promise<void>;
}

// Complete list of Xero OAuth2 scopes
// https://developer.xero.com/documentation/oauth2/scopes
const XERO_SCOPES = [
  { value: 'openid', category: 'Authentication', description: 'OpenID Connect authentication' },
  { value: 'profile', category: 'Authentication', description: 'User profile information' },
  { value: 'email', category: 'Authentication', description: 'User email address' },
  { value: 'offline_access', category: 'Authentication', description: 'Refresh token access' },
  // Accounting API
  { value: 'accounting.transactions', category: 'Accounting', description: 'Read and write transactions' },
  { value: 'accounting.transactions.read', category: 'Accounting', description: 'Read transactions' },
  { value: 'accounting.settings', category: 'Accounting', description: 'Read and write accounting settings' },
  { value: 'accounting.settings.read', category: 'Accounting', description: 'Read accounting settings' },
  { value: 'accounting.contacts', category: 'Accounting', description: 'Read and write contacts' },
  { value: 'accounting.contacts.read', category: 'Accounting', description: 'Read contacts' },
  { value: 'accounting.attachments', category: 'Accounting', description: 'Read and write attachments' },
  { value: 'accounting.attachments.read', category: 'Accounting', description: 'Read attachments' },
  { value: 'accounting.reports.read', category: 'Accounting', description: 'Read reports' },
  // Payroll API
  { value: 'payroll.employees', category: 'Payroll', description: 'Read and write employee data' },
  { value: 'payroll.employees.read', category: 'Payroll', description: 'Read employee data' },
  { value: 'payroll.payruns', category: 'Payroll', description: 'Read and write pay runs' },
  { value: 'payroll.payruns.read', category: 'Payroll', description: 'Read pay runs' },
  { value: 'payroll.payslip', category: 'Payroll', description: 'Read and write payslips' },
  { value: 'payroll.payslip.read', category: 'Payroll', description: 'Read payslips' },
  { value: 'payroll.settings', category: 'Payroll', description: 'Read and write payroll settings' },
  { value: 'payroll.settings.read', category: 'Payroll', description: 'Read payroll settings' },
  // Projects API
  { value: 'projects', category: 'Projects', description: 'Read and write project data' },
  { value: 'projects.read', category: 'Projects', description: 'Read project data' },
  // Files API
  { value: 'files', category: 'Files', description: 'Read and write files' },
  { value: 'files.read', category: 'Files', description: 'Read files' },
  // Assets API
  { value: 'assets', category: 'Assets', description: 'Read and write fixed assets' },
  { value: 'assets.read', category: 'Assets', description: 'Read fixed assets' },
];

export function IntegrationsTab({
  xeroConfig,
  isUpdatingXero,
  onUpdateXeroConfig
}: IntegrationsTabProps) {
  const payItems = xeroConfig?.payItems || [];

  const handleAuthorize = () => {
    if (!xeroConfig?.clientId || !xeroConfig?.redirectUri) return;

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: xeroConfig.clientId,
      redirect_uri: xeroConfig.redirectUri,
      scope: (xeroConfig.scopes || []).join(' '),
      state: '123'
    });

    const url = `https://login.xero.com/identity/connect/authorize?${params.toString()}`;
    window.open(url, '_blank');
  };

  // Group scopes by category
  const scopesByCategory = XERO_SCOPES.reduce((acc, scope) => {
    if (!acc[scope.category]) {
      acc[scope.category] = [];
    }
    acc[scope.category].push(scope);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Card className="divide-y divide-gray-200">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Xero Integration</h3>
              <p className="mt-1 text-sm text-gray-500">
                Connect your Xero account to sync timesheets and invoices
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <FormField label="Client ID">
              <Input
                type="text"
                value={xeroConfig?.clientId || ''}
                onChange={(e) => onUpdateXeroConfig({
                  ...xeroConfig,
                  clientId: e.target.value
                })}
                placeholder="e.g., B98EF7DAF2BA4374B360D2946577C80A"
              />
            </FormField>

            <FormField label="Redirect URI">
              <Input
                type="url"
                value={xeroConfig?.redirectUri || ''}
                onChange={(e) => onUpdateXeroConfig({
                  ...xeroConfig,
                  redirectUri: e.target.value
                })}
                placeholder="e.g., https://us-central1-your-project.cloudfunctions.net/exchangeXeroCode"
              />
            </FormField>

            <FormField label="Tenant ID">
              <Input
                value={xeroConfig?.tenantId || ''}
                onChange={(e) => onUpdateXeroConfig({
                  ...xeroConfig,
                  tenantId: e.target.value
                })}
                placeholder="e.g., 4ff1e5cc-9835-40d5-bb18-09fdb118db9c"
              />
              <p className="mt-1 text-xs text-gray-500">
                The tenant ID is used to identify your Xero organization when making API calls
              </p>
            </FormField>

            <FormField label="Business Unit Tracking Category ID">
              <Input
                value={xeroConfig?.businessUnitTrackingCategoryId || ''}
                onChange={(e) => onUpdateXeroConfig({
                  ...xeroConfig,
                  businessUnitTrackingCategoryId: e.target.value
                })}
                placeholder="e.g., 00000000-0000-0000-0000-000000000000"
              />
              <p className="mt-1 text-xs text-gray-500">
                The Xero tracking category ID used for business unit tracking
              </p>
            </FormField>

            <FormField label="Ordinary Hours Earnings ID">
              <Select
                value={xeroConfig?.ordinaryHoursEarningsId || ''}
                onValueChange={(value) => onUpdateXeroConfig({
                  ...xeroConfig,
                  ordinaryHoursEarningsId: value
                })}
              >
                <SelectTrigger>
                  {payItems.find(item => item.EarningsRateID === xeroConfig?.ordinaryHoursEarningsId)?.Name || 'Select Ordinary Hours Rate'}
                </SelectTrigger>
                <SelectContent>
                  {payItems
                    .map(item => (
                      <SelectItem key={item.EarningsRateID} value={item.EarningsRateID}>
                        {item.Name} ({item.EarningsType})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-gray-500">
                The Xero earnings rate ID to use for ordinary hours
              </p>
            </FormField>

            <FormField label="Overtime Pay Item Code">
              <Select
                value={xeroConfig?.overtimePayItemCode || ''}
                onValueChange={(value) => onUpdateXeroConfig({
                  ...xeroConfig,
                  overtimePayItemCode: value
                })}
              >
                <SelectTrigger>
                  {payItems.find(item => item.EarningsRateID === xeroConfig?.overtimePayItemCode)?.Name || 'Select Overtime Rate'}
                </SelectTrigger>
                <SelectContent>
                  {payItems
                    .map(item => (
                      <SelectItem key={item.EarningsRateID} value={item.EarningsRateID}>
                        {item.Name} ({item.EarningsType})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-gray-500">
                The Xero pay item code to use when submitting overtime entries
              </p>
            </FormField>

            <FormField label="Scopes">
              <div className="border rounded-md divide-y divide-gray-200">
                {Object.entries(scopesByCategory).map(([category, scopes]) => (
                  <fieldset key={category} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <legend className="text-sm font-medium text-gray-900">{category}</legend>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          const categoryScopes = scopes.map(s => s.value);
                          const currentScopes = xeroConfig?.scopes || [];
                          const allSelected = categoryScopes.every(s => currentScopes.includes(s));
                          
                          const newScopes = allSelected
                            ? currentScopes.filter(s => !categoryScopes.includes(s))
                            : [...new Set([...currentScopes, ...categoryScopes])];
                          
                          onUpdateXeroConfig({
                            ...xeroConfig,
                            scopes: newScopes
                          });
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-500"
                      >
                        {scopes.every(s => (xeroConfig?.scopes || []).includes(s.value))
                          ? 'Deselect All'
                          : 'Select All'}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {scopes.map(scope => (
                        <label
                          key={scope.value}
                          className="flex items-start gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-md"
                        >
                          <Checkbox
                            checked={(xeroConfig?.scopes || []).includes(scope.value)}
                            onCheckedChange={(checked) => {
                              const currentScopes = xeroConfig?.scopes || [];
                              const newScopes = checked
                                ? [...currentScopes, scope.value]
                                : currentScopes.filter(s => s !== scope.value);
                              onUpdateXeroConfig({
                                ...xeroConfig,
                                scopes: newScopes
                              });
                            }}
                          />
                          <div className="flex-1">
                            <div className="font-mono text-sm">{scope.value}</div>
                            <div className="text-xs text-gray-500">{scope.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>
            </FormField>

            <div className="pt-4 border-t">
              <Button
                onClick={handleAuthorize}
                disabled={!xeroConfig?.clientId || !xeroConfig?.redirectUri || !xeroConfig?.scopes?.length}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Authorize with Xero
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}