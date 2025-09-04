import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // الصفحة الرئيسية - إعادة توجيه
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },

  // المصادقة - Auth Module
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(r => r.AUTH_ROUTES),
    title: 'تسجيل الدخول - نظام أمان كير'
  },

  // لوحة التحكم - Dashboard
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.route').then(r => r.DASHBOARD_ROUTES),
    canActivate: [AuthGuard],
    title: 'لوحة التحكم - نظام أمان كير'
  },

  // إدارة المرضى - Patients
  {
    path: 'patients',
    loadChildren: () => import('./features/patients/patients.routes').then(r => r.PATIENTS_ROUTES)
  },
  // إدارة المواعيد - Appointments
  {
    path: 'appointments',
    loadChildren: () => import('./features/appointments/appointments.routes').then(r => r.APPOINTMENTS_ROUTES),
    canActivate: [AuthGuard],
    title: 'إدارة المواعيد - نظام أمان كير'
  },

  // السجلات الطبية - Medical Records
  {
    path: 'medical-records',
    loadChildren: () => import('./features/medical-records/medical-records.routes').then(r => r.MEDICAL_RECORDS_ROUTES),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['DOCTOR', 'NURSE', 'ADMIN'] },
    title: 'السجلات الطبية - نظام أمان كير'
  },

  // الفواتير - Invoices
  {
    path: 'invoices',
    loadChildren: () => import('./features/invoices/invoices.routes').then(r => r.INVOICES_ROUTES),
    canActivate: [AuthGuard],
    title: 'إدارة الفواتير - نظام أمان كير'
  },

  // إدارة المستخدمين - Users (Admin only)
  {
    path: 'users',
    loadChildren: () => import('./features/users/users.routes').then(r => r.USERS_ROUTES),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN', 'SYSTEM_ADMIN'] },
    title: 'إدارة المستخدمين - نظام أمان كير'
  },

  // إدارة العيادات - Clinics (System Admin only)
  {
    path: 'clinics',
    loadChildren: () => import('./features/clinics/clinics.routes').then(r => r.CLINICS_ROUTES),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['SYSTEM_ADMIN'] },
    title: 'إدارة العيادات - نظام أمان كير'
  },

  // التقارير - Reports
  {
    path: 'reports',
    loadChildren: () => import('./features/reports/reports.routes').then(r => r.REPORTS_ROUTES),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN', 'SYSTEM_ADMIN', 'DOCTOR'] },
    title: 'التقارير - نظام أمان كير'
  },

  // // الإعدادات - Settings
  // {
  //   path: 'settings',
  //   loadChildren: () => import('./features/settings/settings.routes').then(r => r.SETTINGS_ROUTES),
  //   canActivate: [AuthGuard],
  //   title: 'الإعدادات - نظام أمان كير'
  // },

  // // الملف الشخصي - Profile
  // {
  //   path: 'profile',
  //   loadChildren: () => import('./features/profile/profile.routes').then(r => r.PROFILE_ROUTES),
  //   canActivate: [AuthGuard],
  //   title: 'الملف الشخصي - نظام أمان كير'
  // },

  // صفحة 404
  {
    path: '404',
    loadComponent: () => import('./shared/components/not-found/not-found.component').then(c => c.NotFoundComponent),
    title: 'صفحة غير موجودة - نظام أمان كير'
  },

  // أي مسار غير محدد يتم توجيهه لصفحة 404
  {
    path: '**',
    redirectTo: '/404'
  }
];
