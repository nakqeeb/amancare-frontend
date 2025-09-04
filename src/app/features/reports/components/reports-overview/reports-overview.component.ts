// ===================================================================
// src/app/features/reports/components/reports-overview/reports-overview.component.ts
// ===================================================================
import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// Chart Components (we'll create these)
import { ChartWidgetComponent } from '../chart-widgets/chart-widget.component';

// Services & Models
import { ReportService } from '../../services/report.service';
import { AuthService, UserRole } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  DashboardStats,
  ReportType,
  ExportFormat,
  ReportFilter,
  ChartData
} from '../../models/report.model';

interface QuickReportCard {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  roles?: UserRole[];
}

@Component({
  selector: 'app-reports-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatGridListModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule,
    HeaderComponent,
    SidebarComponent,
    ChartWidgetComponent
  ],
  templateUrl: './reports-overview.component.html',
  styleUrl: './reports-overview.component.scss'
})
export class ReportsOverviewComponent implements OnInit, OnDestroy {
  // Services
  private reportService = inject(ReportService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  // Signals
  dashboardStats = signal<DashboardStats | null>(null);
  loading = signal(false);
  currentUser = this.authService.currentUser;
  selectedTab = signal(0);

  // Quick Reports Configuration
  quickReports: QuickReportCard[] = [
    {
      title: 'التقارير المالية',
      description: 'الإيرادات والمدفوعات والديون المستحقة',
      icon: 'assessment',
      route: '/reports/financial',
      color: 'success',
      roles: ['ADMIN', 'SYSTEM_ADMIN', 'RECEPTIONIST']
    },
    {
      title: 'تقارير المواعيد',
      description: 'إحصائيات المواعيد والحضور والإلغاء',
      icon: 'event_note',
      route: '/reports/appointments',
      color: 'info'
    },
    {
      title: 'تقارير المرضى',
      description: 'إحصائيات المرضى والزيارات والتشخيصات',
      icon: 'people',
      route: '/reports/patients',
      color: 'primary'
    },
    {
      title: 'أداء الأطباء',
      description: 'إحصائيات أداء وإنتاجية الأطباء',
      icon: 'medical_services',
      route: '/reports/doctors',
      color: 'accent',
      roles: ['ADMIN', 'SYSTEM_ADMIN']
    },
    {
      title: 'التقارير الطبية',
      description: 'تحليل التشخيصات والعلاجات والأدوية',
      icon: 'science',
      route: '/reports/medical',
      color: 'warn',
      roles: ['DOCTOR', 'ADMIN', 'SYSTEM_ADMIN']
    },
    {
      title: 'تقارير مخصصة',
      description: 'إنشاء تقارير مخصصة حسب المعايير المحددة',
      icon: 'tune',
      route: '/reports/custom',
      color: 'secondary',
      roles: ['ADMIN', 'SYSTEM_ADMIN']
    }
  ];

  // Chart data for overview
  revenueChartData = signal<any[]>([]);
  appointmentsChartData = signal<any[]>([]);
  patientsChartData = signal<any[]>([]);

  private updateInterval?: any;

  ngOnInit(): void {
    this.loadDashboardStats();
    this.setupAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  private loadDashboardStats(): void {
    this.loading.set(true);

    this.reportService.getDashboardStats(this.currentUser()?.clinicId).subscribe({
      next: (stats) => {
        this.dashboardStats.set(stats);
        this.prepareChartData(stats);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
        this.notificationService.error('حدث خطأ في تحميل إحصائيات لوحة التحكم');
        this.loading.set(false);
      }
    });
  }

  private prepareChartData(stats: DashboardStats): void {
    // Revenue trend data (last 7 days)
    this.revenueChartData.set([
      { name: 'الأحد', value: 12500 },
      { name: 'الاثنين', value: 18200 },
      { name: 'الثلاثاء', value: 15800 },
      { name: 'الأربعاء', value: 22100 },
      { name: 'الخميس', value: 19600 },
      { name: 'الجمعة', value: 16800 },
      { name: 'السبت', value: 14200 }
    ]);

    // Appointments breakdown
    this.appointmentsChartData.set([
      { name: 'مكتملة', value: stats.operational.completedToday },
      { name: 'قادمة', value: stats.operational.upcomingAppointments },
      { name: 'ملغاة', value: stats.operational.cancelledToday }
    ]);

    // Patient growth data
    this.patientsChartData.set([
      { name: 'المرضى الحاليين', value: stats.patient.totalActivePatients },
      { name: 'مرضى جدد هذا الشهر', value: stats.patient.newPatientsThisMonth },
      { name: 'مرضى عائدين', value: stats.patient.returningPatients }
    ]);
  }

  private setupAutoRefresh(): void {
    // Auto-refresh every 5 minutes
    this.updateInterval = setInterval(() => {
      this.loadDashboardStats();
    }, 5 * 60 * 1000);
  }

  // ===================================================================
  // EVENT HANDLERS
  // ===================================================================
  onTabChange(index: number): void {
    this.selectedTab.set(index);
  }

  navigateToReport(route: string): void {
    this.router.navigate([route]);
  }

  onRefreshStats(): void {
    this.loadDashboardStats();
  }

  onExportSummary(): void {
    const filters: ReportFilter = {
      clinicId: this.currentUser()?.clinicId,
      dateRange: this.reportService.getDefaultDateRange()
    };

    this.reportService.exportReport(ReportType.FINANCIAL, filters, ExportFormat.PDF).subscribe({
      next: (blob) => {
        this.downloadFile(blob, 'dashboard_summary.pdf');
        this.notificationService.success('تم تصدير التقرير بنجاح');
      },
      error: (error) => {
        console.error('Export error:', error);
        this.notificationService.error('حدث خطأ في تصدير التقرير');
      }
    });
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
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

  getTrendIcon(changeType: string): string {
    switch (changeType) {
      case 'increase': return 'trending_up';
      case 'decrease': return 'trending_down';
      default: return 'trending_flat';
    }
  }

  getTrendColor(changeType: string): string {
    switch (changeType) {
      case 'increase': return 'success';
      case 'decrease': return 'warn';
      default: return 'primary';
    }
  }

  hasPermission(reportCard: QuickReportCard): boolean {
    if (!reportCard.roles || reportCard.roles.length === 0) {
      return true;
    }
    return this.authService.hasRole(reportCard.roles);
  }

  getVisibleReports(): QuickReportCard[] {
    return this.quickReports.filter(report => this.hasPermission(report));
  }

  // ===================================================================
  // QUICK ACTIONS
  // ===================================================================
  generateDailyReport(): void {
    const today = new Date().toISOString().split('T')[0];
    const filters: ReportFilter = {
      clinicId: this.currentUser()?.clinicId,
      dateRange: { startDate: today, endDate: today }
    };

    this.reportService.exportReport(ReportType.OPERATIONAL, filters, ExportFormat.PDF).subscribe({
      next: (blob) => {
        this.downloadFile(blob, `daily_report_${today}.pdf`);
        this.notificationService.success('تم إنشاء التقرير اليومي');
      },
      error: () => {
        this.notificationService.error('حدث خطأ في إنشاء التقرير اليومي');
      }
    });
  }

  scheduleWeeklyReport(): void {
    const config = {
      reportType: ReportType.FINANCIAL,
      frequency: 'weekly' as const,
      recipients: [this.currentUser()?.email || ''],
      filters: {
        clinicId: this.currentUser()?.clinicId,
        dateRange: this.reportService.getDefaultDateRange()
      }
    };

    this.reportService.scheduleReport(config).subscribe({
      next: () => {
        this.notificationService.success('تم جدولة التقرير الأسبوعي');
      },
      error: () => {
        this.notificationService.error('حدث خطأ في جدولة التقرير');
      }
    });
  }

  viewTrends(): void {
    this.router.navigate(['/reports/trends']);
  }
}
