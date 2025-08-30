// ===================================================================
// src/app/features/invoices/invoices.routes.ts
// ===================================================================
import { Routes } from '@angular/router';
import { RoleGuard } from '../../core/guards/role.guard';

export const INVOICES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/invoice-list/invoice-list.component')
        .then(m => m.InvoiceListComponent),
    title: 'إدارة الفواتير'
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./components/invoice-form/invoice-form.component')
        .then(m => m.InvoiceFormComponent),
    title: 'إنشاء فاتورة جديدة'
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/invoice-details/invoice-details.component')
        .then(m => m.InvoiceDetailsComponent),
    title: 'تفاصيل الفاتورة'
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./components/invoice-form/invoice-form.component')
        .then(m => m.InvoiceFormComponent),
    canActivate: [RoleGuard],
    data: { roles: ['ADMIN', 'SYSTEM_ADMIN', 'RECEPTIONIST'] },
    title: 'تعديل الفاتورة'
  },
  {
    path: ':id/preview',
    loadComponent: () =>
      import('./components/invoice-preview/invoice-preview.component')
        .then(m => m.InvoicePreviewComponent),
    title: 'معاينة الفاتورة'
  },
  {
    path: ':id/payments',
    loadComponent: () =>
      import('./components/payment-tracker/payment-tracker.component')
        .then(m => m.PaymentTrackerComponent),
    title: 'تتبع المدفوعات'
  },
  {
    path: 'patient/:patientId',
    loadComponent: () =>
      import('./components/invoice-list/invoice-list.component')
        .then(m => m.InvoiceListComponent),
    title: 'فواتير المريض'
  },
  {
    path: 'reports/summary',
    loadComponent: () =>
      import('./components/invoice-summary/invoice-summary.component')
        .then(m => m.InvoiceSummaryComponent),
    canActivate: [RoleGuard],
    data: { roles: ['ADMIN', 'SYSTEM_ADMIN'] },
    title: 'ملخص الفواتير'
  }
];
