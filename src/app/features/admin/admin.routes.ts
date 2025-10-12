// ===================================================================
// src/app/features/admin/admin.routes.ts
// Admin Module Routing - Audit and System Administration
// ===================================================================
import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    canActivate: [AuthGuard, RoleGuard],
    data: {
      roles: ['SYSTEM_ADMIN'], // Only SYSTEM_ADMIN can access
      title: 'إدارة النظام'
    },
    children: [

      {
        path: '',
        redirectTo: 'announcements',
        pathMatch: 'full'
      },

      // ===================================================================
      // ANNOUNCEMENT MANAGEMENT ROUTES
      // ===================================================================
      {
        path: 'announcements',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./components/announcement-list/announcement-list.component')
                .then(c => c.AnnouncementListComponent),
            title: 'إدارة الإعلانات - نظام أمان كير'
          },
          {
            path: 'create',
            loadComponent: () =>
              import('./components/announcement-form/announcement-form.component')
                .then(c => c.AnnouncementFormComponent),
            title: 'إضافة إعلان - نظام أمان كير'
          },
          {
            path: 'edit/:id',
            loadComponent: () =>
              import('./components/announcement-form/announcement-form.component')
                .then(c => c.AnnouncementFormComponent),
            title: 'تعديل إعلان - نظام أمان كير'
          }
        ]
      },
      // Default redirect
      /* {
        path: '',
        redirectTo: 'audit/logs',
        pathMatch: 'full'
      }, */

      // ===================================================================
      // AUDIT ROUTES
      // ===================================================================
      {
        path: 'audit',
        children: [
          {
            path: '',
            redirectTo: 'logs',
            pathMatch: 'full'
          },
          {
            path: 'logs',
            loadComponent: () =>
              import('./components/audit-logs-list/audit-logs-list.component')
                .then(c => c.AuditLogsListComponent),
            title: 'سجلات المراجعة - نظام أمان كير'
          },
          {
            path: 'statistics',
            loadComponent: () =>
              import('./components/audit-statistics/audit-statistics.component')
                .then(c => c.AuditStatisticsComponent),
            title: 'إحصائيات المراجعة - نظام أمان كير'
          },
          {
            path: 'resource/:resourceType/:resourceId',
            loadComponent: () =>
              import('./components/resource-audit-trail/resource-audit-trail.component')
                .then(c => c.ResourceAuditTrailComponent),
            title: 'سجل المورد - نظام أمان كير'
          }
        ]
      }

      // Future admin routes can be added here:
      // - System settings
      // - User management (system-wide)
      // - Backup & restore
      // - System health monitoring
      // etc.
    ]
  }
];
