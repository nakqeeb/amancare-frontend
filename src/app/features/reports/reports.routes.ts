// ===================================================================
// src/app/features/reports/reports.routes.ts
// ===================================================================
import { Routes } from '@angular/router';
import { RoleGuard } from '../../core/guards/role.guard';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/reports-overview/reports-overview.component')
        .then(m => m.ReportsOverviewComponent),
    title: 'التقارير والإحصائيات'
  },
  {
    path: 'financial',
    loadComponent: () =>
      import('./components/financial-reports/financial-reports.component')
        .then(m => m.FinancialReportsComponent),
    canActivate: [RoleGuard],
    data: { roles: ['ADMIN', 'SYSTEM_ADMIN', 'RECEPTIONIST'] },
    title: 'التقارير المالية'
  },
  {
    path: 'appointments',
    loadComponent: () =>
      import('./components/appointment-reports/appointment-reports.component')
        .then(m => m.AppointmentReportsComponent),
    title: 'تقارير المواعيد'
  },
  {
    path: 'patients',
    loadComponent: () =>
      import('./components/patient-reports/patient-reports.component')
        .then(m => m.PatientReportsComponent),
    title: 'تقارير المرضى'
  },
  {
    path: 'doctors',
    loadComponent: () =>
      import('./components/doctor-performance/doctor-performance.component')
        .then(m => m.DoctorPerformanceComponent),
    canActivate: [RoleGuard],
    data: { roles: ['ADMIN', 'SYSTEM_ADMIN'] },
    title: 'تقارير أداء الأطباء'
  },
  {
    path: 'medical',
    loadComponent: () =>
      import('./components/medical-reports/medical-reports.component')
        .then(m => m.MedicalReportsComponent),
    canActivate: [RoleGuard],
    data: { roles: ['DOCTOR', 'ADMIN', 'SYSTEM_ADMIN'] },
    title: 'التقارير الطبية'
  },
  {
    path: 'custom',
    loadComponent: () =>
      import('./components/custom-reports/custom-reports.component')
        .then(m => m.CustomReportsComponent),
    canActivate: [RoleGuard],
    data: { roles: ['ADMIN', 'SYSTEM_ADMIN'] },
    title: 'التقارير المخصصة'
  },
  {
    path: 'trends',
    loadComponent: () =>
      import('./components/trends-analysis/trends-analysis.component')
        .then(m => m.TrendsAnalysisComponent),
    title: 'تحليل الاتجاهات'
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./components/reports-history/reports-history.component')
        .then(m => m.ReportsHistoryComponent),
    title: 'سجل التقارير'
  },
  {
    path: 'scheduled',
    loadComponent: () =>
      import('./components/scheduled-reports/scheduled-reports.component')
        .then(m => m.ScheduledReportsComponent),
    // canActivate: [RoleGuard],
    data: { roles: ['ADMIN', 'SYSTEM_ADMIN'] },
    title: 'التقارير المجدولة'
  }
];
