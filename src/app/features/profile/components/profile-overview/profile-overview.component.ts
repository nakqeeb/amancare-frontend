// ===================================================================
// Profile Overview Component
// src/app/features/profile/components/profile-overview/profile-overview.component.ts
// ===================================================================

import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// Services
import { ProfileService } from '../../services/profile.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

// Profile Picture Dialog Component
import { ProfilePictureComponent } from '../profile-picture/profile-picture.component';

@Component({
  selector: 'app-profile-overview',
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
    MatProgressBarModule,
    MatTooltipModule,
    MatBadgeModule,
    MatListModule,
    MatMenuModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './profile-overview.component.html',
  styleUrl: './profile-overview.component.scss'
})
export class ProfileOverviewComponent implements OnInit {
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);

  // Signals
  profile = this.profileService.currentProfile;
  loading = this.profileService.loading;
  profileCompleteness = this.profileService.profileCompleteness;
  activityHistory = this.profileService.activityHistory;

  // Computed signals
  recentActivities = computed(() => {
    return this.activityHistory().slice(0, 5);
  });

  ngOnInit() {
    this.loadProfile();
    this.loadRecentActivity();
  }

  loadProfile() {
    this.profileService.loadCurrentProfile().subscribe();
  }

  loadRecentActivity() {
    this.profileService.getActivityHistory().subscribe();
  }

  openProfilePictureDialog() {
    const dialogRef = this.dialog.open(ProfilePictureComponent, {
      width: '500px',
      data: { currentPicture: this.profile()?.profilePicture }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Profile picture updated
        this.loadProfile();
      }
    });
  }

  exportProfile() {
    this.profileService.exportProfileData('json').subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `profile-${new Date().toISOString()}.json`;
      link.click();
      window.URL.revokeObjectURL(url);
    });
  }

  getCompletenessColor(): string {
    const percentage = this.profileCompleteness();
    if (percentage >= 80) return 'primary';
    if (percentage >= 50) return 'accent';
    return 'warn';
  }

  getRoleIcon(role: string): string {
    const icons: Record<string, string> = {
      'SYSTEM_ADMIN': 'admin_panel_settings',
      'ADMIN': 'manage_accounts',
      'DOCTOR': 'medical_services',
      'NURSE': 'vaccines',
      'RECEPTIONIST': 'support_agent'
    };
    return icons[role] || 'person';
  }

  getRoleName(role: string): string {
    const names: Record<string, string> = {
      'SYSTEM_ADMIN': 'مدير النظام',
      'ADMIN': 'مدير',
      'DOCTOR': 'طبيب',
      'NURSE': 'ممرض',
      'RECEPTIONIST': 'موظف استقبال'
    };
    return names[role] || role;
  }

  getActivityIcon(action: string): string {
    const icons: Record<string, string> = {
      'LOGIN': 'login',
      'LOGOUT': 'logout',
      'PROFILE_UPDATE': 'edit',
      'PASSWORD_CHANGE': 'lock',
      'PATIENT_CREATE': 'person_add',
      'APPOINTMENT_CREATE': 'event',
      'INVOICE_CREATE': 'receipt'
    };
    return icons[action] || 'info';
  }

  formatDate(date: string): string {
    if (!date) return 'غير محدد';
    return new Date(date).toLocaleDateString('ar-SA');
  }

  formatRelativeTime(date: string): string {
    if (!date) return '';

    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 30) return `منذ ${diffDays} يوم`;

    return this.formatDate(date);
  }

  formatStorageSize(bytes: number): string {
    if (!bytes) return '0 MB';

    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}
