// ===================================================================
// src/app/features/medical-records/medical-records.routes.ts
// Medical Records Feature Routing Configuration
// ===================================================================

import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';

export const MEDICAL_RECORDS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      // Default redirect to list
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full'
      },

      // Medical Records List
      {
        path: 'list',
        loadComponent: () =>
          import('./components/medical-record-list/medical-record-list.component')
            .then(m => m.MedicalRecordListComponent),
        data: {
          title: 'السجلات الطبية',
          breadcrumb: 'قائمة السجلات'
        }
      },

      // Create New Medical Record
      {
        path: 'new',
        loadComponent: () =>
          import('./components/medical-record-form/medical-record-form.component')
            .then(m => m.MedicalRecordFormComponent),
        canActivate: [RoleGuard],
        data: {
          roles: ['DOCTOR', 'ADMIN', 'SYSTEM_ADMIN'],
          title: 'إضافة سجل طبي',
          breadcrumb: 'سجل جديد'
        }
      },

      // View Medical Record Details
      {
        path: ':id',
        loadComponent: () =>
          import('./components/medical-record-details/medical-record-details.component')
            .then(m => m.MedicalRecordDetailsComponent),
        data: {
          title: 'تفاصيل السجل الطبي',
          breadcrumb: 'التفاصيل'
        }
      },

      // Edit Medical Record
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./components/medical-record-form/medical-record-form.component')
            .then(m => m.MedicalRecordFormComponent),
        canActivate: [RoleGuard],
        data: {
          roles: ['DOCTOR', 'ADMIN', 'SYSTEM_ADMIN'],
          title: 'تعديل السجل الطبي',
          breadcrumb: 'تعديل',
          editMode: true
        }
      },

      // Patient Medical History
      {
        path: 'patient/:patientId',
        loadComponent: () =>
          import('./components/patient-medical-history/patient-medical-history.component')
            .then(m => m.PatientMedicalHistoryComponent),
        data: {
          title: 'التاريخ المرضي',
          breadcrumb: 'التاريخ المرضي'
        }
      },

      // Doctor Medical Records
      {
        path: 'doctor/:doctorId',
        loadComponent: () =>
          import('./components/doctor-medical-records/doctor-medical-records.component')
            .then(m => m.DoctorMedicalRecordsComponent),
        data: {
          title: 'سجلات الطبيب',
          breadcrumb: 'سجلات الطبيب'
        }
      },

      // Medical Record History/Audit Log
      {
        path: ':id/history',
        loadComponent: () =>
          import('./components/medical-record-history/medical-record-history.component')
            .then(m => m.MedicalRecordHistoryComponent),
        data: {
          title: 'سجل التعديلات',
          breadcrumb: 'السجل التاريخي'
        }
      },

      // Medical Records Statistics
      {
        path: 'statistics',
        loadComponent: () =>
          import('./components/medical-record-statistics/medical-record-statistics.component')
            .then(m => m.MedicalRecordStatisticsComponent),
        canActivate: [RoleGuard],
        data: {
          roles: ['DOCTOR', 'ADMIN', 'SYSTEM_ADMIN'],
          title: 'إحصائيات السجلات الطبية',
          breadcrumb: 'الإحصائيات'
        }
      },

      // Medical Records Search
      {
        path: 'search',
        loadComponent: () =>
          import('./components/medical-record-search/medical-record-search.component')
            .then(m => m.MedicalRecordSearchComponent),
        data: {
          title: 'البحث المتقدم',
          breadcrumb: 'البحث'
        }
      },

      // Prescription Print View
      {
        path: ':id/prescription',
        loadComponent: () =>
          import('./components/prescription-print/prescription-print.component')
            .then(m => m.PrescriptionPrintComponent),
        data: {
          title: 'طباعة الوصفة الطبية',
          breadcrumb: 'الوصفة الطبية'
        }
      },

      // Lab Results View
      {
        path: ':id/lab-results',
        loadComponent: () =>
          import('./components/lab-results/lab-results.component')
            .then(m => m.LabResultsComponent),
        data: {
          title: 'نتائج المختبر',
          breadcrumb: 'نتائج المختبر'
        }
      },

      // Radiology Results View
      {
        path: ':id/radiology',
        loadComponent: () =>
          import('./components/radiology-results/radiology-results.component')
            .then(m => m.RadiologyResultsComponent),
        data: {
          title: 'نتائج الأشعة',
          breadcrumb: 'نتائج الأشعة'
        }
      }
    ]
  }
];

// ===================================================================
// Route Guards Configuration
// ===================================================================

export const medicalRecordsGuardConfig = {
  canActivate: [AuthGuard],
  canActivateChild: [AuthGuard],
  canDeactivate: [],
  resolve: {}
};

// ===================================================================
// Route Preloading Strategy
// ===================================================================

export const medicalRecordsPreloadingStrategy = {
  preload: true,
  delay: 2000
};
