// ===================================================================
// src/app/features/patients/patients.routes.ts - مسارات المرضى
// ===================================================================
import { Routes } from '@angular/router';

export const PATIENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/patient-list/patient-list.component').then(c => c.PatientListComponent),
    title: 'قائمة المرضى - نظام أمان كير'
  },
  {
    path: 'new',
    loadComponent: () => import('./components/patient-form/patient-form.component').then(c => c.PatientFormComponent),
    title: 'إضافة مريض جديد - نظام أمان كير'
  },
  {
    path: ':id',
    loadComponent: () => import('./components/patient-details/patient-details.component').then(c => c.PatientDetailsComponent),
    title: 'تفاصيل المريض - نظام أمان كير'
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./components/patient-form/patient-form.component').then(c => c.PatientFormComponent),
    title: 'تعديل بيانات المريض - نظام أمان كير'
  }
];
