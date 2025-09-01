// ===================================================================
// Notification Preferences Component
// src/app/features/profile/components/notification-preferences/notification-preferences.component.ts
// ===================================================================

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// Services
import { ProfileService } from '../../services/profile.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-notification-preferences',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatRadioModule,
    MatDividerModule,
    MatExpansionModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './notification-preferences.component.html',
  styleUrl: './notification-preferences.component.scss'
})
export class NotificationPreferencesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);
  private notificationService = inject(NotificationService);

  loading = this.profileService.loading;
  profile = this.profileService.currentProfile;

  // Master toggles
  masterEmailEnabled = signal(true);
  masterSmsEnabled = signal(true);
  masterPushEnabled = signal(true);
  masterInAppEnabled = signal(true);

  // Push permission
  pushPermissionGranted = signal(false);

  // SMS limits
  smsLimit = signal(100);
  smsRemaining = signal(85);

  // Forms
  emailForm!: FormGroup;
  smsForm!: FormGroup;
  pushForm!: FormGroup;
  inAppForm!: FormGroup;

  ngOnInit() {
    this.initializeForms();
    this.loadSettings();
    this.checkPushPermission();
  }

  initializeForms() {
    this.emailForm = this.fb.group({
      appointments: [true],
      patients: [true],
      invoices: [true],
      reports: [false],
      systemUpdates: [true],
      reminders: [true],
      digest: ['daily']
    });

    this.smsForm = this.fb.group({
      appointments: [true],
      urgentAlerts: [true]
    });

    this.pushForm = this.fb.group({
      appointments: [true],
      messages: [true],
      alerts: [true],
      quietHoursEnabled: [false],
      quietHoursStart: ['22:00'],
      quietHoursEnd: ['07:00']
    });

    this.inAppForm = this.fb.group({
      showToasts: [true],
      playSound: [true],
      showBadge: [true],
      position: ['bottom-right'],
      duration: ['5000']
    });
  }

  loadSettings() {
    const profile = this.profile();
    if (profile?.preferences) {
      const prefs = profile.preferences;

      // Set master toggles
      this.masterEmailEnabled.set(prefs.emailNotifications.enabled);
      this.masterSmsEnabled.set(prefs.smsNotifications.enabled);
      this.masterPushEnabled.set(prefs.pushNotifications.enabled);
      this.masterInAppEnabled.set(prefs.inAppNotifications.enabled);

      // Set email preferences
      this.emailForm.patchValue({
        appointments: prefs.emailNotifications.appointments,
        patients: prefs.emailNotifications.patients,
        invoices: prefs.emailNotifications.invoices,
        reports: prefs.emailNotifications.reports,
        systemUpdates: prefs.emailNotifications.systemUpdates,
        reminders: prefs.emailNotifications.reminders,
        digest: prefs.emailNotifications.digest || 'daily'
      });

      // Set SMS preferences
      this.smsForm.patchValue({
        appointments: prefs.smsNotifications.appointments,
        urgentAlerts: true
      });

      // Set push preferences
      this.pushForm.patchValue({
        appointments: prefs.pushNotifications.appointments,
        messages: true,
        alerts: true
      });

      // Set in-app preferences
      this.inAppForm.patchValue({
        showToasts: true,
        playSound: true,
        showBadge: true,
        position: 'bottom-right',
        duration: '5000'
      });
    }
  }

  toggleMasterEmail(enabled: boolean) {
    this.masterEmailEnabled.set(enabled);
    if (!enabled) {
      this.emailForm.disable();
    } else {
      this.emailForm.enable();
    }
  }

  toggleMasterSms(enabled: boolean) {
    this.masterSmsEnabled.set(enabled);
    if (!enabled) {
      this.smsForm.disable();
    } else {
      this.smsForm.enable();
    }
  }

  toggleMasterPush(enabled: boolean) {
    this.masterPushEnabled.set(enabled);
    if (!enabled) {
      this.pushForm.disable();
    } else {
      this.pushForm.enable();
    }
  }

  toggleMasterInApp(enabled: boolean) {
    this.masterInAppEnabled.set(enabled);
    if (!enabled) {
      this.inAppForm.disable();
    } else {
      this.inAppForm.enable();
    }
  }

  checkPushPermission() {
    if ('Notification' in window) {
      this.pushPermissionGranted.set(Notification.permission === 'granted');
    }
  }

  async requestPushPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      this.pushPermissionGranted.set(permission === 'granted');

      if (permission === 'granted') {
        this.notificationService.success('تم تفعيل الإشعارات الفورية');
      } else {
        this.notificationService.error('تم رفض الإذن للإشعارات');
      }
    }
  }

  sendTestNotification(type: 'email' | 'sms' | 'push' | 'inapp') {
    switch (type) {
      case 'email':
        this.notificationService.info('تم إرسال بريد إلكتروني تجريبي إلى ' + this.profile()?.email);
        break;
      case 'sms':
        this.notificationService.info('تم إرسال رسالة نصية تجريبية إلى ' + this.profile()?.phone);
        break;
      case 'push':
        if (this.pushPermissionGranted()) {
          new Notification('إشعار تجريبي', {
            body: 'هذا إشعار تجريبي من نظام أمان كير',
            icon: '/assets/icons/icon-192x192.png',
            badge: '/assets/icons/badge-72x72.png'
          });
        }
        break;
      case 'inapp':
        this.notificationService.success('هذا إشعار تجريبي داخل التطبيق');
        break;
    }
  }

  saveAllSettings() {
    // Prepare email notification settings
    const emailSettings = {
      enabled: this.masterEmailEnabled(),
      ...this.emailForm.value
    };

    // Prepare SMS notification settings
    const smsSettings = {
      enabled: this.masterSmsEnabled(),
      ...this.smsForm.value
    };

    // Prepare push notification settings
    const pushSettings = {
      enabled: this.masterPushEnabled(),
      ...this.pushForm.value
    };

    // Prepare in-app notification settings
    const inAppSettings = {
      enabled: this.masterInAppEnabled(),
      ...this.inAppForm.value
    };

    // Save each type of notification settings
    Promise.all([
      this.profileService.updateNotificationSettings('email', emailSettings).toPromise(),
      this.profileService.updateNotificationSettings('sms', smsSettings).toPromise(),
      this.profileService.updateNotificationSettings('push', pushSettings).toPromise(),
      this.profileService.updateNotificationSettings('inApp', inAppSettings).toPromise()
    ]).then(() => {
      this.notificationService.success('تم حفظ جميع إعدادات الإشعارات');
    }).catch(() => {
      this.notificationService.error('حدث خطأ في حفظ الإعدادات');
    });
  }
}
