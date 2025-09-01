// ===================================================================
// Profile Module Routing
// src/app/features/profile/profile.routes.ts
// ===================================================================

import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';

export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full'
      },
      {
        path: 'overview',
        loadComponent: () =>
          import('./components/profile-overview/profile-overview.component')
            .then(c => c.ProfileOverviewComponent),
        title: 'الملف الشخصي - نظام أمان كير'
      },
      {
        path: 'edit',
        loadComponent: () =>
          import('./components/profile-edit/profile-edit.component')
            .then(c => c.ProfileEditComponent),
        title: 'تعديل الملف الشخصي - نظام أمان كير'
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./components/profile-settings/profile-settings.component')
            .then(c => c.ProfileSettingsComponent),
        title: 'الإعدادات - نظام أمان كير'
      },
      {
        path: 'security',
        loadComponent: () =>
          import('./components/change-password/change-password.component')
            .then(c => c.ChangePasswordComponent),
        title: 'الأمان - نظام أمان كير'
      },
      {
        path: 'activity',
        loadComponent: () =>
          import('./components/activity-history/activity-history.component')
            .then(c => c.ActivityHistoryComponent),
        title: 'سجل النشاط - نظام أمان كير'
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./components/notification-preferences/notification-preferences.component')
            .then(c => c.NotificationPreferencesComponent),
        title: 'إعدادات الإشعارات - نظام أمان كير'
      }
    ]
  }
];
