// ===================================================================
// src/app/features/reports/models/report.model.ts
// ===================================================================

export interface ReportDateRange {
  startDate: string;
  endDate: string;
}

export interface ReportFilter {
  clinicId?: number;
  doctorId?: number;
  dateRange: ReportDateRange;
  status?: string;
  category?: string;
}

// ===================================================================
// FINANCIAL REPORTS
// ===================================================================
export interface FinancialSummary {
  totalRevenue: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  averageInvoiceAmount: number;
  totalInvoices: number;
  paymentMethods: PaymentMethodBreakdown[];
  revenueByPeriod: PeriodRevenue[];
}

export interface PaymentMethodBreakdown {
  method: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface PeriodRevenue {
  period: string; // YYYY-MM-DD
  revenue: number;
  invoiceCount: number;
  averageAmount: number;
}

export interface RevenueByService {
  serviceCategory: string;
  serviceName: string;
  totalRevenue: number;
  count: number;
  averagePrice: number;
  percentage: number;
}

export interface OutstandingPayments {
  patientName: string;
  patientId: number;
  invoiceNumber: string;
  invoiceId: number;
  amount: number;
  dueDate: string;
  daysPastDue: number;
  status: string;
}

// ===================================================================
// OPERATIONAL REPORTS
// ===================================================================
export interface AppointmentAnalytics {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  completionRate: number;
  cancellationRate: number;
  noShowRate: number;
  appointmentsByDay: DailyAppointments[];
  appointmentsByHour: HourlyAppointments[];
  appointmentsByType: AppointmentTypeStats[];
}

export interface DailyAppointments {
  date: string;
  scheduled: number;
  completed: number;
  cancelled: number;
  noShow: number;
}

export interface HourlyAppointments {
  hour: number;
  count: number;
  label: string; // "08:00 - 09:00"
}

export interface AppointmentTypeStats {
  type: string;
  count: number;
  percentage: number;
  averageDuration: number;
}

export interface DoctorPerformance {
  doctorId: number;
  doctorName: string;
  specialization: string;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  averageRating: number;
  totalRevenue: number;
  patientsCount: number;
  workingHours: number;
  efficiency: number; // appointments per hour
}

// ===================================================================
// PATIENT REPORTS
// ===================================================================
export interface PatientDemographics {
  totalPatients: number;
  newPatientsThisPeriod: number;
  returningPatients: number;
  ageGroups: AgeGroupStats[];
  genderDistribution: GenderStats[];
  bloodTypeDistribution: BloodTypeStats[];
  geographicDistribution: GeographicStats[];
}

export interface AgeGroupStats {
  ageGroup: string; // "0-18", "19-35", etc.
  count: number;
  percentage: number;
}

export interface GenderStats {
  gender: string;
  count: number;
  percentage: number;
}

export interface BloodTypeStats {
  bloodType: string;
  count: number;
  percentage: number;
}

export interface GeographicStats {
  city: string;
  count: number;
  percentage: number;
}

export interface PatientVisitFrequency {
  patientId: number;
  patientName: string;
  totalVisits: number;
  lastVisitDate: string;
  averageDaysBetweenVisits: number;
  totalSpent: number;
  visitsByMonth: MonthlyVisits[];
}

export interface MonthlyVisits {
  month: string; // YYYY-MM
  count: number;
  amount: number;
}

export interface PopularDiagnoses {
  diagnosis: string;
  count: number;
  percentage: number;
  averageTreatmentDuration: number;
  totalRevenue: number;
}

// ===================================================================
// CHART DATA INTERFACES
// ===================================================================
export interface ChartData {
  name: string;
  value: number;
  extra?: any;
}

export interface LineChartData {
  name: string;
  series: ChartPoint[];
}

export interface ChartPoint {
  name: string;
  value: number;
}

export interface MultiSeriesData {
  name: string;
  series: ChartPoint[];
}

// ===================================================================
// REPORT CONFIGURATION
// ===================================================================
export interface ReportConfig {
  title: string;
  description: string;
  type: ReportType;
  refreshInterval?: number; // minutes
  exportFormats: ExportFormat[];
  filters: FilterType[];
  chartTypes?: ChartType[];
}

export enum ReportType {
  FINANCIAL = 'FINANCIAL',
  OPERATIONAL = 'OPERATIONAL',
  PATIENT = 'PATIENT',
  CUSTOM = 'CUSTOM'
}

export enum ExportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV'
}

export enum FilterType {
  DATE_RANGE = 'DATE_RANGE',
  CLINIC = 'CLINIC',
  DOCTOR = 'DOCTOR',
  PATIENT = 'PATIENT',
  STATUS = 'STATUS',
  CATEGORY = 'CATEGORY'
}

export enum ChartType {
  LINE = 'LINE',
  BAR = 'BAR',
  PIE = 'PIE',
  AREA = 'AREA',
  COMBO = 'COMBO'
}

// ===================================================================
// API REQUEST/RESPONSE INTERFACES
// ===================================================================
export interface GenerateReportRequest {
  reportType: ReportType;
  filters: ReportFilter;
  includeCharts: boolean;
  exportFormat?: ExportFormat;
}

export interface ReportResponse<T = any> {
  data: T;
  metadata: ReportMetadata;
  charts?: ChartConfig[];
  generatedAt: string;
  generatedBy: string;
}

export interface ReportMetadata {
  title: string;
  description: string;
  totalRecords: number;
  dateRange: ReportDateRange;
  filters: any;
  executionTime: number; // milliseconds
}

export interface ChartConfig {
  id: string;
  title: string;
  type: ChartType;
  data: any[];
  options?: any;
}

// ===================================================================
// DASHBOARD STATISTICS (for quick overview)
// ===================================================================
export interface DashboardStats {
  financial: FinancialStats;
  operational: OperationalStats;
  patient: PatientStats;
  trends: TrendData[];
}

export interface FinancialStats {
  todayRevenue: number;
  monthRevenue: number;
  pendingAmount: number;
  overdueAmount: number;
  revenueChange: number; // percentage change from last period
}

export interface OperationalStats {
  todayAppointments: number;
  completedToday: number;
  cancelledToday: number;
  upcomingAppointments: number;
  averageWaitTime: number; // minutes
}

export interface PatientStats {
  totalActivePatients: number;
  newPatientsToday: number;
  newPatientsThisMonth: number;
  returningPatients: number;
  patientGrowthRate: number; // percentage
}

export interface TrendData {
  label: string;
  current: number;
  previous: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'stable';
}
