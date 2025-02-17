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

export interface ForecastOverride {
  value: number;
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  managerId: string;
  xeroTrackingCategoryId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface XeroConfig {
  clientId: string;
  tenantId: string;
  redirectUri: string;
  businessUnitTrackingCategoryId?: string;
  overtimePayItemCode: string;
  ordinaryHoursEarningsId: string;
  scopes: string[];
}