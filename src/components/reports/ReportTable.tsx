import { useState, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import type { ReportEntry } from '@/types';
import { FilterMatchMode } from 'primereact/api';
import { Button } from '@/components/ui/Button';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Calendar } from 'primereact/calendar';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

interface ReportTableProps {
  data?: ReportEntry[];
  onExport?: () => void;
}

const approvalStatuses = [
  'Approval Not Required',
  'Approved',
  'Pending',
  'No Approval',
  'Rejected'
];

export function ReportTable({ data = [] }: ReportTableProps) {
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
  const [filteredData, setFilteredData] = useState<ReportEntry[]>(data);

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title and company logo
    // Add title
    doc.setFontSize(16);
    doc.text('Time Report', 14, 15);
    
    // Add date range and filters
    doc.setFontSize(12);
    if (filteredData.length > 0) {
      const dates = filteredData.map(entry => new Date(entry.date));
      const startDate = formatDate(Math.min(...dates.map(d => d.getTime())));
      const endDate = formatDate(Math.max(...dates.map(d => d.getTime())));
      doc.text(`Period: ${startDate} - ${endDate}`, 14, 25);

      // Add active filters
      let filterText = '';
      if (filters.userName?.value) filterText += `User: ${filters.userName.value}, `;
      if (filters.clientName?.value) filterText += `Client: ${filters.clientName.value}, `;
      if (filters.projectName?.value) filterText += `Project: ${filters.projectName.value}, `;
      if (filters.approvalStatus?.value) filterText += `Status: ${filters.approvalStatus.value}`;
      
      if (filterText) {
        doc.setFontSize(10);
        doc.text(`Filters: ${filterText.replace(/,\s*$/, '')}`, 14, 32);
      }
    }

    // Calculate and add summary
    const summary = filteredData.reduce((acc, entry) => ({
      totalHours: acc.totalHours + entry.hours,
      totalRevenue: acc.totalRevenue + entry.revenue,
      totalCost: acc.totalCost + entry.cost,
      totalProfit: acc.totalProfit + entry.profit
    }), { totalHours: 0, totalRevenue: 0, totalCost: 0, totalProfit: 0 });

    const summaryY = filterText ? 42 : 35;
    doc.setFontSize(11);
    doc.text('Summary', 14, summaryY);
    doc.setFontSize(10);
    doc.text(`Total Hours: ${summary.totalHours.toFixed(2)}`, 14, 35);
    doc.text(`Total Revenue: ${formatCurrency(summary.totalRevenue)}`, 14, 42);
    doc.text(`Total Cost: ${formatCurrency(summary.totalCost)}`, 14, 49);
    doc.text(`Total Profit: ${formatCurrency(summary.totalProfit)}`, 14, 56);

    // Add detailed table
    const tableY = summaryY + 45;
    (doc as any).autoTable({
      startY: tableY,
      head: [[
        'Date',
        'User',
        'Client',
        'Project',
        'Task',
        'Status',
        'Hours',
        'Revenue',
        'Cost',
        'Profit'
      ]],
      body: filteredData.map(entry => [
        formatDate(entry.date),
        entry.userName,
        entry.clientName,
        entry.projectName,
        entry.taskName,
        entry.approvalStatus,
        entry.hours.toFixed(2),
        formatCurrency(entry.revenue),
        formatCurrency(entry.cost),
        formatCurrency(entry.profit)
      ]),
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241] },
      styles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 247, 251] },
      columnStyles: {
        6: { halign: 'right' },
        7: { halign: 'right' },
        8: { halign: 'right' },
        9: { halign: 'right' }
      },
      footStyles: { 
        fillColor: [99, 102, 241],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      foot: [[
        'Total',
        '',
        '',
        '',
        '',
        '',
        summary.totalHours.toFixed(2),
        formatCurrency(summary.totalRevenue),
        formatCurrency(summary.totalCost),
        formatCurrency(summary.totalProfit)
      ]],
      didDrawPage: function(data: any) {
        // Add page number at the bottom
        const str = `Page ${data.pageCount}`;
        doc.setFontSize(8);
        doc.text(str, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10);
      }
    });

    // Save the PDF
    const fileName = `time-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    doc.save(fileName);
  };

  // Group entries by date
  const groupedData = useMemo(() => {
    return data.reduce((acc, entry) => {
      const date = entry.date;
      if (!acc[date]) {
        acc[date] = { date, totalHours: 0, totalRevenue: 0 };
      }
      acc[date].totalHours += entry.hours || 0;
      acc[date].totalRevenue += entry.revenue || 0;
      return acc;
    }, {} as Record<string, { date: string; totalHours: number; totalRevenue: number }>);
  }, [data]);

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

  const onFilter = (e: any) => {
    setFilteredData(e.filteredValue || []);
  };

  const renderHeader = () => {
    return (
      <div className="flex items-center">
        <div className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Search..."
            className="p-2 border rounded-md"
          />
        </div>
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
    return rowData?.hours?.toFixed(2) || '0.00';
  };

  const rowGroupHeaderTemplate = (data: any) => (
    <div className="flex items-center justify-between py-2 px-4 bg-gray-50/80">
      <div className="font-medium">{formatDate(data.date)}</div>
      <div className="text-sm text-gray-600">
        {`${groupedData[data.date].totalHours.toFixed(2)} hours • ${formatCurrency(groupedData[data.date].totalRevenue)}`}
      </div>
    </div>
  );

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
        sortField="date"
        sortOrder={1}
        header={renderHeader()}
        emptyMessage="No data found."
        removableSort
        sortMode="single"
        showGridlines
        stripedRows
        className="p-datatable-sm [&_.p-datatable-tbody>tr>td]:transition-none [&_.p-inputtext::placeholder]:font-normal [&_.p-inputtext::placeholder]:text-gray-400"
        onFilter={onFilter}
        rowGroupMode="subheader"
        groupRowsBy="date"
        rowGroupHeaderTemplate={rowGroupHeaderTemplate}
        tableStyle={{ minWidth: '50rem' }}
      >
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
    </div>
  );
}