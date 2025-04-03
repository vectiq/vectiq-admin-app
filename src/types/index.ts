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

export interface Task {
  id: string;
  name: string;
  isActive: boolean;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface SalaryItem {
  salary: number;
  date: string;
}

export interface CostRate {
  costRate: number;
  date: string;
}

export interface ProjectAssignment {
  id: string;
  userId: string;
  userName: string;
  taskId: string;
  taskName: string;
  hours: number;
  approvalStatus: string;
  isActive: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  employeeType: 'employee' | 'contractor' | 'company';
  teamId?: string;
  xeroEmployeeId?: string;
  xeroPayCalendarId?: string;
  startDate: string;
  endDate?: string;
  isPotential?: boolean;
  isActive?: boolean;
  hoursPerWeek?: number;
  estimatedBillablePercentage?: number;
  salary?: SalaryItem[];
  costRate?: CostRate[];
  overtime: 'no' | 'eligible' | 'all';
  projectAssignments: ProjectAssignment[];
  createdAt?: any;
  updatedAt?: any;
}

export interface Note {
  id: string;
  text: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectProcessingNote {
  projectId: string;
  month: string;
  notes: Note[];
}

export interface MonthlyProcessingNote {
  month: string;
  notes: Note[];
}

export interface Leave {
  employeeId: string;
  startDate: string;
  endDate: string;
  status: string;
  numberOfUnits: number;
}

export interface LeaveBalance {
  employeeId: string;
  leaveTypeId: string;
  balance: number;
}

export interface Bonus {
  id: string;
  employeeId: string;
  teamId?: string;
  date: string;
  amount: number;
  kpis?: string;
  paid: boolean;
  xeroPayRunId?: string;
  xeroPayItemId?: string;
  paidAt?: any;
  createdAt?: any;
  updatedAt?: any;
}

export interface PublicHoliday {
  id: string;
  name: string;
  date: string;
  createdAt?: any;
}

export interface SystemConfig {
  defaultHoursPerWeek: number;
  defaultOvertimeType: 'no' | 'eligible' | 'all';
  requireApprovalsByDefault: boolean;
  allowOvertimeByDefault: boolean;
  defaultBillableStatus: boolean;
  payrollTaxPercentage?: number;
  payrollTaxFreeThreshold?: number;
  insurancePercentage?: number;
  superannuationPercentage?: number;
  costRateFormula?: string;
  enableDebugDrawer?: boolean;
}

export interface AdminStats {
  totalUsers: number;
  totalProjects: number;
  totalHoursThisMonth: number;
  totalBillableHours: number;
  averageUtilization: number;
}

export interface FirestoreCollection {
  name: string;
  documentCount: number;
  documents: any[];
  exportedAt: string;
}

export interface TestDataOptions {
  startDate: string;
  endDate: string;
  maxDailyHours: number;
}

export interface XeroPayItem {
  EarningsRateID: string;
  Name: string;
  EarningsType?: string;
  RateType?: string;
  TypeOfUnits?: string;
  IsExemptFromTax?: boolean;
  IsReportableAsW1?: boolean;
  id?: string; // Added to match usage in getPayItems
}

export interface PayrollCalendar {
  PayrollCalendarID: string;
  Name: string;
  CalendarType: string;
  StartDate: string;
  PaymentDate: string;
}

export interface PayRun {
  PayRunID: string;
  PayrollCalendarID: string;
  PayRunPeriodStartDate: string;
  PayRunPeriodEndDate: string;
  PaymentDate: string;
  PayRunStatus: string;
  Wages: number;
  Tax: number;
  Super: number;
  Deductions: number;
  Reimbursement: number;
  NetPay: number;
  Payslips: Payslip[];
}

export interface Payslip {
  PayslipID: string;
  EmployeeID: string;
  FirstName: string;
  LastName: string;
  EarningsLines: PayslipLine[];
  TimesheetEarningsLines: PayslipLine[];
  LeaveEarningsLines: PayslipLine[];
  NetPay: number;
}

export interface PayslipLine {
  EarningsRateID: string;
  NumberOfUnits: number;
  RatePerUnit: number;
  FixedAmount?: number;
}

export interface ProcessingProject {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  totalHours: number;
  purchaseOrderNumber?: string;
  xeroContactId?: string;
  tasks: ProjectTask[];
  requiresApproval: boolean;
  invoiceStatus: 'not started' | 'draft' | 'sent';
  priority: 'high' | 'normal';
  hasSpecialHandling: boolean;
  type: 'labor_hire' | 'team';
  assignments: Array<{
    userId: string;
    userName: string;
    taskId: string;
    taskName: string;
    hours: number;
    approvalStatus: string;
  }>;
}

export interface ProcessingData {
  projects: ProcessingProject[];
  summary: {
    totalProjects: number;
    approvedTimesheets: number;
    totalRequiringApproval: number;
    generatedInvoices: number;
    urgentItems: number;
  };
}

export interface ReportEntry {
  id: string;
  date: string;
  userName: string;
  clientName: string;
  projectName: string;
  taskName: string;
  approvalStatus: string;
  hours: number;
  cost: number;
  revenue: number;
  profit: number;
}

export interface ReportData {
  entries: ReportEntry[];
  summary: {
    totalHours: number;
    totalCost: number;
    totalRevenue: number;
    profitMargin: number;
  };
}

export interface OvertimeReportEntry {
  userId: string;
  userName: string;
  overtimeType: 'no' | 'eligible' | 'all';
  hoursPerWeek: number;
  totalHours: number;
  overtimeHours: number;
  projects: Array<{
    projectId: string;
    projectName: string;
    hours: number;
    overtimeHours: number;
    requiresApproval: boolean;
    approvalStatus: string;
  }>;
}

export interface OvertimeReportData {
  entries: OvertimeReportEntry[];
  summary: {
    totalOvertimeHours: number;
    totalUsers: number;
  };
}

export interface SavedForecast {
  id: string;
  name: string;
  month: string;
  entries: Array<{
    userId: string;
    hoursPerWeek: number;
    billablePercentage: number;
    forecastHours: number;
    sellRate: number;
    costRate: number;
    plannedBonus: number;
    plannedLeave: number;
    publicHolidays: number;
  }>;
}

export interface ProjectTask {
  id: string;
  name: string;
  projectId: string;
  isActive: boolean;
  sellRate?: number; // Legacy property
  sellRates: Array<{
    sellRate: number;
    date: string;
  }>;
  billable: boolean;
  teamId?: string;
  xeroLeaveTypeId?: string;
  userAssignments: Array<{
    id: string;
    userId: string;
    userName: string;
    isActive: boolean;
    assignedAt: string;
  }>;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  xeroContactId?: string;
  purchaseOrderNumber?: string;
  xeroProjectId?: string;
  budget: number;
  startDate: string;
  endDate?: string;
  approverEmail: string;
  requiresApproval: boolean;
  overtimeInclusive: boolean;
  isActive: boolean;
  hasProjectElapsed?: boolean;
  tasks: ProjectTask[];
  createdAt?: any;
  updatedAt?: any;
}

export interface ForecastDelta {
  value: number;
  updatedAt: string;
}

export interface ForecastDocument {
  [key: string]: ForecastDelta;
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
  contractorOrdinaryHoursEarningsId: string;
  bonusPayItemId: string;
  scopes: string[];
}

export interface ForecastData {
  month: string;
  users: User[];
  projects: Project[];
  expenses: number;
  expenses: number;
  bonuses: Bonus[];
  leave: Leave[];
  holidays: PublicHoliday[];
  workingDays: number;
  deltas: Record<string, any>;
}

export interface ForecastDelta {
  value: number;
  updatedAt: string;
}

export interface SubmittedInvoice {
  id: string;
  projectId: string;
  month: string;
  year: string;
  invoiceData: any;
  createdAt: any;
}