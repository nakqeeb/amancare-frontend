// ===================================================================
// Clinics Module Routing
// src/app/features/clinics/clinics.routes.ts
// ===================================================================

import { Routes } from '@angular/router';
import { RoleGuard } from '../../core/guards/role.guard';

export const CLINICS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./components/clinic-list/clinic-list.component').then(c => c.ClinicListComponent),
    // canActivate: [RoleGuard],
    data: { roles: ['SYSTEM_ADMIN'] },
    title: 'قائمة العيادات - نظام أمان كير'
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./components/clinic-form/clinic-form.component').then(c => c.ClinicFormComponent),
    // canActivate: [RoleGuard],
    data: { roles: ['SYSTEM_ADMIN'] },
    title: 'إضافة عيادة جديدة - نظام أمان كير'
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/clinic-details/clinic-details.component').then(c => c.ClinicDetailsComponent),
    // canActivate: [RoleGuard],
    data: { roles: ['SYSTEM_ADMIN', 'ADMIN'] },
    title: 'تفاصيل العيادة - نظام أمان كير'
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./components/clinic-form/clinic-form.component').then(c => c.ClinicFormComponent),
    // canActivate: [RoleGuard],
    data: { roles: ['SYSTEM_ADMIN'] },
    title: 'تعديل العيادة - نظام أمان كير'
  },
  {
    path: ':id/settings',
    loadComponent: () =>
      import('./components/clinic-settings/clinic-settings.component').then(c => c.ClinicSettingsComponent),
    // canActivate: [RoleGuard],
    data: { roles: ['SYSTEM_ADMIN', 'ADMIN'] },
    title: 'إعدادات العيادة - نظام أمان كير'
  },
  // {
  //   path: ':id/services',
  //   loadComponent: () =>
  //     import('./components/clinic-services/clinic-services.component').then(c => c.ClinicServicesComponent),
  //   canActivate: [RoleGuard],
  //   data: { roles: ['SYSTEM_ADMIN', 'ADMIN'] },
  //   title: 'خدمات العيادة - نظام أمان كير'
  // },
  // {
  //   path: ':id/users',
  //   loadComponent: () =>
  //     import('./components/clinic-users/clinic-users.component').then(c => c.ClinicUsersComponent),
  //   canActivate: [RoleGuard],
  //   data: { roles: ['SYSTEM_ADMIN', 'ADMIN'] },
  //   title: 'مستخدمي العيادة - نظام أمان كير'
  // },
  // {
  //   path: ':id/analytics',
  //   loadComponent: () =>
  //     import('./components/clinic-analytics/clinic-analytics.component').then(c => c.ClinicAnalyticsComponent),
  //   canActivate: [RoleGuard],
  //   data: { roles: ['SYSTEM_ADMIN', 'ADMIN'] },
  //   title: 'تحليلات العيادة - نظام أمان كير'
  // }
];
