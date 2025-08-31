// ===================================================================
// src/app/features/reports/components/doctor-performance/doctor-performance.component.ts
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
import { MatExpansionModule } from '@angular/material/expansion';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { ChartWidgetComponent } from '../chart-widgets/chart-widget.component';

// Services & Models
import { ReportService } from '../../services/report.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  DoctorPerformance,
  ReportFilter,
  ExportFormat,
  ReportType,
  ChartData
} from '../../models/report.model';

interface DoctorKPI {
  label: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  target?: number;
}

@Component({
  selector: 'app-doctor-performance',
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
    MatExpansionModule,
    HeaderComponent,
    SidebarComponent,
    ChartWidgetComponent
  ],
  templateUrl: './doctor-performance.component.html',
  styleUrl: './doctor-performance.component.scss'
})
export class DoctorPerformanceComponent implements OnInit {
  // Services
  private reportService = inject(ReportService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // Signals
  doctorPerformance = signal<DoctorPerformance[]>([]);
  loading = signal(false);
  currentUser = this.authService.currentUser;

  // Form
  filterForm!: FormGroup;

  // Mock doctors list for filter
  doctorsList = [
    { id: 1, name: 'د. أحمد محمد' },
    { id: 2, name: 'د. فاطمة علي' },
    { id: 3, name: 'د. محمد سالم' },
    { id: 4, name: 'د. سارة أحمد' }
  ];

  // Chart data computed from performance data
  revenueByDoctorChartData = computed(() => {
    return this.doctorPerformance().map(doctor => ({
      name: doctor.doctorName.replace('د. ', ''),
      value: doctor.totalRevenue
    }));
  });

  efficiencyChartData = computed(() => {
    return this.doctorPerformance().map(doctor => ({
      name: doctor.doctorName.replace('د. ', ''),
      value: doctor.efficiency
    }));
  });

  patientCountChartData = computed(() => {
    return this.doctorPerformance().map(doctor => ({
      name: doctor.doctorName.replace('د. ', ''),
      value: doctor.patientsCount
    }));
  });

  ratingChartData = computed(() => {
    return this.doctorPerformance().map(doctor => ({
      name: doctor.doctorName.replace('د. ', ''),
      value: doctor.averageRating
    }));
  });

  // Overall KPIs computed from all doctors' data
  overallKPIs = computed((): DoctorKPI[] => {
    const doctors = this.doctorPerformance();
    if (doctors.length === 0) return [];

    const totalAppointments = doctors.reduce((sum, d) => sum + d.totalAppointments, 0);
    const totalRevenue = doctors.reduce((sum, d) => sum + d.totalRevenue, 0);
    const avgEfficiency = doctors.reduce((sum, d) => sum + d.efficiency, 0) / doctors.length;
    const avgRating = doctors.reduce((sum, d) => sum + d.averageRating, 0) / doctors.length;

    return [
      {
        label: 'إجمالي المواعيد',
        value: totalAppointments,
        unit: 'موعد',
        trend: 'up',
        change: 12.5,
        target: totalAppointments * 1.1
      },
      {
        label: 'إجمالي الإيرادات',
        value: totalRevenue,
        unit: 'ريال',
        trend: 'up',
        change: 8.3,
        target: totalRevenue * 1.15
      },
      {
        label: 'متوسط الكفاءة',
        value: avgEfficiency,
        unit: 'موعد/ساعة',
        trend: 'stable',
        change: 2.1,
        target: 0.6
      },
      {
        label: 'متوسط التقييم',
        value: avgRating,
        unit: '/5',
        trend: 'up',
        change: 5.2,
        target: 4.5
      }
    ];
  });

  ngOnInit(): void {
    this.initializeForm();
    this.loadPerformanceData();
  }

  private initializeForm(): void {
    const defaultRange = this.reportService.getDefaultDateRange();

    this.filterForm = this.fb.group({
      startDate: [defaultRange.startDate],
      endDate: [defaultRange.endDate],
      doctorId: [''],
      specialization: ['']
    });

    // Auto-update when form changes
    this.filterForm.valueChanges.subscribe(() => {
      this.loadPerformanceData();
    });
  }

  private loadPerformanceData(): void {
    this.loading.set(true);

    const filters: ReportFilter = {
      dateRange: {
        startDate: this.filterForm.get('startDate')?.value,
        endDate: this.filterForm.get('endDate')?.value
      },
      clinicId: this.currentUser()?.clinicId,
      doctorId: this.filterForm.get('doctorId')?.value || undefined
    };

    this.reportService.getDoctorPerformance(filters).subscribe({
      next: (performance) => {
        this.doctorPerformance.set(performance);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading doctor performance:', error);
        this.notificationService.error('حدث خطأ في تحميل بيانات أداء الأطباء');
        this.loading.set(false);
      }
    });
  }

  // ===================================================================
  // EVENT HANDLERS
  // ===================================================================
  onFilterChange(): void {
    this.loadPerformanceData();
  }

  onResetFilters(): void {
    const defaultRange = this.reportService.getDefaultDateRange();
    this.filterForm.patchValue({
      startDate: defaultRange.startDate,
      endDate: defaultRange.endDate,
      doctorId: '',
      specialization: ''
    });
  }

  onRefreshData(): void {
    this.loadPerformanceData();
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
        const filename = `doctor_performance_${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;
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

  onGenerateIndividualReport(doctorId: number): void {
    this.notificationService.info('سيتم إنشاء تقرير فردي للطبيب');
    // Implementation would generate a detailed individual report
  }

  onCompareDoctors(doctorId: number): void {
    this.notificationService.info('سيتم فتح أداة مقارنة الأطباء');
    // Implementation would open comparison dialog or page
  }

  onViewRecommendations(type: string): void {
    this.notificationService.info(`عرض توصيات ${type}`);
    // Implementation would show detailed recommendations
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

  formatKPIValue(value: number, unit: string): string {
    if (unit === 'ريال') {
      return this.formatCurrency(value);
    }
    return this.formatNumber(value);
  }

  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'up': return 'trending_up';
      case 'down': return 'trending_down';
      default: return 'trending_flat';
    }
  }

  getProgressColor(current: number, target: number): 'primary' | 'accent' | 'warn' {
    const percentage = (current / target) * 100;
    if (percentage >= 90) return 'primary';
    if (percentage >= 70) return 'accent';
    return 'warn';
  }

  getEfficiencyColor(efficiency: number): 'primary' | 'accent' | 'warn' {
    if (efficiency >= 0.6) return 'primary';
    if (efficiency >= 0.4) return 'accent';
    return 'warn';
  }

  getMaxEfficiency(): number {
    const doctors = this.doctorPerformance();
    return doctors.length > 0 ? Math.max(...doctors.map(d => d.efficiency)) : 1;
  }

  getStars(rating: number): { filled: boolean }[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push({ filled: i <= Math.round(rating) });
    }
    return stars;
  }

  getTopPerformers(): DoctorPerformance[] {
    return [...this.doctorPerformance()]
      .sort((a, b) => b.efficiency - a.efficiency)
      .slice(0, 3);
  }

  getImprovementAreas(): any[] {
    const doctors = this.doctorPerformance();
    const improvements = [];

    // Check for low efficiency doctors
    const lowEfficiencyDoctors = doctors.filter(d => d.efficiency < 0.4);
    if (lowEfficiencyDoctors.length > 0) {
      improvements.push({
        type: 'efficiency',
        icon: 'speed',
        title: 'تحسين الكفاءة',
        description: `${lowEfficiencyDoctors.length} طبيب يحتاج تحسين في الكفاءة`
      });
    }

    // Check for high cancellation rates
    const highCancellationDoctors = doctors.filter(d =>
      (d.cancelledAppointments / d.totalAppointments) > 0.15
    );
    if (highCancellationDoctors.length > 0) {
      improvements.push({
        type: 'cancellation',
        icon: 'cancel',
        title: 'تقليل الإلغاءات',
        description: `${highCancellationDoctors.length} طبيب لديه معدل إلغاء عالي`
      });
    }

    // Check for low ratings
    const lowRatingDoctors = doctors.filter(d => d.averageRating < 4.0);
    if (lowRatingDoctors.length > 0) {
      improvements.push({
        type: 'rating',
        icon: 'star_outline',
        title: 'تحسين التقييمات',
        description: `${lowRatingDoctors.length} طبيب يحتاج تحسين في التقييم`
      });
    }

    return improvements;
  }

  getAverageEfficiency(): number {
    const doctors = this.doctorPerformance();
    return doctors.length > 0
      ? doctors.reduce((sum, d) => sum + d.efficiency, 0) / doctors.length
      : 0;
  }

  getAverageRating(): number {
    const doctors = this.doctorPerformance();
    return doctors.length > 0
      ? doctors.reduce((sum, d) => sum + d.averageRating, 0) / doctors.length
      : 0;
  }

  getHighestRevenue(): number {
    const doctors = this.doctorPerformance();
    return doctors.length > 0
      ? Math.max(...doctors.map(d => d.totalRevenue))
      : 0;
  }

  getOverallCompletionRate(): number {
    const doctors = this.doctorPerformance();
    if (doctors.length === 0) return 0;

    const totalAppointments = doctors.reduce((sum, d) => sum + d.totalAppointments, 0);
    const totalCompleted = doctors.reduce((sum, d) => sum + d.completedAppointments, 0);

    return totalAppointments > 0 ? (totalCompleted / totalAppointments) * 100 : 0;
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
