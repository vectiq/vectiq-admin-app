import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/currency';
import type { ReportSummary as ReportSummaryType } from '@/types';

interface ReportSummaryProps {
  data?: ReportSummaryType;
}

export function ReportSummary({ data }: ReportSummaryProps) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-4 gap-4">
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">Total Hours</h3>
        <p className="mt-2 text-3xl font-semibold text-gray-900">{data.totalHours}</p>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">Total Cost</h3>
        <p className="mt-2 text-3xl font-semibold text-gray-900">{formatCurrency(data.totalCost)}</p>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
        <p className="mt-2 text-3xl font-semibold text-gray-900">{formatCurrency(data.totalRevenue)}</p>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">Profit Margin</h3>
        <p className="mt-2 text-3xl font-semibold text-gray-900">{data.profitMargin}%</p>
      </Card>
    </div>
  );
}