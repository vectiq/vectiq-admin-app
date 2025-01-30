import { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import type { ReportEntry } from '@/types';
import { FilterMatchMode } from 'primereact/api';
import { Calendar } from 'primereact/calendar';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

interface ReportTableProps {
  data?: ReportEntry[];
  approvals?: any[];
}

const approvalStatuses = [
  'Approval Not Required',
  'Approved',
  'Pending',
  'No Approval',
  'Rejected'
];

export function ReportTable({ data = [], approvals = [] }: ReportTableProps) {
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    date: { value: null, matchMode: FilterMatchMode.DATE_IS },
    userName: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    clientName: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    projectName: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    taskName: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    approvalStatus: { value: null, matchMode: FilterMatchMode.EQUALS }
  });
  const [globalFilterValue, setGlobalFilterValue] = useState('');

  const dateFilterTemplate = (options: any) => {
    return (
      <Calendar
        value={options.value}
        onChange={(e) => options.filterCallback(e.value)}
        dateFormat="yy-mm-dd"
        placeholder="Select Date"
        className="p-column-filter w-full"
      />
    );
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters.global.value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Search..."
            className="p-2 border rounded-md"
          />
        </span>
      </div>
    );
  };

  const approvalStatusBodyTemplate = (rowData: ReportEntry) => {
    return (
      <Badge
        variant={
          rowData.approvalStatus === 'Approval Not Required' ? 'secondary' :
          rowData.approvalStatus === 'Approved' ? 'success' :
          rowData.approvalStatus === 'No Approval' ? 'warning' :
          rowData.approvalStatus === 'Pending' ? 'warning' :
          rowData.approvalStatus === 'Rejected' ? 'destructive' :
          'default'
        }
      >
        {rowData.approvalStatus}
      </Badge>
    );
  };

  const approvalStatusFilterTemplate = (options: any) => {
    return (
      <Dropdown
        value={options.value}
        options={approvalStatuses}
        onChange={(e) => options.filterCallback(e.value)}
        placeholder="Select Status"
        className="p-column-filter w-full"
        showClear
      />
    );
  };

  const textFilterTemplate = (options: any) => {
    return (
      <InputText
        value={options.value || ''}
        onChange={(e) => options.filterCallback(e.target.value)}
        placeholder="Search"
        className="p-column-filter w-full"
      />
    );
  };

  const currencyBodyTemplate = (rowData: ReportEntry, field: keyof ReportEntry) => {
    return formatCurrency(rowData[field] as number);
  };

  const dateBodyTemplate = (rowData: ReportEntry) => {
    return formatDate(rowData.date);
  };

  const hoursBodyTemplate = (rowData: ReportEntry) => {
    return rowData.hours.toFixed(2);
  };

  return (
    <div>
      <DataTable
        value={data}
        paginator
        rows={25}
        rowsPerPageOptions={[25, 50, 100]}
        dataKey="id"
        filters={filters}
        filterDisplay="menu"
        loading={false}
        globalFilterFields={['userName', 'clientName', 'projectName', 'taskName']}
        header={renderHeader()}
        emptyMessage="No data found."
        removableSort
        sortMode="single"
        sortField="date"
        showGridlines
        stripedRows
        className="p-datatable-sm [&_.p-datatable-tbody>tr>td]:transition-none [&_.p-inputtext::placeholder]:font-normal [&_.p-inputtext::placeholder]:text-gray-400"
        tableStyle={{ minWidth: '50rem' }}
      >
        <Column 
          field="date" 
          header="Date" 
          sortable 
          filter
          filterElement={dateFilterTemplate}
          showFilterMenu={false}
          body={dateBodyTemplate}
          style={{ width: '10%' }}
        />
        <Column 
          field="userName" 
          header="User" 
          sortable 
          filter
          filterElement={textFilterTemplate}
          showFilterMenu={false}
          style={{ width: '12%' }}
        />
        <Column 
          field="clientName" 
          header="Client" 
          sortable 
          filter
          filterElement={textFilterTemplate}
          showFilterMenu={false}
          style={{ width: '12%' }}
        />
        <Column 
          field="projectName" 
          header="Project" 
          sortable 
          filter
          filterElement={textFilterTemplate}
          showFilterMenu={false}
          style={{ width: '12%' }}
        />
        <Column 
          field="taskName" 
          header="Task" 
          sortable 
          filter
          filterElement={textFilterTemplate}
          showFilterMenu={false}
          style={{ width: '12%' }}
        />
        <Column 
          field="approvalStatus" 
          header="Status" 
          sortable 
          filter
          filterElement={approvalStatusFilterTemplate}
          showFilterMenu={true}
          filterMenuStyle={{ width: '20rem' }}
          body={approvalStatusBodyTemplate}
          style={{ width: '12%' }}
        />
        <Column 
          field="hours" 
          header="Hours" 
          sortable 
          body={hoursBodyTemplate}
          style={{ width: '8%', textAlign: 'right' }}
        />
        <Column 
          field="cost" 
          header="Cost" 
          sortable 
          body={(rowData) => currencyBodyTemplate(rowData, 'cost')}
          style={{ width: '8%', textAlign: 'right' }}
        />
        <Column 
          field="revenue" 
          header="Revenue" 
          sortable 
          body={(rowData) => currencyBodyTemplate(rowData, 'revenue')}
          style={{ width: '8%', textAlign: 'right' }}
        />
        <Column 
          field="profit" 
          header="Profit" 
          sortable 
          body={(rowData) => currencyBodyTemplate(rowData, 'profit')}
          style={{ width: '8%', textAlign: 'right' }}
        />
      </DataTable>

      {/* Debug Box */}
      {approvals.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Debug: Approval Records</h3>
          <div className="space-y-2">
            {approvals.map(approval => (
              <div key={approval.id} className="text-sm">
                <div className="font-medium">{approval.project?.name}</div>
                <div className="text-gray-500">
                  Status: {approval.status} • Period: {formatDate(approval.startDate)} - {formatDate(approval.endDate)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}