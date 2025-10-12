// ===================================================================
// src/app/features/patients/patients.routes.ts - مسارات المرضى

import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';

// ===================================================================
export const PATIENTS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/patient-list/patient-list.component').then(c => c.PatientListComponent),
        title: 'قائمة المرضى - نظام أمان كير',
        data: {
          breadcrumb: 'المرضى',
          roles: ['SYSTEM_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'],
          pageTitle: 'إدارة المرضى',
          pageSubtitle: 'عرض وإدارة جميع مرضى العيادة'
        },
        canActivate: [RoleGuard]
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./components/patient-form/patient-form.component').then(c => c.PatientFormComponent),
        title: 'إضافة مريض جديد - نظام أمان كير',
        data: {
          breadcrumb: 'إضافة مريض جديد',
          roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'],
          pageTitle: 'إضافة مريض جديد',
          pageSubtitle: 'إضافة مريض جديد إلى النظام'
        },
        canActivate: [RoleGuard]
      },
      {
        path: 'search',
        loadComponent: () =>
          import('./components/patient-search/patient-search.component').then(c => c.PatientSearchComponent),
        title: 'البحث عن المرضى - نظام أمان كير',
        data: {
          breadcrumb: 'البحث عن المرضى',
          roles: ['SYSTEM_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'],
          pageTitle: 'البحث المتقدم',
          pageSubtitle: 'البحث عن المرضى باستخدام فلاتر متقدمة'
        },
        canActivate: [RoleGuard]
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./components/patient-details/patient-details.component').then(c => c.PatientDetailsComponent),
        title: 'تفاصيل المريض - نظام أمان كير',
        data: {
          breadcrumb: 'تفاصيل المريض',
          roles: ['SYSTEM_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'],
          pageTitle: 'ملف المريض',
          pageSubtitle: 'عرض تفاصيل المريض الكاملة'
        },
        canActivate: [RoleGuard]
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./components/patient-form/patient-form.component').then(c => c.PatientFormComponent),
        title: 'تعديل بيانات المريض - نظام أمان كير',
        data: {
          breadcrumb: 'تعديل بيانات المريض',
          roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'],
          pageTitle: 'تعديل بيانات المريض',
          pageSubtitle: 'تحديث معلومات المريض'
        },
        canActivate: [RoleGuard]
      },
      // Additional routes for specific functionalities
      // {
      //   path: ':id/appointments',
      //   loadComponent: () =>
      //     import('../appointments/components/appointment-list/appointment-list.component')
      //     .then(c => c.AppointmentListComponent),
      //   title: 'مواعيد المريض - نظام أمان كير',
      //   data: {
      //     breadcrumb: 'مواعيد المريض',
      //     roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'],
      //     pageTitle: 'مواعيد المريض',
      //     pageSubtitle: 'عرض جميع مواعيد المريض'
      //   },
      //   canActivate: [RoleGuard]
      // },
      /* {
        path: ':id/medical-history',
        loadComponent: () =>
          import('../medical-records/components/patient-medical-history/patient-medical-history.component')
          .then(c => c.PatientMedicalHistoryComponent),
        title: 'السجل الطبي للمريض - نظام أمان كير',
        data: {
          breadcrumb: 'السجل الطبي',
          roles: ['ADMIN', 'DOCTOR'],
          pageTitle: 'السجل الطبي',
          pageSubtitle: 'عرض السجل الطبي الكامل للمريض'
        },
        canActivate: [RoleGuard]
      }, */
      // Redirect route
      {
        path: '**',
        redirectTo: '',
        pathMatch: 'full'
      }
    ]
  }
];
