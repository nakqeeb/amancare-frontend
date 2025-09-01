// ===================================================================
// Profile Settings Component
// src/app/features/profile/components/profile-settings/profile-settings.component.ts
// ===================================================================

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// Services
import { ProfileService } from '../../services/profile.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { UpdatePreferencesRequest } from '../../models/profile.model';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatFormFieldModule,
    MatRadioModule,
    MatDividerModule,
    MatExpansionModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './profile-settings.component.html',
  styleUrl: './profile-settings.component.scss'
})
export class ProfileSettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);
  private notificationService = inject(NotificationService);
  private themeService = inject(ThemeService);

  loading = this.profileService.loading;
  profile = this.profileService.currentProfile;
  favoriteModules = signal<string[]>([]);

  // Form groups
  appearanceForm!: FormGroup;
  regionalForm!: FormGroup;
  dashboardForm!: FormGroup;
  privacyForm!: FormGroup;
  accessibilityForm!: FormGroup;

  // Available modules for favorites
  availableModules = [
    { id: 'dashboard', name: 'لوحة التحكم', icon: 'dashboard' },
    { id: 'appointments', name: 'المواعيد', icon: 'event' },
    { id: 'patients', name: 'المرضى', icon: 'people' },
    { id: 'medical-records', name: 'السجلات الطبية', icon: 'medical_services' },
    { id: 'invoices', name: 'الفواتير', icon: 'receipt' },
    { id: 'reports', name: 'التقارير', icon: 'assessment' },
    { id: 'clinics', name: 'العيادات', icon: 'local_hospital' },
    { id: 'users', name: 'المستخدمين', icon: 'group' }
  ];

  ngOnInit() {
    this.initializeForms();
    this.loadSettings();
  }

  initializeForms() {
    this.appearanceForm = this.fb.group({
      theme: ['light'],
      language: ['ar'],
      fontSize: ['medium']
    });

    this.regionalForm = this.fb.group({
      timezone: ['Asia/Riyadh'],
      dateFormat: ['DD/MM/YYYY'],
      timeFormat: ['12h'],
      firstDayOfWeek: [6],
      currency: ['SAR']
    });

    this.dashboardForm = this.fb.group({
      dashboardLayout: ['expanded'],
      defaultLandingPage: ['/dashboard']
    });

    this.privacyForm = this.fb.group({
      profileVisibility: ['clinic'],
      showOnlineStatus: [true],
      allowMessages: [true],
      shareActivityStatus: [false]
    });

    this.accessibilityForm = this.fb.group({
      highContrast: [false],
      reduceMotion: [false],
      screenReaderMode: [false],
      keyboardShortcuts: [true]
    });
  }

  loadSettings() {
    const profile = this.profile();
    if (profile?.preferences) {
      const prefs = profile.preferences;

      this.appearanceForm.patchValue({
        theme: prefs.theme,
        language: prefs.language,
        fontSize: prefs.fontSize
      });

      this.regionalForm.patchValue({
        timezone: prefs.timezone,
        dateFormat: prefs.dateFormat,
        timeFormat: prefs.timeFormat,
        firstDayOfWeek: prefs.firstDayOfWeek,
        currency: prefs.currency
      });

      this.dashboardForm.patchValue({
        dashboardLayout: prefs.dashboardLayout,
        defaultLandingPage: prefs.defaultLandingPage
      });

      this.privacyForm.patchValue({
        profileVisibility: prefs.profileVisibility,
        showOnlineStatus: prefs.showOnlineStatus,
        allowMessages: prefs.allowMessages,
        shareActivityStatus: prefs.shareActivityStatus
      });

      this.accessibilityForm.patchValue({
        highContrast: prefs.highContrast,
        reduceMotion: prefs.reduceMotion,
        screenReaderMode: prefs.screenReaderMode,
        keyboardShortcuts: prefs.keyboardShortcuts
      });

      if (prefs.favoriteModules) {
        this.favoriteModules.set(prefs.favoriteModules);
      }
    }
  }

  updateTheme() {
    const theme = this.appearanceForm.get('theme')?.value;
    this.themeService.setTheme(theme);
  }

  updateLanguage() {
    const language = this.appearanceForm.get('language')?.value;
    // Implementation for language change
    this.notificationService.info('سيتم تطبيق اللغة الجديدة بعد إعادة تحميل الصفحة');
  }

  isModuleFavorite(moduleId: string): boolean {
    return this.favoriteModules().includes(moduleId);
  }

  toggleFavoriteModule(moduleId: string) {
    const favorites = this.favoriteModules();
    if (favorites.includes(moduleId)) {
      this.favoriteModules.set(favorites.filter(id => id !== moduleId));
    } else {
      this.favoriteModules.set([...favorites, moduleId]);
    }
  }

  saveAllSettings() {
    const updateRequest: UpdatePreferencesRequest = {
      ...this.appearanceForm.value,
      ...this.regionalForm.value,
      ...this.dashboardForm.value,
      ...this.privacyForm.value,
      ...this.accessibilityForm.value,
      favoriteModules: this.favoriteModules()
    };

    this.profileService.updatePreferences(updateRequest).subscribe(() => {
      this.notificationService.success('تم حفظ جميع الإعدادات بنجاح');
    });
  }
}
