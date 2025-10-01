// ===================================================================
// Main Dashboard Component - Complete TypeScript
// src/app/features/dashboard/components/main-dashboard/main-dashboard.component.ts
// ===================================================================

import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, interval, forkJoin, timer } from 'rxjs';

// Angular Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// Services
import { AuthService, User } from '../../../../core/services/auth.service';
import { PatientService } from '../../../patients/services/patient.service';
import { AppointmentService } from '../../../appointments/services/appointment.service';
import { NotificationService } from '../../../../core/services/notification.service';

// Models
import { PatientStatistics } from '../../../patients/models/patient.model';
import { AppointmentSummaryResponse } from '../../../appointments/models/appointment.model';
import { SystemAdminContextIndicatorComponent } from "../../../../shared/components/system-admin-context-indicator/system-admin-context-indicator.component";
import { ActivityService } from '../../../../core/services/activity.service';
import { ActivityFeedComponent } from "../../../../shared/components/activity-feed/activity-feed.component";
// import { InvoiceStatistics } from '../../../invoices/models/invoice.model';

// Statistics Interfaces
interface DashboardStatCard {
  title: string;
  value: number | string;
  icon: string;
  color: 'primary' | 'accent' | 'warn' | 'success' | 'info';
  subtitle?: string;
  trend?: number;
  loading?: boolean;
}

interface QuickAction {
  label: string;
  icon: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-main-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule,
    MatBadgeModule,
    MatMenuModule,
    MatProgressBarModule,
    HeaderComponent,
    SidebarComponent,
    SystemAdminContextIndicatorComponent,
    ActivityFeedComponent
  ],
  templateUrl: './main-dashboard.component.html',
  styleUrl: './main-dashboard.component.scss'
})
export class MainDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Services
  private authService = inject(AuthService);
  private patientService = inject(PatientService);
  private appointmentService = inject(AppointmentService);
  private notificationService = inject(NotificationService);
  private activityService = inject(ActivityService);


  // ===================================================================
  // STATE SIGNALS
  // ===================================================================

  // User & Auth
  currentUser = signal<User | null>(null);
  userRole = computed(() => this.currentUser()?.role || '');
  userName = computed(() => {
    const user = this.currentUser();
    return user ? `${user.fullName}` : '';
  });

  // Loading States
  loadingStats = signal(false);
  loadingAppointments = signal(false);
  loadingInvoices = signal(false);

  // Date & Time
  currentHijriDate = signal<string>('');
  currentGregorianDate = signal<string>('');
  currentTime = signal('');
  greeting = computed(() => this.getGreeting());

  // Statistics Data
  patientStats = signal<PatientStatistics | null>(null);
  appointmentStats = signal<any | null>(null);
  // invoiceStats = signal<InvoiceStatistics | null>(null);
  todayAppointments = signal<AppointmentSummaryResponse[]>([]);

  // Dashboard Cards
  statsCards = computed<DashboardStatCard[]>(() => {
    const patient = this.patientStats();
    const appointment = this.appointmentStats();
    // const invoice = this.invoiceStats();

    return [
      {
        title: 'إجمالي المرضى',
        value: patient?.totalPatients || 0,
        icon: 'groups',
        color: 'primary',
        subtitle: `${patient?.activePatients || 0} نشط`,
        trend: this.calculateTrend(patient?.totalPatients || 0, patient?.newPatientsThisMonth || 0)
      },
      {
        title: 'المرضى النشطون',
        value: patient?.activePatients || 0,
        icon: 'person_check',
        color: 'success',
        subtitle: `${this.formatPercentage(patient?.activePercentage)} من الإجمالي`
      },
      {
        title: 'مواعيد اليوم',
        value: patient?.patientsWithAppointmentsToday || 0,
        icon: 'event_available',
        color: 'info',
        subtitle: 'موعد مجدول'
      },
      {
        title: 'مرضى جدد',
        value: patient?.newPatientsThisMonth || 0,
        icon: 'person_add',
        color: 'accent',
        subtitle: 'خلال 30 يوم'
      },
      {
        title: 'فواتير معلقة',
        value: patient?.patientsWithPendingInvoices || 0,
        icon: 'receipt_long',
        color: 'warn',
        subtitle: this.formatCurrency(patient?.totalOutstandingBalance || 0)
      },
      {
        title: 'متوسط العمر',
        value: Math.round(patient?.averageAge || 0),
        icon: 'cake',
        color: 'primary',
        subtitle: 'سنة'
      }
    ];
  });

  // Quick Actions
  quickActions: QuickAction[] = [
    { label: 'إضافة مريض', icon: 'person_add', route: '/patients/new', color: 'primary' },
    { label: 'حجز موعد', icon: 'event', route: '/appointments/new', color: 'accent' },
    { label: 'إصدار فاتورة', icon: 'receipt', route: '/invoices/create', color: 'success' },
    { label: 'عرض التقارير', icon: 'assessment', route: '/reports', color: 'warn' }
  ];

  // Gender Distribution
  genderData = computed(() => {
    const stats = this.patientStats();
    if (!stats) return null;

    const total = stats.totalPatients;
    if (total === 0) return null;

    return {
      male: {
        count: stats.malePatients,
        percentage: (stats.malePatients / total) * 100
      },
      female: {
        count: stats.femalePatients,
        percentage: (stats.femalePatients / total) * 100
      }
    };
  });

  // ===================================================================
  // LIFECYCLE HOOKS
  // ===================================================================

  ngOnInit(): void {
    this.initializeUser();
    timer(1000).subscribe(() => this.loadDashboardData());
    this.startClock();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===================================================================
  // INITIALIZATION METHODS
  // ===================================================================

  private initializeUser(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser.set(user);
      });
  }

  private loadDashboardData(): void {
    this.loadingStats.set(true);

    // Load all statistics in parallel
    forkJoin({
      patientStats: this.patientService.getPatientStatistics(),
      todayAppointments: this.appointmentService.getTodayAppointments(),
      // Add other services as needed
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          // Patient Statistics
          if (results.patientStats.success) {
            this.patientStats.set(results.patientStats.data!);
          }

          // Today's Appointments
          this.todayAppointments.set(results.todayAppointments);

          this.loadingStats.set(false);
        },
        error: (error) => {
          console.error('Error loading dashboard data:', error);
          this.notificationService.error('حدث خطأ في تحميل البيانات');
          this.loadingStats.set(false);
        }
      });
  }

  private startClock(): void {
    // Update time every second
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const now = new Date();
        this.currentHijriDate.set(new Date().toLocaleDateString('ar-SA', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }));
        this.currentGregorianDate.set(new Date().toLocaleDateString('ar', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }));
        this.currentTime.set(now.toLocaleTimeString('ar-SA', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }));
      });
  }

  // ===================================================================
  // HELPER METHODS
  // ===================================================================

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'صباح الخير';
    if (hour < 17) return 'مساء الخير';
    return 'مساء الخير';
  }

  formatPercentage(value?: number): string {
    if (!value) return '0%';
    return `${value.toFixed(1)}%`;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'YER',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  calculateTrend(total: number, recent: number): number {
    if (total === 0) return 0;
    return (recent / total) * 100;
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      'SYSTEM_ADMIN': 'مدير النظام',
      'ADMIN': 'مدير العيادة',
      'DOCTOR': 'طبيب',
      'NURSE': 'ممرض',
      'RECEPTIONIST': 'موظف استقبال'
    };
    return labels[role] || role;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'SCHEDULED': 'مجدول',
      'CONFIRMED': 'مؤكد',
      'IN_PROGRESS': 'جاري',
      'COMPLETED': 'مكتمل',
      'CANCELLED': 'ملغي',
      'NO_SHOW': 'لم يحضر'
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'SCHEDULED': 'primary',
      'CONFIRMED': 'accent',
      'IN_PROGRESS': 'warn',
      'COMPLETED': 'success',
      'CANCELLED': 'error',
      'NO_SHOW': 'disabled'
    };
    return colors[status] || 'default';
  }

  getRoleDisplayName(role?: string): string {
    const roleNames: { [key: string]: string } = {
      'SYSTEM_ADMIN': 'مدير النظام',
      'ADMIN': 'مدير العيادة',
      'DOCTOR': 'طبيب',
      'NURSE': 'ممرض/ممرضة',
      'RECEPTIONIST': 'موظف استقبال'
    };

    return roleNames[role || ''] || 'مستخدم';
  }

  /**
   * Format number with Arabic numerals
   */
  formatNumber(value: number): string {
    if (value === undefined || value === null) return '0';
    return Math.round(value).toLocaleString('ar-SA');
  }

  // ===================================================================
  // ACTION METHODS
  // ===================================================================

  refreshData(): void {
    this.loadDashboardData();
  }

  exportDashboard(): void {
    // Implement export functionality
    this.notificationService.info('جاري تصدير لوحة التحكم...');
  }

  navigateToPatients(): void {
    // Navigation is handled by routerLink in template
  }

  navigateToAppointments(): void {
    // Navigation is handled by routerLink in template
  }
}
