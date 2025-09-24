// ===================================================================
// src/app/features/users/components/user-statistics/user-statistics.component.ts
// New Component for User Statistics Dashboard
// ===================================================================
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Angular Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatGridListModule } from '@angular/material/grid-list';

// Chart Components (if available)
// import { NgChartsModule } from 'ng2-charts';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// Services & Models
import { UserService } from '../../services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { UserRole } from '../../models/user.model';

// Statistics Interfaces
interface RoleStatistic {
  role: UserRole;
  count: number;
  percentage: number;
  color: string;
  icon: string;
  label: string;
}

interface ActivityStatistic {
  label: string;
  value: number;
  icon: string;
  color: string;
  trend?: 'up' | 'down' | 'stable';
}

@Component({
  selector: 'app-user-statistics',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatGridListModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './user-statistics.component.html',
  styleUrls: ['./user-statistics.component.scss']
})
export class UserStatisticsComponent implements OnInit {

  userRole = UserRole;
  // ===================================================================
  // DEPENDENCY INJECTION
  // ===================================================================
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  // ===================================================================
  // COMPONENT STATE
  // ===================================================================
  loading = computed(() => this.userService.loading());
  error = computed(() => this.userService.error());

  // Data signals
  clinicStats = computed(() => this.userService.clinicUserStats());
  clinicUsers = computed(() => this.userService.clinicUsers());

  // UI state
  refreshing = signal(false);
  selectedPeriod = signal<'week' | 'month' | 'year'>('month');

  // ===================================================================
  // COMPUTED STATISTICS
  // ===================================================================

  currentUser = computed(() => this.authService.currentUser());
  isSystemAdmin = computed(() => this.currentUser()?.role === 'SYSTEM_ADMIN');

  // Role Distribution Statistics
  roleStatistics = computed((): RoleStatistic[] => {
    const stats = this.clinicStats();
    const users = this.clinicUsers();

    if (!stats || users.length === 0) {
      return [];
    }

    const total = stats.totalUsers;

    return [
      {
        role: UserRole.ADMIN,
        count: stats.adminCount,
        percentage: total > 0 ? (stats.adminCount / total) * 100 : 0,
        color: '#1976d2',
        icon: 'manage_accounts',
        label: 'مديرو العيادة'
      },
      {
        role: UserRole.DOCTOR,
        count: stats.doctorsCount,
        percentage: total > 0 ? (stats.doctorsCount / total) * 100 : 0,
        color: '#4caf50',
        icon: 'medical_services',
        label: 'أطباء'
      },
      {
        role: UserRole.NURSE,
        count: stats.nursesCount,
        percentage: total > 0 ? (stats.nursesCount / total) * 100 : 0,
        color: '#ff9800',
        icon: 'health_and_safety',
        label: 'ممرضين'
      },
      {
        role: UserRole.RECEPTIONIST,
        count: stats.receptionistsCount,
        percentage: total > 0 ? (stats.receptionistsCount / total) * 100 : 0,
        color: '#9c27b0',
        icon: 'support_agent',
        label: 'موظفو الاستقبال'
      }
    ].filter(stat => stat.count > 0); // Only show roles that exist
  });

  // Activity Statistics
  activityStatistics = computed((): ActivityStatistic[] => {
    const stats = this.clinicStats();
    if (!stats) return [];

    return [
      {
        label: 'إجمالي المستخدمين',
        value: stats.totalUsers,
        icon: 'people',
        color: '#1976d2'
      },
      {
        label: 'المستخدمون النشطون',
        value: stats.activeUsers,
        icon: 'check_circle',
        color: '#4caf50',
        trend: 'up'
      },
      {
        label: 'المستخدمون المعطلون',
        value: stats.inactiveUsers,
        icon: 'cancel',
        color: '#f44336',
        trend: stats.inactiveUsers > 0 ? 'down' : 'stable'
      }
    ];
  });

  // Active Users Percentage
  activeUsersPercentage = computed(() => {
    const stats = this.clinicStats();
    if (!stats || stats.totalUsers === 0) return 0;
    return Math.round((stats.activeUsers / stats.totalUsers) * 100);
  });

  // Most Active Role
  mostActiveRole = computed(() => {
    const roleStats = this.roleStatistics();
    if (roleStats.length === 0) return null;

    return roleStats.reduce((prev, current) =>
      prev.count > current.count ? prev : current
    );
  });

  // Recent Activity Metrics
  recentActivity = computed(() => {
    const stats = this.clinicStats();
    const users = this.clinicUsers();

    if (!stats) return null;

    // Calculate users registered this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const newUsersThisMonth = users.filter(user => {
      if (!user.createdAt) return false;
      const createdDate = new Date(user.createdAt);
      return createdDate >= thisMonth;
    }).length;

    // Calculate users who logged in recently
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const activeThisWeek = users.filter(user => {
      if (!user.lastLoginAt) return false;
      const lastLogin = new Date(user.lastLoginAt);
      return lastLogin >= weekAgo;
    }).length;

    return {
      newUsersThisMonth,
      activeThisWeek,
      lastRegistrationDate: stats.lastRegistrationDate
    };
  });

  // ===================================================================
  // LIFECYCLE HOOKS
  // ===================================================================
  ngOnInit(): void {
    this.loadStatistics();
  }

  // ===================================================================
  // DATA LOADING
  // ===================================================================
  async loadStatistics(): Promise<void> {
    try {
      await Promise.all([
        this.loadClinicStats(),
        this.loadClinicUsers()
      ]);
    } catch (error) {
      console.error('Error loading statistics:', error);
      this.notificationService.error('خطأ في تحميل الإحصائيات');
    }
  }

  private async loadClinicStats(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.userService.getClinicUserStats().subscribe({
        next: (response) => {
          if (response.success) {
            resolve();
          } else {
            reject(new Error(response.message));
          }
        },
        error: (error) => reject(error)
      });
    });
  }

  private async loadClinicUsers(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.userService.getClinicUsers().subscribe({
        next: (response) => {
          if (response.success) {
            resolve();
          } else {
            reject(new Error(response.message));
          }
        },
        error: (error) => reject(error)
      });
    });
  }

  // ===================================================================
  // ACTIONS
  // ===================================================================
  async refresh(): Promise<void> {
    this.refreshing.set(true);
    try {
      await this.loadStatistics();
      this.notificationService.success('تم تحديث الإحصائيات بنجاح');
    } catch (error) {
      console.error('Error refreshing statistics:', error);
      this.notificationService.error('خطأ في تحديث الإحصائيات');
    } finally {
      this.refreshing.set(false);
    }
  }

  changePeriod(period: 'week' | 'month' | 'year'): void {
    this.selectedPeriod.set(period);
    // Here you could implement period-specific data loading
    this.loadStatistics();
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================

  getRoleDisplayName(role: UserRole): string {
    return this.userService.getRoleDisplayName(role);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatPercentage(value: number): string {
    return `${Math.round(value)}%`;
  }

  getTrendIcon(trend?: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up': return 'trending_up';
      case 'down': return 'trending_down';
      case 'stable': return 'trending_flat';
      default: return 'remove';
    }
  }

  getTrendColor(trend?: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up': return '#4caf50';
      case 'down': return '#f44336';
      case 'stable': return '#ff9800';
      default: return '#666';
    }
  }

  // ===================================================================
  // CHART DATA PREPARATION (if using charts)
  // ===================================================================

  getRoleChartData() {
    const roleStats = this.roleStatistics();

    return {
      labels: roleStats.map(stat => stat.label),
      datasets: [{
        data: roleStats.map(stat => stat.count),
        backgroundColor: roleStats.map(stat => stat.color),
        borderColor: roleStats.map(stat => stat.color),
        borderWidth: 2
      }]
    };
  }

  getActivityChartData() {
    const stats = this.clinicStats();
    if (!stats) return null;

    return {
      labels: ['نشط', 'معطل'],
      datasets: [{
        data: [stats.activeUsers, stats.inactiveUsers],
        backgroundColor: ['#4caf50', '#f44336'],
        borderColor: ['#4caf50', '#f44336'],
        borderWidth: 2
      }]
    };
  }

  // Chart options
  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: 'Cairo, sans-serif'
          }
        }
      },
      title: {
        display: false
      }
    }
  };

  // ===================================================================
  // EXPORT FUNCTIONALITY
  // ===================================================================

  exportStatistics(): void {
    const stats = this.clinicStats();
    const roleStats = this.roleStatistics();

    if (!stats) {
      this.notificationService.warning('لا توجد بيانات للتصدير');
      return;
    }

    const exportData = {
      summary: {
        totalUsers: stats.totalUsers,
        activeUsers: stats.activeUsers,
        inactiveUsers: stats.inactiveUsers,
        activePercentage: this.activeUsersPercentage()
      },
      roleDistribution: roleStats.map(stat => ({
        role: stat.label,
        count: stat.count,
        percentage: stat.percentage
      })),
      mostActiveRole: this.mostActiveRole()?.label,
      lastRegistrationDate: stats.lastRegistrationDate,
      exportDate: new Date().toISOString()
    };

    // Create and download JSON file
    const blob = new Blob([JSON.stringify(exportData, null, 2)],
      { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `user-statistics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    this.notificationService.success('تم تصدير الإحصائيات بنجاح');
  }
}
