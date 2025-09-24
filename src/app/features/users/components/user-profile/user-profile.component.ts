// ===================================================================
// User Profile Component
// src/app/features/users/components/user-profile/user-profile.component.ts
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialog } from '@angular/material/dialog';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

// Services & Models
import { UserService } from '../../services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { User, UserRole } from '../../models/user.model';

// Activity Log Interface
interface ActivityLog {
  id: number;
  action: string;
  description: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
}

// User Statistics Interface
interface UserStatistics {
  totalLogins: number;
  lastLoginAt?: string;
  accountCreatedAt: string;
  appointmentsManaged: number;
  patientsHandled: number;
  reportsGenerated: number;
  sessionsThisMonth: number;
}

type ActionIcons = {
  [key: string]: string;
};

@Component({
  selector: 'app-user-profile',
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
    MatTooltipModule,
    MatBadgeModule,
    MatListModule,
    MatExpansionModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss'
})
export class UserProfileComponent implements OnInit {
  // Services
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);

  // Signals
  user = signal<User | null>(null);
  loading = signal(false);
  userId = signal<number | null>(null);
  currentUser = this.authService.currentUser;
  selectedTab = signal(0);

  // Mock data for activity logs and statistics
  activityLogs = signal<ActivityLog[]>([
    {
      id: 1,
      action: 'LOGIN',
      description: 'تسجيل دخول ناجح',
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0...',
      success: true
    },
    {
      id: 2,
      action: 'PATIENT_CREATE',
      description: 'إضافة مريض جديد: أحمد محمد',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      success: true
    },
    {
      id: 3,
      action: 'APPOINTMENT_UPDATE',
      description: 'تحديث موعد للمريض: فاطمة علي',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      success: true
    },
    {
      id: 4,
      action: 'REPORT_GENERATE',
      description: 'إنشاء تقرير مالي شهري',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      success: true
    },
    {
      id: 5,
      action: 'LOGIN_FAILED',
      description: 'محاولة تسجيل دخول فاشلة',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      ipAddress: '192.168.1.101',
      success: false
    }
  ]);

  userStats = signal<UserStatistics>({
    totalLogins: 234,
    lastLoginAt: new Date().toISOString(),
    accountCreatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    appointmentsManaged: 156,
    patientsHandled: 89,
    reportsGenerated: 12,
    sessionsThisMonth: 28
  });

  // Computed values
  isOwnProfile = computed(() => {
    const currentUserId = this.currentUser()?.id;
    const profileUserId = this.user()?.id;
    return currentUserId === profileUserId;
  });

  canEditUser = computed(() => {
    const currentUser = this.currentUser();
    const profileUser = this.user();

    if (!currentUser || !profileUser) return false;

    // System admin can edit anyone except themselves
    if (currentUser.role === UserRole.SYSTEM_ADMIN && !this.isOwnProfile()) {
      return true;
    }

    // Admin can edit non-admin users in their clinic
    if (currentUser.role === UserRole.ADMIN &&
      profileUser.role !== UserRole.SYSTEM_ADMIN &&
      profileUser.role !== UserRole.ADMIN &&
      !this.isOwnProfile()) {
      return true;
    }

    return false;
  });

  canResetPassword = computed(() => {
    return this.canEditUser() && !this.isOwnProfile();
  });

  canToggleStatus = computed(() => {
    return this.canEditUser() && !this.isOwnProfile();
  });

  recentActivities = computed(() => {
    return this.activityLogs().slice(0, 5);
  });

  ngOnInit(): void {
    this.loadUserProfile();
  }

  private loadUserProfile(): void {
    const userIdParam = this.route.snapshot.paramMap.get('id');
    if (!userIdParam) {
      this.router.navigate(['/users']);
      return;
    }

    const userId = parseInt(userIdParam, 10);
    this.userId.set(userId);
    this.loading.set(true);

    this.userService.getClinicUserById(userId).subscribe({
      next: (res) => {
        this.user.set(res.data!);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
        this.loading.set(false);
        this.router.navigate(['/users']);
      }
    });
  }

  // Navigation methods
  onEditUser(): void {
    if (!this.user()?.id) return;
    this.router.navigate(['/users/edit', this.user()!.id]);
  }

  onBackToList(): void {
    this.router.navigate(['/users']);
  }

  // User actions
  onResetPassword(): void {
    const user = this.user();
    if (!user) return;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'إعادة تعيين كلمة المرور',
        message: `هل أنت متأكد من إعادة تعيين كلمة المرور للمستخدم "${user.fullName}"؟`,
        confirmText: 'إعادة تعيين',
        cancelText: 'إلغاء',
        type: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && user.id) {
        this.userService.resetUserPassword(user.id).subscribe({
          next: (response) => {
            this.notificationService.success(
              `تم إعادة تعيين كلمة المرور. كلمة المرور المؤقتة: ${response.temporaryPassword}`
            );
          }
        });
      }
    });
  }

  onToggleStatus(): void {
    const user = this.user();
    if (!user) return;

    const action = user.isActive ? 'إلغاء تفعيل' : 'تفعيل';
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: `${action} المستخدم`,
        message: `هل أنت متأكد من ${action} المستخدم "${user.fullName}"؟`,
        confirmText: action,
        cancelText: 'إلغاء',
        type: user.isActive ? 'warn' : 'primary'
      }
    });

    // dialogRef.afterClosed().subscribe(result => {
    //   if (result && user.id) {
    //     const operation = user.isActive ?
    //       this.userService.deactivateUser(user.id) :
    //       this.userService.activateUser(user.id);

    //     operation.subscribe({
    //       next: (updatedUser) => {
    //         this.user.set(updatedUser);
    //       }
    //     });
    //   }
    // });
  }

  onSendNotification(): void {
    // TODO: Implement send notification functionality
    this.notificationService.info('ميزة إرسال الإشعارات ستتوفر قريباً');
  }

  onViewFullActivityLog(): void {
    // TODO: Navigate to full activity log page
    this.notificationService.info('صفحة سجل الأنشطة الكامل ستتوفر قريباً');
  }

  // Utility methods
  getRoleDisplayName(role: UserRole): string {
    return this.userService.getRoleDisplayName(role);
  }

  getRoleIcon(role: UserRole): string {
    const roleIcons = {
      [UserRole.SYSTEM_ADMIN]: 'admin_panel_settings',
      [UserRole.ADMIN]: 'manage_accounts',
      [UserRole.DOCTOR]: 'local_hospital',
      [UserRole.NURSE]: 'healing',
      [UserRole.RECEPTIONIST]: 'person'
    };
    return roleIcons[role] || 'person';
  }

  getRoleColor(role: UserRole): string {
    const roleColors = {
      [UserRole.SYSTEM_ADMIN]: 'warn',
      [UserRole.ADMIN]: 'primary',
      [UserRole.DOCTOR]: 'accent',
      [UserRole.NURSE]: 'primary',
      [UserRole.RECEPTIONIST]: 'basic'
    };
    return roleColors[role] || 'basic';
  }

  getStatusColor(isActive: boolean): string {
    return isActive ? 'primary' : 'warn';
  }

  getStatusIcon(isActive: boolean): string {
    return isActive ? 'check_circle' : 'cancel';
  }

  getActivityIcon(action: string): string {
    const actionIcons: ActionIcons = {
      'LOGIN': 'login',
      'LOGIN_FAILED': 'error',
      'LOGOUT': 'logout',
      'PATIENT_CREATE': 'person_add',
      'PATIENT_UPDATE': 'person',
      'APPOINTMENT_CREATE': 'event_available',
      'APPOINTMENT_UPDATE': 'event',
      'APPOINTMENT_CANCEL': 'event_busy',
      'REPORT_GENERATE': 'assessment',
      'INVOICE_CREATE': 'receipt',
      'INVOICE_UPDATE': 'receipt',
      'MEDICAL_RECORD_CREATE': 'folder_special',
      'MEDICAL_RECORD_UPDATE': 'edit_note',
      'PASSWORD_CHANGE': 'key',
      'PROFILE_UPDATE': 'edit'
    };
    return actionIcons[action] || 'info';
  }

  getActivityColor(success: boolean): string {
    return success ? 'primary' : 'warn';
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'الآن';
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
    if (diffInDays < 30) return `منذ ${diffInDays} يوم`;

    return this.formatDate(dateString);
  }

  onTabChange(index: number): void {
    this.selectedTab.set(index);
  }

  // Export user data
  onExportUserData(): void {
    // TODO: Implement export user data functionality
    this.notificationService.info('ميزة تصدير بيانات المستخدم ستتوفر قريباً');
  }

  // Print user profile
  onPrintProfile(): void {
    window.print();
  }
}
