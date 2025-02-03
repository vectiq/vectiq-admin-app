import { Edit, Trash2, Calculator } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils/currency';
import { useProjects } from '@/lib/hooks/useProjects';
import { getCostRateForMonth, getAverageSellRate } from '@/lib/utils/rates';
import type { User } from '@/types';
import { useMemo } from 'react';
import { cn } from '@/lib/utils/styles';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

interface UsersTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onManageRates: (user: User) => void;
  onDelete: (id: string) => void;
}

export function UsersTable({ 
  users, 
  onEdit, 
  onManageRates,
  onDelete,
}: UsersTableProps) {
  const { projects } = useProjects();

  const processedUsers = useMemo(() => {
    return users.map(user => {
      const currentDate = new Date();
      const currentMonth = format(currentDate, 'yyyy-MM');
      const costRate = getCostRateForMonth(user.costRate || [], currentMonth);
      const sellRate = getAverageSellRate(projects, user.id, currentMonth + '-01');

      return {
        ...user,
        costRate,
        sellRate
      };
    });
  }, [users, projects]);

  const nameBodyTemplate = (user: User) => (
    <div className={cn(
      "font-medium text-gray-900",
      user.isPotential && "bg-amber-50/50 rounded-lg px-2 py-1"
    )}>
      <div className="flex items-center gap-2">
        <span>{user.name}</span>
        {user.isPotential && (
          <Badge variant="warning">Potential</Badge>
        )}
      </div>
    </div>
  );

  const billablePercentageBodyTemplate = (user: User) => (
    user.estimatedBillablePercentage ? (
      <Badge variant="secondary">
        {user.estimatedBillablePercentage}%
      </Badge>
    ) : (
      <span className="text-gray-500">-</span>
    )
  );

  const costRateBodyTemplate = (user: any) => (
    <span>{formatCurrency(user.costRate)}/hr</span>
  );

  const sellRateBodyTemplate = (user: any) => (
    <span>{formatCurrency(user.sellRate)}/hr</span>
  );

  const overtimeBodyTemplate = (user: User) => (
    <Badge variant="secondary">
      {user.overtime === 'no' ? 'No Overtime' : 
       user.overtime === 'billable' ? 'Billable Only' : 
       'All Hours'}
    </Badge>
  );

  const roleBodyTemplate = (user: User) => (
    <Badge variant={user.role === 'admin' ? 'warning' : 'secondary'}>
      {user.role}
    </Badge>
  );

  const actionsBodyTemplate = (user: User) => (
    <div className="flex justify-end gap-2">
      <Button variant="secondary" size="sm" onClick={() => onManageRates(user)}>
        <Calculator className="h-4 w-4" />
      </Button>
      <Button variant="secondary" size="sm" onClick={() => onEdit(user)}>
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="secondary" size="sm" onClick={() => onDelete(user.id)}>
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );

  return (
    <DataTable 
      value={processedUsers}
      paginator 
      rows={20}
      rowsPerPageOptions={[20, 50, 100]}
      sortMode="multiple"
      removableSort
      showGridlines
      stripedRows
      className="p-datatable-sm [&_.p-datatable-tbody>tr>td]:transition-none"
      emptyMessage="No users found"
    >
      <Column field="name" header="Name" body={nameBodyTemplate} sortable />
      <Column field="hoursPerWeek" header="Hours/Week" sortable />
      <Column 
        field="estimatedBillablePercentage" 
        header="Target Billable %" 
        body={billablePercentageBodyTemplate}
        sortable 
      />
      <Column 
        field="costRate" 
        header="Cost Rate" 
        body={costRateBodyTemplate}
        sortable 
      />
      <Column 
        field="sellRate" 
        header="Sell Rate" 
        body={sellRateBodyTemplate}
        sortable 
      />
      <Column 
        field="overtime" 
        header="Overtime" 
        body={overtimeBodyTemplate}
        sortable 
      />
      <Column 
        field="role" 
        header="Role" 
        body={roleBodyTemplate}
        sortable 
      />
      <Column 
        body={actionsBodyTemplate} 
        header="Actions" 
        style={{ width: '150px' }}
      />
    </DataTable>
  );
}