// ===================================================================
// Clinic Details Component
// src/app/features/clinics/components/clinic-details/clinic-details.component.ts
// ===================================================================

import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

// Services & Models
import { ClinicService } from '../../services/clinic.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  Clinic,
  ClinicService as ClinicServiceModel,
  SubscriptionPlan,
  WorkingDay,
  SUBSCRIPTION_FEATURES,
  WORKING_DAYS_CONFIG
} from '../../models/clinic.model';

interface RecentActivity {
  id: number;
  type: 'user_added' | 'patient_registered' | 'appointment_created' | 'payment_received' | 'setting_changed';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
}

interface QuickStat {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

@Component({
  selector: 'app-clinic-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatDividerModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    MatBadgeModule,
    MatListModule,
    MatExpansionModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './clinic-details.component.html',
  styleUrl: './clinic-details.component.scss'
})
export class ClinicDetailsComponent implements OnInit {
  // Services
  private clinicService = inject(ClinicService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);

  // Signals
  loading = signal(false);
  clinic = signal<Clinic | null>(null);
  clinicServices = signal<ClinicServiceModel[]>([]);
  recentActivities = signal<RecentActivity[]>([]);
  selectedTab = signal(0);

  // Computed signals
  subscriptionFeatures = computed(() => {
    const clinic = this.clinic();
    return clinic ? SUBSCRIPTION_FEATURES[clinic.subscriptionPlan] : null;
  });

  workingDaysNames = computed(() => {
    const clinic = this.clinic();
    return clinic ? clinic.workingDays.map(day => WORKING_DAYS_CONFIG[day].name) : [];
  });

  quickStats = computed((): QuickStat[] => {
    const clinic = this.clinic();
    if (!clinic) return [];

    return [
      {
        label: 'المستخدمين النشطين',
        value: clinic.totalUsers || 0,
        icon: 'people',
        color: 'primary',
        trend: { value: 12, isPositive: true }
      },
      {
        label: 'المرضى المسجلين',
        value: clinic.totalPatients || 0,
        icon: 'person',
        color: 'accent',
        trend: { value: 8, isPositive: true }
      },
      {
        label: 'المواعيد الشهرية',
        value: clinic.totalAppointments || 0,
        icon: 'calendar_today',
        color: 'primary'
      },
      {
        label: 'الإيرادات الشهرية',
        value: this.formatRevenue(clinic.monthlyRevenue || 0),
        icon: 'attach_money',
        color: 'accent',
        trend: { value: 15, isPositive: true }
      }
    ];
  });

  // Enums for template
  SubscriptionPlan = SubscriptionPlan;
  SUBSCRIPTION_FEATURES = SUBSCRIPTION_FEATURES;

  ngOnInit(): void {
    this.loadClinic();
  }

  private loadClinic(): void {
    const clinicId = this.route.snapshot.paramMap.get('id');
    if (!clinicId) {
      this.router.navigate(['/clinics']);
      return;
    }

    this.loading.set(true);
    this.clinicService.getClinicById(+clinicId).subscribe({
      next: (clinic) => {
        this.clinic.set(clinic);
        this.loadAdditionalData(clinic.id);
        this.loading.set(false);
      },
      error: (error) => {
        this.notificationService.error('فشل في تحميل بيانات العيادة');
        console.error('Error loading clinic:', error);
        this.router.navigate(['/clinics']);
      }
    });
  }

  private loadAdditionalData(clinicId: number): void {
    // Load clinic services
    this.clinicService.getClinicServices(clinicId).subscribe({
      next: (services) => {
        this.clinicServices.set(services);
      },
      error: (error) => {
        console.error('Error loading clinic services:', error);
      }
    });

    // Load recent activities (mock data)
    this.loadRecentActivities();
  }

  private loadRecentActivities(): void {
    // Mock recent activities
    const mockActivities: RecentActivity[] = [
      {
        id: 1,
        type: 'user_added',
        title: 'إضافة مستخدم جديد',
        description: 'تم إضافة الدكتورة فاطمة أحمد كطبيب أسنان',
        timestamp: '2024-01-15T10:30:00Z',
        icon: 'person_add',
        color: 'primary'
      },
      {
        id: 2,
        type: 'patient_registered',
        title: 'تسجيل مريض جديد',
        description: '3 مرضى جدد تم تسجيلهم اليوم',
        timestamp: '2024-01-15T09:15:00Z',
        icon: 'person_add_alt',
        color: 'accent'
      },
      {
        id: 3,
        type: 'payment_received',
        title: 'دفعة مالية مستلمة',
        description: 'تم استلام 1,500 ريال من فواتير اليوم',
        timestamp: '2024-01-15T08:45:00Z',
        icon: 'payment',
        color: 'primary'
      },
      {
        id: 4,
        type: 'appointment_created',
        title: 'مواعيد جديدة',
        description: '12 موعد جديد تم حجزهم لهذا الأسبوع',
        timestamp: '2024-01-14T16:20:00Z',
        icon: 'event',
        color: 'accent'
      },
      {
        id: 5,
        type: 'setting_changed',
        title: 'تحديث الإعدادات',
        description: 'تم تحديث ساعات العمل للعيادة',
        timestamp: '2024-01-14T14:10:00Z',
        icon: 'settings',
        color: 'warn'
      }
    ];

    this.recentActivities.set(mockActivities);
  }

  // ===================================================================
  // EVENT HANDLERS
  // ===================================================================

  onEditClinic(): void {
    const clinic = this.clinic();
    if (clinic) {
      this.router.navigate(['/clinics', clinic.id, 'edit']);
    }
  }

  onClinicSettings(): void {
    const clinic = this.clinic();
    if (clinic) {
      this.router.navigate(['/clinics', clinic.id, 'settings']);
    }
  }

  onManageUsers(): void {
    const clinic = this.clinic();
    if (clinic) {
      this.router.navigate(['/clinics', clinic.id, 'users']);
    }
  }

  onManageServices(): void {
    const clinic = this.clinic();
    if (clinic) {
      this.router.navigate(['/clinics', clinic.id, 'services']);
    }
  }

  onViewAnalytics(): void {
    const clinic = this.clinic();
    if (clinic) {
      this.router.navigate(['/clinics', clinic.id, 'analytics']);
    }
  }

  onToggleStatus(): void {
    const clinic = this.clinic();
    if (!clinic) return;

    const action = clinic.isActive ? 'إلغاء تفعيل' : 'تفعيل';
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: `${action} العيادة`,
        message: `هل أنت متأكد من ${action} عيادة "${clinic.name}"؟`,
        confirmText: action,
        cancelText: 'إلغاء'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && clinic) {
        this.clinicService.toggleClinicStatus(clinic.id).subscribe({
          next: (updatedClinic) => {
            this.clinic.set(updatedClinic);
            this.notificationService.success(`تم ${action} العيادة بنجاح`);
          },
          error: (error) => {
            this.notificationService.error(`فشل في ${action} العيادة`);
            console.error('Error toggling clinic status:', error);
          }
        });
      }
    });
  }

  onDeleteClinic(): void {
    const clinic = this.clinic();
    if (!clinic) return;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'حذف العيادة',
        message: `هل أنت متأكد من حذف عيادة "${clinic.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`,
        confirmText: 'حذف',
        cancelText: 'إلغاء',
        isDangerous: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && clinic) {
        this.clinicService.deleteClinic(clinic.id).subscribe({
          next: () => {
            this.notificationService.success('تم حذف العيادة بنجاح');
            this.router.navigate(['/clinics']);
          },
          error: (error) => {
            this.notificationService.error('فشل في حذف العيادة');
            console.error('Error deleting clinic:', error);
          }
        });
      }
    });
  }

  onRefreshData(): void {
    const clinic = this.clinic();
    if (clinic) {
      this.loadAdditionalData(clinic.id);
      this.notificationService.success('تم تحديث البيانات بنجاح');
    }
  }

  onTabChange(index: number): void {
    this.selectedTab.set(index);
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================

  formatRevenue(amount: number): string {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(dateString));
  }

  formatTime(timeString: string): string {
    return new Intl.DateTimeFormat('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(new Date(`2000-01-01T${timeString}:00`));
  }

  formatDateTime(dateTimeString: string): string {
    const date = new Date(dateTimeString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `منذ ${diffMinutes} دقيقة`;
    } else if (diffHours < 24) {
      return `منذ ${diffHours} ساعة`;
    } else if (diffDays < 7) {
      return `منذ ${diffDays} يوم`;
    } else {
      return this.formatDate(dateTimeString);
    }
  }

  getStatusColor(): string {
    const clinic = this.clinic();
    return clinic?.isActive ? 'primary' : 'warn';
  }

  getStatusText(): string {
    const clinic = this.clinic();
    return clinic?.isActive ? 'نشطة' : 'غير نشطة';
  }

  getStatusIcon(): string {
    const clinic = this.clinic();
    return clinic?.isActive ? 'check_circle' : 'cancel';
  }

  getSubscriptionColor(): string {
    const clinic = this.clinic();
    return clinic ? SUBSCRIPTION_FEATURES[clinic.subscriptionPlan].color : 'primary';
  }

  getDaysUntilExpiry(): number {
    const clinic = this.clinic();
    if (!clinic?.subscriptionEndDate) return 0;

    const endDate = new Date(clinic.subscriptionEndDate);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }

  isSubscriptionExpiringSoon(): boolean {
    return this.getDaysUntilExpiry() <= 30;
  }

  getActivityIcon(activity: RecentActivity): string {
    return activity.icon;
  }

  getActivityColor(activity: RecentActivity): string {
    return activity.color;
  }
}
