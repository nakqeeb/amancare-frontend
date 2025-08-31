// ===================================================================
// Clinic Settings Component
// src/app/features/clinics/components/clinic-settings/clinic-settings.component.ts
// ===================================================================

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

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
  UpdateClinicRequest,
  WorkingDay,
  WORKING_DAYS_CONFIG
} from '../../models/clinic.model';
import { MatListModule } from '@angular/material/list';

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  appointmentReminders: boolean;
  paymentNotifications: boolean;
  systemUpdates: boolean;
  maintenanceAlerts: boolean;
}

interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: number; // minutes
  passwordPolicy: {
    minLength: number;
    requireNumbers: boolean;
    requireSymbols: boolean;
    requireUppercase: boolean;
  };
  ipWhitelist: string[];
}

interface BackupSettings {
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  retentionPeriod: number; // days
  includeAttachments: boolean;
}

@Component({
  selector: 'app-clinic-settings',
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
    MatCheckboxModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    MatChipsModule,
    MatExpansionModule,
    MatDialogModule,
    MatListModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './clinic-settings.component.html',
  styleUrl: './clinic-settings.component.scss'
})
export class ClinicSettingsComponent implements OnInit {
  // Services
  private clinicService = inject(ClinicService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  // Signals
  loading = signal(false);
  saving = signal(false);
  clinic = signal<Clinic | null>(null);
  selectedTab = signal(0);

  // Forms
  basicSettingsForm!: FormGroup;
  workingHoursForm!: FormGroup;
  notificationForm!: FormGroup;
  securityForm!: FormGroup;
  backupForm!: FormGroup;

  // Settings Objects
  notificationSettings = signal<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: true,
    appointmentReminders: true,
    paymentNotifications: true,
    systemUpdates: false,
    maintenanceAlerts: true
  });

  securitySettings = signal<SecuritySettings>({
    twoFactorAuth: false,
    sessionTimeout: 60,
    passwordPolicy: {
      minLength: 8,
      requireNumbers: true,
      requireSymbols: false,
      requireUppercase: true
    },
    ipWhitelist: []
  });

  backupSettings = signal<BackupSettings>({
    autoBackup: true,
    backupFrequency: 'daily',
    retentionPeriod: 30,
    includeAttachments: true
  });

  // Enums for template
  WorkingDay = WorkingDay;
  WORKING_DAYS_CONFIG = WORKING_DAYS_CONFIG;

  // Working days options
  workingDaysOptions = Object.values(WorkingDay);

  ngOnInit(): void {
    this.initializeForms();
    this.loadClinic();
  }

  private initializeForms(): void {
    // Basic Settings Form
    this.basicSettingsForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      address: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^(\+966|0)?[0-9]{9}$/)]],
      email: ['', [Validators.required, Validators.email]],
      website: [''],
      timezone: ['Asia/Riyadh'],
      language: ['ar'],
      currency: ['SAR']
    });

    // Working Hours Form
    this.workingHoursForm = this.fb.group({
      workingHoursStart: ['09:00', Validators.required],
      workingHoursEnd: ['17:00', Validators.required],
      workingDays: [
        [WorkingDay.SUNDAY, WorkingDay.MONDAY, WorkingDay.TUESDAY, WorkingDay.WEDNESDAY, WorkingDay.THURSDAY],
        Validators.required
      ]
    });

    // Notification Settings Form
    this.notificationForm = this.fb.group({
      emailNotifications: [true],
      smsNotifications: [true],
      appointmentReminders: [true],
      paymentNotifications: [true],
      systemUpdates: [false],
      maintenanceAlerts: [true]
    });

    // Security Settings Form
    this.securityForm = this.fb.group({
      twoFactorAuth: [false],
      sessionTimeout: [60, [Validators.min(15), Validators.max(480)]],
      minPasswordLength: [8, [Validators.min(6), Validators.max(20)]],
      requireNumbers: [true],
      requireSymbols: [false],
      requireUppercase: [true]
    });

    // Backup Settings Form
    this.backupForm = this.fb.group({
      autoBackup: [true],
      backupFrequency: ['daily'],
      retentionPeriod: [30, [Validators.min(7), Validators.max(365)]],
      includeAttachments: [true]
    });
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
        this.populateForms(clinic);
        this.loading.set(false);
      },
      error: (error) => {
        this.notificationService.error('فشل في تحميل بيانات العيادة');
        console.error('Error loading clinic:', error);
        this.router.navigate(['/clinics']);
      }
    });
  }

  private populateForms(clinic: Clinic): void {
    // Basic Settings
    this.basicSettingsForm.patchValue({
      name: clinic.name,
      description: clinic.description,
      address: clinic.address,
      phone: clinic.phone,
      email: clinic.email,
      website: clinic.website,
      timezone: clinic.timezone,
      language: clinic.language,
      currency: clinic.currency
    });

    // Working Hours
    this.workingHoursForm.patchValue({
      workingHoursStart: clinic.workingHoursStart,
      workingHoursEnd: clinic.workingHoursEnd,
      workingDays: clinic.workingDays
    });

    // Load saved settings (in real implementation, these would come from the API)
    this.loadSavedSettings();
  }

  private loadSavedSettings(): void {
    // In real implementation, load these from the API
    // For now, use default values already set in signals
  }

  // ===================================================================
  // EVENT HANDLERS
  // ===================================================================

  onTabChange(index: number): void {
    this.selectedTab.set(index);
  }

  onWorkingDayToggle(day: WorkingDay, event: any): void {
    const workingDays = this.workingHoursForm.get('workingDays')?.value || [];

    if (event.checked) {
      if (!workingDays.includes(day)) {
        workingDays.push(day);
      }
    } else {
      const index = workingDays.indexOf(day);
      if (index > -1) {
        workingDays.splice(index, 1);
      }
    }

    this.workingHoursForm.patchValue({ workingDays });
  }

  onSaveBasicSettings(): void {
    if (this.basicSettingsForm.invalid) {
      this.notificationService.error('يرجى التحقق من صحة البيانات المدخلة');
      return;
    }

    this.saving.set(true);
    const clinic = this.clinic();
    if (!clinic) return;

    const request: UpdateClinicRequest = this.basicSettingsForm.value;

    this.clinicService.updateClinic(clinic.id, request).subscribe({
      next: (updatedClinic) => {
        this.clinic.set(updatedClinic);
        this.notificationService.success('تم حفظ الإعدادات الأساسية بنجاح');
        this.saving.set(false);
      },
      error: (error) => {
        this.notificationService.error('فشل في حفظ الإعدادات');
        console.error('Error saving settings:', error);
        this.saving.set(false);
      }
    });
  }

  onSaveWorkingHours(): void {
    if (this.workingHoursForm.invalid) {
      this.notificationService.error('يرجى التحقق من ساعات العمل وأيام التشغيل');
      return;
    }

    this.saving.set(true);
    const clinic = this.clinic();
    if (!clinic) return;

    const request: UpdateClinicRequest = this.workingHoursForm.value;

    this.clinicService.updateClinic(clinic.id, request).subscribe({
      next: (updatedClinic) => {
        this.clinic.set(updatedClinic);
        this.notificationService.success('تم حفظ ساعات العمل بنجاح');
        this.saving.set(false);
      },
      error: (error) => {
        this.notificationService.error('فشل في حفظ ساعات العمل');
        console.error('Error saving working hours:', error);
        this.saving.set(false);
      }
    });
  }

  onSaveNotificationSettings(): void {
    // In real implementation, save to API
    this.notificationSettings.set(this.notificationForm.value);
    this.notificationService.success('تم حفظ إعدادات الإشعارات بنجاح');
  }

  onSaveSecuritySettings(): void {
    if (this.securityForm.invalid) {
      this.notificationService.error('يرجى التحقق من إعدادات الأمان');
      return;
    }

    // In real implementation, save to API
    const formValue = this.securityForm.value;
    this.securitySettings.set({
      twoFactorAuth: formValue.twoFactorAuth,
      sessionTimeout: formValue.sessionTimeout,
      passwordPolicy: {
        minLength: formValue.minPasswordLength,
        requireNumbers: formValue.requireNumbers,
        requireSymbols: formValue.requireSymbols,
        requireUppercase: formValue.requireUppercase
      },
      ipWhitelist: this.securitySettings().ipWhitelist
    });

    this.notificationService.success('تم حفظ إعدادات الأمان بنجاح');
  }

  onSaveBackupSettings(): void {
    if (this.backupForm.invalid) {
      this.notificationService.error('يرجى التحقق من إعدادات النسخ الاحتياطي');
      return;
    }

    // In real implementation, save to API
    this.backupSettings.set(this.backupForm.value);
    this.notificationService.success('تم حفظ إعدادات النسخ الاحتياطي بنجاح');
  }

  onTestNotifications(): void {
    this.notificationService.success('تم إرسال إشعار تجريبي بنجاح');
  }

  onCreateBackupNow(): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'إنشاء نسخة احتياطية',
        message: 'هل تريد إنشاء نسخة احتياطية فورية من بيانات العيادة؟',
        confirmText: 'إنشاء',
        cancelText: 'إلغاء'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // In real implementation, trigger backup
        this.notificationService.success('تم بدء عملية إنشاء النسخة الاحتياطية');
      }
    });
  }

  onResetSettings(settingsType: string): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'إعادة تعيين الإعدادات',
        message: `هل تريد إعادة تعيين ${this.getSettingsTypeName(settingsType)} إلى القيم الافتراضية؟`,
        confirmText: 'إعادة تعيين',
        cancelText: 'إلغاء',
        isDangerous: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.resetToDefaults(settingsType);
      }
    });
  }

  private resetToDefaults(settingsType: string): void {
    switch (settingsType) {
      case 'notification':
        this.notificationForm.reset();
        this.initializeForms();
        this.notificationService.success('تم إعادة تعيين إعدادات الإشعارات');
        break;
      case 'security':
        this.securityForm.reset();
        this.initializeForms();
        this.notificationService.success('تم إعادة تعيين إعدادات الأمان');
        break;
      case 'backup':
        this.backupForm.reset();
        this.initializeForms();
        this.notificationService.success('تم إعادة تعيين إعدادات النسخ الاحتياطي');
        break;
    }
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================

  isWorkingDaySelected(day: WorkingDay): boolean {
    const workingDays = this.workingHoursForm.get('workingDays')?.value || [];
    return workingDays.includes(day);
  }

  getWorkingDayName(day: WorkingDay): string {
    return WORKING_DAYS_CONFIG[day].name;
  }

  getFormErrorMessage(formName: string, fieldName: string): string {
    const form = (this as any)[`${formName}Form`] as FormGroup;
    const field = form.get(fieldName);

    if (!field?.errors || !field.touched) return '';

    const errors = field.errors;

    if (errors['required']) return 'هذا الحقل مطلوب';
    if (errors['email']) return 'البريد الإلكتروني غير صحيح';
    if (errors['pattern']) return 'تنسيق البيانات غير صحيح';
    if (errors['min']) return `الحد الأدنى ${errors['min'].min}`;
    if (errors['max']) return `الحد الأقصى ${errors['max'].max}`;
    if (errors['minLength']) return `الحد الأدنى ${errors['minLength'].requiredLength} أحرف`;

    return 'البيانات غير صحيحة';
  }

  hasFormError(formName: string, fieldName: string): boolean {
    const form = (this as any)[`${formName}Form`] as FormGroup;
    const field = form.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  private getSettingsTypeName(type: string): string {
    switch (type) {
      case 'notification': return 'إعدادات الإشعارات';
      case 'security': return 'إعدادات الأمان';
      case 'backup': return 'إعدادات النسخ الاحتياطي';
      default: return 'الإعدادات';
    }
  }

  onGoBack(): void {
    const clinic = this.clinic();
    if (clinic) {
      this.router.navigate(['/clinics', clinic.id]);
    } else {
      this.router.navigate(['/clinics']);
    }
  }
}
