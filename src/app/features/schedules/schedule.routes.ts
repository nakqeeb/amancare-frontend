import { Routes } from "@angular/router";
import { AuthGuard } from "../../core/guards/auth.guard";
import { RoleGuard } from "../../core/guards/role.guard";
import { AvailabilityCheckComponent } from "./components/availability-check/availability-check.component";
import { DoctorScheduleDetailComponent } from "./components/doctor-schedule-detail/doctor-schedule-detail.component";
import { ScheduleCalendarComponent } from "./components/schedule-calendar/schedule-calendar.component";
import { ScheduleFormComponent } from "./components/schedule-form/schedule-form.component";
import { ScheduleListComponent } from "./components/schedule-list/schedule-list.component";
import { UnavailabilityFormComponent } from "./components/unavailability-form/unavailability-form.component";

export const SCHEDULE_ROUTES: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      // Default route - Schedule List
      {
        path: '',
        component: ScheduleListComponent,
        data: {
          title: 'جداول الأطباء',
          breadcrumb: 'الجداول'
        }
      },

      // Calendar View
      {
        path: 'calendar',
        component: ScheduleCalendarComponent,
        data: {
          title: 'تقويم الجداول',
          breadcrumb: 'التقويم'
        }
      },

      // Availability Check
      {
        path: 'availability',
        component: AvailabilityCheckComponent,
        data: {
          title: 'فحص التوفر',
          breadcrumb: 'فحص التوفر'
        }
      },

      // Create New Schedule
      {
        path: 'create',
        component: ScheduleFormComponent,
        canActivate: [RoleGuard],
        data: {
          title: 'إنشاء جدولة جديدة',
          breadcrumb: 'إنشاء جدولة',
          expectedRoles: ['ADMIN', 'SYSTEM_ADMIN', 'DOCTOR']
        }
      },

      // Edit Schedule
      {
        path: 'edit/:id',
        component: ScheduleFormComponent,
        canActivate: [RoleGuard],
        data: {
          title: 'تعديل الجدولة',
          breadcrumb: 'تعديل',
          expectedRoles: ['ADMIN', 'SYSTEM_ADMIN', 'DOCTOR']
        }
      },

      // Doctor-specific routes
      {
        path: 'doctor/:doctorId',
        children: [
          // Doctor Schedule Detail
          {
            path: '',
            component: DoctorScheduleDetailComponent,
            data: {
              title: 'تفاصيل جدولة الطبيب',
              breadcrumb: 'تفاصيل الجدولة'
            }
          },

          // Doctor Availability Check
          {
            path: 'availability',
            component: AvailabilityCheckComponent,
            data: {
              title: 'فحص توفر الطبيب',
              breadcrumb: 'فحص التوفر'
            }
          },

          // Doctor Unavailability Management
          {
            path: 'unavailability',
            children: [
              // Create Unavailability
              {
                path: 'create',
                component: UnavailabilityFormComponent,
                canActivate: [RoleGuard],
                data: {
                  title: 'إضافة فترة عدم توفر',
                  breadcrumb: 'إضافة عدم توفر',
                  expectedRoles: ['ADMIN', 'SYSTEM_ADMIN', 'DOCTOR']
                }
              },

              // Edit Unavailability
              {
                path: 'edit/:unavailabilityId',
                component: UnavailabilityFormComponent,
                canActivate: [RoleGuard],
                data: {
                  title: 'تعديل فترة عدم التوفر',
                  breadcrumb: 'تعديل عدم التوفر',
                  expectedRoles: ['ADMIN', 'SYSTEM_ADMIN', 'DOCTOR']
                }
              }
            ]
          }
        ]
      },

      // General Unavailability Management
      {
        path: 'unavailability',
        children: [
          // Create General Unavailability
          {
            path: 'create',
            component: UnavailabilityFormComponent,
            canActivate: [RoleGuard],
            data: {
              title: 'إضافة فترة عدم توفر',
              breadcrumb: 'إضافة عدم توفر',
              expectedRoles: ['ADMIN', 'SYSTEM_ADMIN']
            }
          },

          // Edit General Unavailability
          {
            path: 'edit/:unavailabilityId',
            component: UnavailabilityFormComponent,
            canActivate: [RoleGuard],
            data: {
              title: 'تعديل فترة عدم التوفر',
              breadcrumb: 'تعديل عدم التوفر',
              expectedRoles: ['ADMIN', 'SYSTEM_ADMIN']
            }
          }
        ]
      },

      // Wildcard route - redirect to schedule list
      {
        path: '**',
        redirectTo: '',
        pathMatch: 'full'
      }
    ]
  }
];
