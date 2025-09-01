// ===================================================================
// Change Password Component
// src/app/features/profile/components/change-password/change-password.component.ts
// ===================================================================

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

// Services
import { ProfileService } from '../../services/profile.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatDividerModule,
    MatSlideToggleModule,
    MatListModule,
    MatChipsModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss'
})
export class ChangePasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);

  loading = this.profileService.loading;
  profile = this.profileService.currentProfile;
  sessions = this.profileService.sessions;

  // Password visibility toggles
  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  // Password strength
  passwordStrength = signal<'weak' | 'medium' | 'strong'>('weak');
  passwordStrengthValue = signal(0);

  // Mock data
  lastTwoFactorUse = signal('2024-01-15T10:30:00Z');

  // Forms
  passwordForm!: FormGroup;
  securityQuestionsForm!: FormGroup;

  ngOnInit() {
    this.initializeForms();
    this.loadSessions();
  }

  initializeForms() {
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      logoutOtherSessions: [false]
    }, { validators: this.passwordMatchValidator });

    this.securityQuestionsForm = this.fb.group({
      question1: ['', Validators.required],
      answer1: ['', Validators.required],
      question2: ['', Validators.required],
      answer2: ['', Validators.required]
    });
  }

  passwordMatchValidator(control: AbstractControl) {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (!newPassword || !confirmPassword) {
      return null;
    }

    if (newPassword.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }

    return null;
  }

  loadSessions() {
    this.profileService.getActiveSessions().subscribe();
  }

  changePassword() {
    if (this.passwordForm.valid) {
      const { currentPassword, newPassword, logoutOtherSessions } = this.passwordForm.value;

      this.profileService.changePassword({
        currentPassword,
        newPassword,
        logoutOtherSessions
      }).subscribe(() => {
        this.resetPasswordForm();
      });
    }
  }

  resetPasswordForm() {
    this.passwordForm.reset({
      logoutOtherSessions: false
    });
    this.passwordStrength.set('weak');
    this.passwordStrengthValue.set(0);
  }

  checkPasswordStrength() {
    const password = this.passwordForm.get('newPassword')?.value || '';
    let strength = 0;

    if (this.hasMinLength()) strength += 20;
    if (this.hasUpperCase()) strength += 20;
    if (this.hasLowerCase()) strength += 20;
    if (this.hasNumber()) strength += 20;
    if (this.hasSpecialChar()) strength += 20;

    this.passwordStrengthValue.set(strength);

    if (strength <= 40) {
      this.passwordStrength.set('weak');
    } else if (strength <= 70) {
      this.passwordStrength.set('medium');
    } else {
      this.passwordStrength.set('strong');
    }
  }

  hasMinLength(): boolean {
    const password = this.passwordForm.get('newPassword')?.value || '';
    return password.length >= 8;
  }

  hasUpperCase(): boolean {
    const password = this.passwordForm.get('newPassword')?.value || '';
    return /[A-Z]/.test(password);
  }

  hasLowerCase(): boolean {
    const password = this.passwordForm.get('newPassword')?.value || '';
    return /[a-z]/.test(password);
  }

  hasNumber(): boolean {
    const password = this.passwordForm.get('newPassword')?.value || '';
    return /\d/.test(password);
  }

  hasSpecialChar(): boolean {
    const password = this.passwordForm.get('newPassword')?.value || '';
    return /[!@#$%^&*(),.?":{}|<>]/.test(password);
  }

  getPasswordStrengthLabel(): string {
    switch (this.passwordStrength()) {
      case 'weak': return 'ضعيفة';
      case 'medium': return 'متوسطة';
      case 'strong': return 'قوية';
    }
  }

  getPasswordStrengthColor(): string {
    switch (this.passwordStrength()) {
      case 'weak': return 'warn';
      case 'medium': return 'accent';
      case 'strong': return 'primary';
    }
  }

  enableTwoFactor() {
    this.profileService.enableTwoFactor().subscribe(result => {
      // Show QR code dialog
      this.notificationService.success('تم تفعيل المصادقة الثنائية بنجاح');
    });
  }

  disableTwoFactor() {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'تعطيل المصادقة الثنائية',
        message: 'هل أنت متأكد من تعطيل المصادقة الثنائية؟ سيقلل هذا من أمان حسابك.',
        confirmText: 'تعطيل',
        cancelText: 'إلغاء'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Ask for password
        this.profileService.disableTwoFactor('password').subscribe();
      }
    });
  }

  generateBackupCodes() {
    this.notificationService.info('تم توليد رموز احتياط جديدة');
  }

  terminateSession(sessionId: string) {
    this.profileService.terminateSession(sessionId).subscribe();
  }

  terminateAllSessions() {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'إنهاء جميع الجلسات',
        message: 'سيتم تسجيل خروجك من جميع الأجهزة الأخرى. هل تريد المتابعة؟',
        confirmText: 'إنهاء الجلسات',
        cancelText: 'إلغاء'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.profileService.terminateAllSessions().subscribe();
      }
    });
  }

  saveSecurityQuestions() {
    if (this.securityQuestionsForm.valid) {
      this.notificationService.success('تم حفظ أسئلة الأمان بنجاح');
    }
  }

  getDeviceIcon(deviceType: string): string {
    switch (deviceType) {
      case 'desktop': return 'computer';
      case 'mobile': return 'smartphone';
      case 'tablet': return 'tablet';
      default: return 'devices';
    }
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
}
