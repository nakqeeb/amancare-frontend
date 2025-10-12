import { Routes } from "@angular/router";

export const GUEST_BOOKING_ROUTES: Routes = [
  // Guest Booking Routes (Public - No Auth Required)
  {
    path: '',
    children: [
      // Default redirect to book
      {
        path: '',
        redirectTo: 'book',
        pathMatch: 'full'
      },
      {
        path: 'book',
        loadComponent: () => import('./components/book-appointment/book-appointment.component')
          .then(m => m.BookAppointmentComponent),
        title: 'حجز موعد'
      },
      {
        path: 'booking-success',
        loadComponent: () => import('./components/booking-success/booking-success.component')
          .then(m => m.BookingSuccessComponent),
        title: 'تم الحجز بنجاح'
      },
      {
        path: 'confirm-appointment',
        loadComponent: () => import('./components/confirm-appointment/confirm-appointment.component')
          .then(m => m.ConfirmAppointmentComponent),
        title: 'تأكيد الموعد'
      },
      {
        path: 'appointments',
        loadComponent: () => import('./components/manage-appointments/manage-appointments.component')
          .then(m => m.ManageAppointmentsComponent),
        title: 'إدارة مواعيدي'
      }
    ]
  },
]
