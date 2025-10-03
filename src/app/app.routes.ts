import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { ActivitiesListComponent } from './features/clinic-admin/components/activities-list/activities-list.component';

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

  // ===================================================================
  // SYSTEM ADMIN ROUTES - إدارة النظام
  // ===================================================================
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(r => r.ADMIN_ROUTES),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['SYSTEM_ADMIN'] },
    title: 'إدارة النظام - نظام أمان كير'
  },

  {
    path: 'admin/activities',
    component: ActivitiesListComponent,
    canActivate: [RoleGuard],
    data: {
      roles: ['ADMIN', 'SYSTEM_ADMIN'],
      title: 'سجل الأنشطة'
    }
  },

  // System Admin specific components (outside audit)
  {
    path: 'system',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['SYSTEM_ADMIN'] },
    children: [
      {
        path: 'select-clinic-context',
        loadComponent: () =>
          import('./features/admin/components/clinic-context-selector/clinic-context-selector.component')
            .then(m => m.ClinicContextSelectorComponent),
        title: 'اختيار سياق العيادة - نظام أمان كير'
      }
    ]
  },

  // System Admin specific routes
  // {
  //   path: 'admin',
  //   canActivate: [RoleGuard],
  //   data: { roles: ['SYSTEM_ADMIN'] },
  //   children: [
  //     {
  //       path: 'select-clinic-context',
  //       loadComponent: () =>
  //         import('./features/admin/components/clinic-context-selector/clinic-context-selector.component')
  //           .then(m => m.ClinicContextSelectorComponent)
  //     },
  //     // {
  //     //   path: 'system-logs',
  //     //   loadComponent: () =>
  //     //     import('./features/admin/components/system-logs/system-logs.component')
  //     //       .then(m => m.SystemLogsComponent)
  //     // },
  //     // {
  //     //   path: 'audit-trail',
  //     //   loadComponent: () =>
  //     //     import('./features/admin/components/audit-trail/audit-trail.component')
  //     //       .then(m => m.AuditTrailComponent)
  //     // }
  //   ]
  // },

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
  // إدارة جداول ومواعيد عمل الأطباء - Schedules
  {
    path: 'schedules',
    loadChildren: () => import('./features/schedules/schedule.routes').then(m => m.SCHEDULE_ROUTES),
    data: {
      title: 'جداول الأطباء',
      breadcrumb: 'الجداول',
      roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']
    }
  },
  // إدارة المواعيد - Appointments
  {
    path: 'appointments',
    loadChildren: () => import('./features/appointments/appointments.routes').then(r => r.APPOINTMENT_ROUTES),
    canActivate: [AuthGuard],
    title: 'إدارة المواعيد - نظام أمان كير'
  },

  {
    path: 'medical-records',
    loadChildren: () =>
      import('./features/medical-records/medical-records.routes')
        .then(m => m.MEDICAL_RECORDS_ROUTES),
    data: {
      title: 'السجلات الطبية',
      icon: 'description',
      breadcrumb: 'السجلات الطبية'
    }
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

  {
    path: 'invoices',
    loadChildren: () => import('./features/invoices/invoices.routes').then(m => m.INVOICES_ROUTES),
    canActivate: [AuthGuard]
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


// ===================================================================
// Route Configuration Options
// ===================================================================

export const routeConfig = {
  enableTracing: false, // Set to true for debugging
  useHash: false, // Set to true for hash-based routing
  initialNavigation: 'enabledBlocking',
  scrollPositionRestoration: 'enabled'
};
