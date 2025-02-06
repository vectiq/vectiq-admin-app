export interface ReportFilters {
  type?: 'time' | 'overtime';
  startDate: string;
  endDate: string;
  userId?: string;
  projectId?: string;
  clientIds: string[];
  projectIds: string[];
  taskIds: string[];
  teamId?: string;
}