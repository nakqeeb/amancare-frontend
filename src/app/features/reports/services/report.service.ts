// ===================================================================
// src/app/features/reports/services/report.service.ts
// ===================================================================
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of, delay, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ReportFilter,
  FinancialSummary,
  AppointmentAnalytics,
  PatientDemographics,
  DoctorPerformance,
  PatientVisitFrequency,
  PopularDiagnoses,
  OutstandingPayments,
  RevenueByService,
  DashboardStats,
  ReportResponse,
  GenerateReportRequest,
  ReportType,
  ExportFormat,
  ChartData,
  LineChartData
} from '../models/report.model';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/reports`;

  // State management
  private currentFiltersSubject = new BehaviorSubject<ReportFilter | null>(null);
  public currentFilters$ = this.currentFiltersSubject.asObservable();

  // Signals for reactive UI
  isGenerating = signal(false);
  lastGeneratedReport = signal<any>(null);

  // ===================================================================
  // DASHBOARD STATISTICS
  // ===================================================================
  getDashboardStats(clinicId?: number): Observable<DashboardStats> {
    // Mock implementation for development
    const mockStats: DashboardStats = {
      financial: {
        todayRevenue: 15750,
        monthRevenue: 287500,
        pendingAmount: 45200,
        overdueAmount: 12800,
        revenueChange: 12.5
      },
      operational: {
        todayAppointments: 18,
        completedToday: 14,
        cancelledToday: 2,
        upcomingAppointments: 25,
        averageWaitTime: 15
      },
      patient: {
        totalActivePatients: 1247,
        newPatientsToday: 3,
        newPatientsThisMonth: 89,
        returningPatients: 567,
        patientGrowthRate: 8.7
      },
      trends: [
        { label: 'الإيرادات', current: 287500, previous: 256000, change: 12.3, changeType: 'increase' },
        { label: 'المواعيد', current: 342, previous: 298, change: 14.8, changeType: 'increase' },
        { label: 'المرضى الجدد', current: 89, previous: 76, change: 17.1, changeType: 'increase' }
      ]
    };

    return of(mockStats).pipe(delay(800));

    // Real implementation
    // const params = new HttpParams().set('clinicId', clinicId?.toString() || '');
    // return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard`, { params });
  }

  // ===================================================================
  // FINANCIAL REPORTS
  // ===================================================================
  getFinancialSummary(filters: ReportFilter): Observable<FinancialSummary> {
    // Mock implementation
    const mockSummary: FinancialSummary = {
      totalRevenue: 287500,
      totalPaid: 242300,
      totalPending: 32400,
      totalOverdue: 12800,
      averageInvoiceAmount: 850,
      totalInvoices: 338,
      paymentMethods: [
        { method: 'نقدي', amount: 145200, percentage: 59.9, count: 203 },
        { method: 'بطاقة ائتمان', amount: 67800, percentage: 28.0, count: 89 },
        { method: 'تحويل بنكي', amount: 29300, percentage: 12.1, count: 46 }
      ],
      revenueByPeriod: this.generateMockRevenueByPeriod()
    };

    return of(mockSummary).pipe(delay(1200));

    // Real implementation
    // return this.http.post<FinancialSummary>(`${this.apiUrl}/financial/summary`, filters);
  }

  getRevenueByService(filters: ReportFilter): Observable<RevenueByService[]> {
    const mockData: RevenueByService[] = [
      { serviceCategory: 'استشارة', serviceName: 'استشارة عامة', totalRevenue: 89400, count: 149, averagePrice: 600, percentage: 31.1 },
      { serviceCategory: 'فحوصات', serviceName: 'تحاليل دم', totalRevenue: 67200, count: 224, averagePrice: 300, percentage: 23.4 },
      { serviceCategory: 'علاج', serviceName: 'علاج طبيعي', totalRevenue: 54600, count: 91, averagePrice: 600, percentage: 19.0 },
      { serviceCategory: 'أشعة', serviceName: 'أشعة سينية', totalRevenue: 43200, count: 72, averagePrice: 600, percentage: 15.0 },
      { serviceCategory: 'جراحة', serviceName: 'جراحة صغرى', totalRevenue: 32600, count: 23, averagePrice: 1417, percentage: 11.3 }
    ];

    return of(mockData).pipe(delay(900));
  }

  getOutstandingPayments(filters: ReportFilter): Observable<OutstandingPayments[]> {
    const mockData: OutstandingPayments[] = [
      { patientName: 'أحمد محمد علي', patientId: 1001, invoiceNumber: 'INV-2025-001', invoiceId: 1, amount: 1200, dueDate: '2025-08-15', daysPastDue: 15, status: 'متأخر' },
      { patientName: 'فاطمة أحمد', patientId: 1002, invoiceNumber: 'INV-2025-002', invoiceId: 2, amount: 800, dueDate: '2025-08-20', daysPastDue: 10, status: 'متأخر' },
      { patientName: 'محمد عبدالله', patientId: 1003, invoiceNumber: 'INV-2025-003', invoiceId: 3, amount: 1500, dueDate: '2025-08-25', daysPastDue: 5, status: 'متأخر' }
    ];

    return of(mockData).pipe(delay(700));
  }

  // ===================================================================
  // OPERATIONAL REPORTS
  // ===================================================================
  getAppointmentAnalytics(filters: ReportFilter): Observable<AppointmentAnalytics> {
    const mockData: AppointmentAnalytics = {
      totalAppointments: 342,
      completedAppointments: 298,
      cancelledAppointments: 28,
      noShowAppointments: 16,
      completionRate: 87.1,
      cancellationRate: 8.2,
      noShowRate: 4.7,
      appointmentsByDay: this.generateDailyAppointments(),
      appointmentsByHour: this.generateHourlyAppointments(),
      appointmentsByType: [
        { type: 'استشارة عامة', count: 149, percentage: 43.6, averageDuration: 30 },
        { type: 'متابعة', count: 98, percentage: 28.7, averageDuration: 20 },
        { type: 'فحص دوري', count: 67, percentage: 19.6, averageDuration: 45 },
        { type: 'طوارئ', count: 28, percentage: 8.2, averageDuration: 60 }
      ]
    };

    return of(mockData).pipe(delay(1000));
  }

  getDoctorPerformance(filters: ReportFilter): Observable<DoctorPerformance[]> {
    const mockData: DoctorPerformance[] = [
      {
        doctorId: 1,
        doctorName: 'د. أحمد محمد',
        specialization: 'طب عام',
        totalAppointments: 89,
        completedAppointments: 82,
        cancelledAppointments: 7,
        averageRating: 4.7,
        totalRevenue: 53400,
        patientsCount: 67,
        workingHours: 160,
        efficiency: 0.51
      },
      {
        doctorId: 2,
        doctorName: 'د. فاطمة علي',
        specialization: 'أطفال',
        totalAppointments: 76,
        completedAppointments: 71,
        cancelledAppointments: 5,
        averageRating: 4.9,
        totalRevenue: 45600,
        patientsCount: 54,
        workingHours: 140,
        efficiency: 0.54
      }
    ];

    return of(mockData).pipe(delay(800));
  }

  // ===================================================================
  // PATIENT REPORTS
  // ===================================================================
  getPatientDemographics(filters: ReportFilter): Observable<PatientDemographics> {
    const mockData: PatientDemographics = {
      totalPatients: 1247,
      newPatientsThisPeriod: 89,
      returningPatients: 567,
      ageGroups: [
        { ageGroup: '0-18', count: 187, percentage: 15.0 },
        { ageGroup: '19-35', count: 423, percentage: 33.9 },
        { ageGroup: '36-50', count: 312, percentage: 25.0 },
        { ageGroup: '51-65', count: 218, percentage: 17.5 },
        { ageGroup: '65+', count: 107, percentage: 8.6 }
      ],
      genderDistribution: [
        { gender: 'أنثى', count: 689, percentage: 55.3 },
        { gender: 'ذكر', count: 558, percentage: 44.7 }
      ],
      bloodTypeDistribution: [
        { bloodType: 'O+', count: 387, percentage: 31.0 },
        { bloodType: 'A+', count: 298, percentage: 23.9 },
        { bloodType: 'B+', count: 224, percentage: 18.0 },
        { bloodType: 'AB+', count: 187, percentage: 15.0 },
        { bloodType: 'O-', count: 89, percentage: 7.1 },
        { bloodType: 'A-', count: 62, percentage: 5.0 }
      ],
      geographicDistribution: [
        { city: 'الرياض', count: 456, percentage: 36.6 },
        { city: 'جدة', count: 298, percentage: 23.9 },
        { city: 'الدمام', count: 234, percentage: 18.8 },
        { city: 'مكة', count: 145, percentage: 11.6 },
        { city: 'أخرى', count: 114, percentage: 9.1 }
      ]
    };

    return of(mockData).pipe(delay(900));
  }

  getPopularDiagnoses(filters: ReportFilter): Observable<PopularDiagnoses[]> {
    const mockData: PopularDiagnoses[] = [
      { diagnosis: 'نزلة برد', count: 89, percentage: 18.4, averageTreatmentDuration: 7, totalRevenue: 26700 },
      { diagnosis: 'صداع', count: 67, percentage: 13.9, averageTreatmentDuration: 3, totalRevenue: 20100 },
      { diagnosis: 'آلام الظهر', count: 54, percentage: 11.2, averageTreatmentDuration: 14, totalRevenue: 32400 },
      { diagnosis: 'التهاب الحلق', count: 43, percentage: 8.9, averageTreatmentDuration: 5, totalRevenue: 12900 },
      { diagnosis: 'حساسية', count: 38, percentage: 7.9, averageTreatmentDuration: 10, totalRevenue: 22800 }
    ];

    return of(mockData).pipe(delay(700));
  }

  // ===================================================================
  // EXPORT FUNCTIONALITY
  // ===================================================================
  exportReport(reportType: ReportType, filters: ReportFilter, format: ExportFormat): Observable<Blob> {
    this.isGenerating.set(true);

    // Mock implementation - simulate file generation
    return new Observable(observer => {
      setTimeout(() => {
        // Create mock file content based on format
        let content: string;
        let mimeType: string;
        let filename: string;

        switch (format) {
          case ExportFormat.PDF:
            content = '%PDF-1.4\n...'; // Mock PDF content
            mimeType = 'application/pdf';
            filename = `report_${reportType}_${Date.now()}.pdf`;
            break;

          case ExportFormat.EXCEL:
            content = 'Mock Excel Content';
            mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            filename = `report_${reportType}_${Date.now()}.xlsx`;
            break;

          case ExportFormat.CSV:
            content = 'Name,Value,Date\nMock Data,100,2025-08-30';
            mimeType = 'text/csv';
            filename = `report_${reportType}_${Date.now()}.csv`;
            break;

          default:
            content = 'Mock Report Content';
            mimeType = 'text/plain';
            filename = `report_${reportType}_${Date.now()}.txt`;
        }

        const blob = new Blob([content], { type: mimeType });
        this.isGenerating.set(false);
        observer.next(blob);
        observer.complete();
      }, 2000);
    });

    // Real implementation
    // const request: GenerateReportRequest = {
    //   reportType,
    //   filters,
    //   includeCharts: true,
    //   exportFormat: format
    // };
    // return this.http.post(`${this.apiUrl}/export`, request, { responseType: 'blob' })
    //   .pipe(tap(() => this.isGenerating.set(false)));
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================
  setCurrentFilters(filters: ReportFilter): void {
    this.currentFiltersSubject.next(filters);
  }

  getCurrentFilters(): ReportFilter | null {
    return this.currentFiltersSubject.value;
  }

  // Generate default date range (last 30 days)
  getDefaultDateRange(): { startDate: string; endDate: string } {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  }

  // ===================================================================
  // MOCK DATA GENERATORS
  // ===================================================================
  private generateMockRevenueByPeriod() {
    const data = [];
    const endDate = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(endDate.getDate() - i);

      data.push({
        period: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 15000) + 5000,
        invoiceCount: Math.floor(Math.random() * 20) + 5,
        averageAmount: Math.floor(Math.random() * 500) + 400
      });
    }

    return data;
  }

  private generateDailyAppointments() {
    const data = [];
    const endDate = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(endDate.getDate() - i);

      const scheduled = Math.floor(Math.random() * 25) + 10;
      const completed = Math.floor(scheduled * 0.85);
      const cancelled = Math.floor(scheduled * 0.10);
      const noShow = scheduled - completed - cancelled;

      data.push({
        date: date.toISOString().split('T')[0],
        scheduled,
        completed,
        cancelled,
        noShow
      });
    }

    return data;
  }

  private generateHourlyAppointments() {
    const workingHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

    return workingHours.map(hour => ({
      hour,
      count: Math.floor(Math.random() * 8) + 2,
      label: `${hour.toString().padStart(2, '0')}:00 - ${(hour + 1).toString().padStart(2, '0')}:00`
    }));
  }

  // ===================================================================
  // CHART DATA TRANSFORMERS
  // ===================================================================
  transformToChartData(data: any[], nameKey: string, valueKey: string): ChartData[] {
    return data.map(item => ({
      name: item[nameKey],
      value: item[valueKey],
      extra: item
    }));
  }

  transformToLineChart(data: any[], seriesKey: string, nameKey: string, valueKey: string): LineChartData[] {
    const grouped = data.reduce((acc, item) => {
      const series = item[seriesKey];
      if (!acc[series]) {
        acc[series] = [];
      }
      acc[series].push({
        name: item[nameKey],
        value: item[valueKey]
      });
      return acc;
    }, {});

    return Object.keys(grouped).map(key => ({
      name: key,
      series: grouped[key]
    }));
  }

  // ===================================================================
  // REAL-TIME UPDATES (WebSocket integration)
  // ===================================================================
  subscribeToRealtimeUpdates(): Observable<DashboardStats> {
    // This would connect to WebSocket for real-time dashboard updates
    // For now, simulate with interval updates
    return new Observable(observer => {
      const interval = setInterval(() => {
        this.getDashboardStats().subscribe(stats => {
          observer.next(stats);
        });
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    });
  }

  // ===================================================================
  // SCHEDULED REPORTS
  // ===================================================================
  scheduleReport(config: {
    reportType: ReportType;
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    filters: ReportFilter;
  }): Observable<any> {
    // Real implementation would save scheduled report configuration
    return of({ success: true, message: 'تم جدولة التقرير بنجاح' }).pipe(delay(500));
  }

  getScheduledReports(): Observable<any[]> {
    // Mock scheduled reports
    const mockScheduled = [
      {
        id: 1,
        name: 'تقرير الإيرادات الشهري',
        type: ReportType.FINANCIAL,
        frequency: 'monthly',
        nextRun: '2025-09-01',
        isActive: true
      },
      {
        id: 2,
        name: 'تقرير المواعيد الأسبوعي',
        type: ReportType.OPERATIONAL,
        frequency: 'weekly',
        nextRun: '2025-09-02',
        isActive: true
      }
    ];

    return of(mockScheduled).pipe(delay(400));
  }
}
