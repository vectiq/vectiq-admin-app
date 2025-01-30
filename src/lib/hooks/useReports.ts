import { useQuery } from '@tanstack/react-query';
import { generateReport, submitOvertime, checkOvertimeSubmission } from '@/lib/services/reports';
import type { ReportFilters } from '@/types';

export function useReports(filters: ReportFilters) {
  return useQuery({
    queryKey: ['reports', filters],
    queryFn: () => generateReport(filters),
  });
}

export { submitOvertime, checkOvertimeSubmission };