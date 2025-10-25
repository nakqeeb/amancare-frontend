// src/app/features/appointments/appointments.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';

export const APPOINTMENT_ROUTES: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/appointment-list/appointment-list.component')
            .then(m => m.AppointmentListComponent),
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'] }
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./components/appointment-form/appointment-form.component')
            .then(m => m.AppointmentFormComponent),
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] }
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('./components/appointment-calendar/appointment-calendar.component')
            .then(m => m.AppointmentCalendarComponent),
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'] }
      },
      {
        path: 'today',
        loadComponent: () =>
          import('./components/appointment-today/appointment-today.component')
            .then(m => m.AppointmentTodayComponent),
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'] }
      },
      {
        path: 'arrangement',
        loadComponent: () =>
          import('./components/appointment-arrangement/appointment-arrangement.component')
            .then(m => m.AppointmentArrangementComponent),
        canActivate: [RoleGuard],
        data: {
          roles: ['SYSTEM_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'],
          title: 'ترتيب مواعيد اليوم',
          description: 'إدارة وترتيب مواعيد اليوم حسب الطبيب'
        }
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./components/appointment-details/appointment-details.component')
            .then(m => m.AppointmentDetailsComponent),
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'] }
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./components/appointment-form/appointment-form.component')
            .then(m => m.AppointmentFormComponent),
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] }
      },
    ]
  }
];
