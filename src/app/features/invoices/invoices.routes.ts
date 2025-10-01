// ===================================================================
// src/app/features/medical-records/medical-records.routes.ts
// Medical Records Feature Routing Configuration
// ===================================================================

import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';
import { InvoiceDetailsComponent } from './components/invoice-details/invoice-details.component';
import { InvoiceFormComponent } from './components/invoice-form/invoice-form.component';
import { InvoiceListComponent } from './components/invoice-list/invoice-list.component';

export const INVOICES_ROUTES: Routes = [
 {
    path: '',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        component: InvoiceListComponent,
        data: {
          title: 'قائمة الفواتير',
          roles: ['SYSTEM_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE']
        }
      },
      {
        path: 'create',
        component: InvoiceFormComponent,
        canActivate: [RoleGuard],
        data: {
          title: 'إنشاء فاتورة جديدة',
          roles: ['SYSTEM_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST']
        }
      },
      {
        path: ':id',
        component: InvoiceDetailsComponent,
        data: {
          title: 'تفاصيل الفاتورة',
          roles: ['SYSTEM_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE']
        }
      },
      {
        path: ':id/edit',
        component: InvoiceFormComponent,
        canActivate: [RoleGuard],
        data: {
          title: 'تعديل الفاتورة',
          roles: ['SYSTEM_ADMIN', 'ADMIN', 'RECEPTIONIST']
        }
      },
      {
        path: ':id/payment',
        loadComponent: () => import('./components/payment-form/payment-form.component')
          .then(m => m.PaymentFormComponent),
        canActivate: [RoleGuard],
        data: {
          title: 'إضافة دفعة',
          roles: ['SYSTEM_ADMIN', 'ADMIN', 'RECEPTIONIST']
        }
      }
    ]
  }
];
