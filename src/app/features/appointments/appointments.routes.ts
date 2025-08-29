// ===================================================================
// 1. APPOINTMENTS ROUTES
// src/app/features/appointments/appointments.routes.ts
// ===================================================================
import { Routes } from '@angular/router';

export const APPOINTMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/appointment-list/appointment-list.component')
        .then(m => m.AppointmentListComponent),
    title: 'قائمة المواعيد'
  },
  {
    path: 'calendar',
    loadComponent: () =>
      import('./components/appointment-calendar/appointment-calendar.component')
        .then(m => m.AppointmentCalendarComponent),
    title: 'تقويم المواعيد'
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./components/appointment-form/appointment-form.component')
        .then(m => m.AppointmentFormComponent),
    title: 'حجز موعد جديد'
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/appointment-details/appointment-details.component')
        .then(m => m.AppointmentDetailsComponent),
    title: 'تفاصيل الموعد'
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./components/appointment-form/appointment-form.component')
        .then(m => m.AppointmentFormComponent),
    title: 'تعديل الموعد'
  }
];
