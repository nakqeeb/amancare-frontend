// ===================================================================
// 1. MEDICAL RECORDS ROUTES
// src/app/features/medical-records/medical-records.routes.ts
// ===================================================================
import { Routes } from '@angular/router';
import { RoleGuard } from '../../core/guards/role.guard';

export const MEDICAL_RECORDS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/medical-record-list/medical-record-list.component')
        .then(m => m.MedicalRecordListComponent),
    title: 'السجلات الطبية'
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./components/medical-record-form/medical-record-form.component')
        .then(m => m.MedicalRecordFormComponent),
    canActivate: [RoleGuard],
    data: { roles: ['DOCTOR', 'NURSE'] },
    title: 'إضافة سجل طبي'
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/medical-record-details/medical-record-details.component')
        .then(m => m.MedicalRecordDetailsComponent),
    title: 'تفاصيل السجل الطبي'
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./components/medical-record-form/medical-record-form.component')
        .then(m => m.MedicalRecordFormComponent),
    canActivate: [RoleGuard],
    data: { roles: ['DOCTOR'] },
    title: 'تعديل السجل الطبي'
  },
  {
    path: 'patient/:patientId',
    loadComponent: () =>
      import('./components/patient-medical-history/patient-medical-history.component')
        .then(m => m.PatientMedicalHistoryComponent),
    title: 'التاريخ المرضي'
  }
];
