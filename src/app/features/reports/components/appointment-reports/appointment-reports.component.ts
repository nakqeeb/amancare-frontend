// ===================================================================
// src/app/features/reports/components/appointment-reports/appointment-reports.component.ts
// ===================================================================
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { ChartWidgetComponent } from '../chart-widgets/chart-widget.component';

// Services & Models
import { ReportService } from '../../services/report.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  AppointmentAnalytics,
  DoctorPerformance,
  ReportFilter,
  ExportFormat,
  ReportType,
  DailyAppointments,
  HourlyAppointments,
  AppointmentTypeStats
} from '../../models/report.model';

@Component({
  selector: 'app-appointment-reports',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTableModule,
    MatSortModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressBarModule,
    HeaderComponent,
    SidebarComponent,
    ChartWidgetComponent
  ],
  templateUrl: './appointment-reports.component.html',
  styleUrl: './appointment-reports.component.scss'
})
export class AppointmentReportsComponent implements OnInit {
  // Services
  private reportService = inject(ReportService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // Signals
  analytics = signal<AppointmentAnalytics | null>(null);
  doctorPerformance = signal<DoctorPerformance[]>([]);
  loading = signal(false);
  selectedTab = signal(0);
  currentUser = this.authService.currentUser;

  // Form
  filterForm!: FormGroup;

  // Chart data computed from analytics
  dailyAppointmentsChartData = computed(() => {
    const analyticsData = this.analytics();
    return analyticsData ? analyticsData.appointmentsByDay.map(day => ({
      name: new Date(day.date).toLocaleDateString('ar-SA', { weekday: 'short', day: 'numeric' }),
      value: day.scheduled
    })) : [];
  });

  hourlyAppointmentsChartData = computed(() => {
    const analyticsData = this.analytics();
    return analyticsData ? analyticsData.appointmentsByHour.map(hour => ({
      name: hour.label,
      value: hour.count
    })) : [];
  });

  appointmentTypesChartData = computed(() => {
    const analyticsData = this.analytics();
    return analyticsData ? analyticsData.appointmentsByType.map(type => ({
      name: type.type,
      value: type.count
    })) : [];
  });

  ngOnInit(): void {
    this.initializeForm();
    this.loadAppointmentData();
  }

  private initializeForm(): void {
    const defaultRange = this.reportService.getDefaultDateRange();

    this.filterForm = this.fb.group({
      startDate: [defaultRange.startDate],
      endDate: [defaultRange.endDate],
      doctorId: [''],
      appointmentType: ['all']
    });
  }

  private loadAppointmentData(): void {
    this.loading.set(true);

    const filters: ReportFilter = {
      dateRange: {
        startDate: this.filterForm.get('startDate')?.value,
        endDate: this.filterForm.get('endDate')?.value
      },
      clinicId: this.currentUser()?.clinicId,
      doctorId: this.filterForm.get('doctorId')?.value || undefined
    };

    // Load appointment analytics and doctor performance
    Promise.all([
      this.reportService.getAppointmentAnalytics(filters).toPromise(),
      this.reportService.getDoctorPerformance(filters).toPromise()
    ]).then(([analytics, performance]) => {
      this.analytics.set(analytics!);
      this.doctorPerformance.set(performance!);
      this.loading.set(false);
    }).catch(error => {
      console.error('Error loading appointment data:', error);
      this.notificationService.error('حدث خطأ في تحميل بيانات المواعيد');
      this.loading.set(false);
    });
  }

  // ===================================================================
  // EVENT HANDLERS
  // ===================================================================
  onTabChange(index: number): void {
    this.selectedTab.set(index);
  }

  onFilterChange(): void {
    this.loadAppointmentData();
  }

  onResetFilters(): void {
    const defaultRange = this.reportService.getDefaultDateRange();
    this.filterForm.patchValue({
      startDate: defaultRange.startDate,
      endDate: defaultRange.endDate,
      doctorId: '',
      appointmentType: 'all'
    });
  }

  onExportReport(format: ExportFormat): void {
    const filters: ReportFilter = {
      dateRange: {
        startDate: this.filterForm.get('startDate')?.value,
        endDate: this.filterForm.get('endDate')?.value
      },
      clinicId: this.currentUser()?.clinicId
    };

    this.reportService.exportReport(ReportType.OPERATIONAL, filters, format).subscribe({
      next: (blob) => {
        const filename = `appointment_report_${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;
        this.downloadFile(blob, filename);
        this.notificationService.success('تم تصدير التقرير بنجاح');
      },
      error: (error) => {
        console.error('Export error:', error);
        this.notificationService.error('حدث خطأ في تصدير التقرير');
      }
    });
  }

  onViewDoctorDetails(doctorId: number): void {
    this.router.navigate(['/users', doctorId]);
  }

  onViewDoctorSchedule(doctorId: number): void {
    this.router.navigate(['/appointments'], { queryParams: { doctorId } });
  }

  onGenerateDoctorReport(doctorId: number): void {
    // Generate individual doctor performance report
    this.notificationService.info('سيتم إنشاء تقرير مفصل للطبيب');
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('ar-SA').format(num);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('ar-SA');
  }

  getPeakHours(): HourlyAppointments[] {
    const analyticsData = this.analytics();
    if (!analyticsData) return [];

    return analyticsData.appointmentsByHour
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }

  getTopPerformingDoctor(): DoctorPerformance | undefined {
    return this.doctorPerformance().reduce((prev, current) =>
      (prev.efficiency > current.efficiency) ? prev : current
    );
  }

  getHighestRatedDoctor(): DoctorPerformance | undefined {
    return this.doctorPerformance().reduce((prev, current) =>
      (prev.averageRating > current.averageRating) ? prev : current
    );
  }

  getTopRevenueDoctor(): DoctorPerformance | undefined {
    return this.doctorPerformance().reduce((prev, current) =>
      (prev.totalRevenue > current.totalRevenue) ? prev : current
    );
  }

  getEfficiencyColor(efficiency: number): 'primary' | 'accent' | 'warn' {
    if (efficiency >= 0.6) return 'primary';
    if (efficiency >= 0.4) return 'accent';
    return 'warn';
  }

  getStars(rating: number): { filled: boolean }[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push({ filled: i <= Math.round(rating) });
    }
    return stars;
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
