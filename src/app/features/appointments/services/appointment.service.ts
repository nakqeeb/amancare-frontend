// src/app/features/appointments/services/appointment.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { NotificationService } from '../../../core/services/notification.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  Appointment,
  AppointmentResponse,
  AppointmentSummaryResponse,
  AppointmentPageResponse,
  AppointmentStatistics,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  AppointmentStatus,
  AppointmentType
} from '../models/appointment.model';
import { AuthService } from '../../../core/services/auth.service';
import { SystemAdminService } from '../../../core/services/system-admin.service';
import { ActivityService } from '../../../core/services/activity.service';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private readonly http = inject(HttpClient);
  private readonly notificationService = inject(NotificationService);
  private readonly authService = inject(AuthService);
  private readonly systemAdminService = inject(SystemAdminService);
  private activityService = inject(ActivityService);

  private readonly apiUrl = `${environment.apiUrl}/appointments`;

  // State management with signals
  public readonly loading = signal(false);
  public readonly error = signal<string | null>(null);
  public readonly appointments = signal<AppointmentResponse[]>([]);
  public readonly selectedAppointment = signal<AppointmentResponse | null>(null);
  public readonly todayAppointments = signal<AppointmentSummaryResponse[]>([]);
  public readonly upcomingAppointments = signal<AppointmentSummaryResponse[]>([]);
  public readonly statistics = signal<AppointmentStatistics | null>(null);

  // Pagination state
  public readonly currentPage = signal(0);
  public readonly pageSize = signal(10);
  public readonly totalElements = signal(0);
  public readonly totalPages = signal(0);

  // BehaviorSubjects for reactive updates
  private appointmentsSubject = new BehaviorSubject<AppointmentResponse[]>([]);
  public appointments$ = this.appointmentsSubject.asObservable();

  // 1. Create Appointment
  createAppointment(request: CreateAppointmentRequest): Observable<AppointmentResponse> {
    this.loading.set(true);
    this.error.set(null);

    // Validate SYSTEM_ADMIN context for write operations
    const currentUser = this.authService.currentUser();
    if (currentUser?.role === 'SYSTEM_ADMIN') {
      if (!this.systemAdminService.canPerformWriteOperation()) {
        return throwError(() => new Error('يجب تحديد العيادة المستهدفة قبل إنشاء مريض جديد'));
      }

      // Add clinic ID from context if not provided
      const actingClinicId = this.systemAdminService.getActingClinicId();
      if (actingClinicId && !request.clinicId) {
        request.clinicId = actingClinicId;
      }
    }

    return this.http.post<ApiResponse<AppointmentResponse>>(this.apiUrl, request).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.notificationService.success('تم إنشاء الموعد بنجاح');
          // Add to appointments list
          const currentAppointments = this.appointments();
          this.appointments.set([response.data, ...currentAppointments]);
          this.appointmentsSubject.next(this.appointments());
        }
        this.loading.set(false);
      }),
      map(response => response.data!),
      catchError(error => {
        this.loading.set(false);
        this.handleError('فشل في إنشاء الموعد', error);
        return throwError(() => error);
      })
    );
  }

  // 2. Get All Appointments with Filtering
  getAllAppointments(
    date?: string,
    doctorId?: number,
    status?: AppointmentStatus,
    page: number = 0,
    size: number = 10,
    sortBy: string = 'appointmentDate',
    sortDirection: string = 'asc'
  ): Observable<AppointmentPageResponse> {
    this.loading.set(true);
    this.error.set(null);

    let clinicId = null;
    if (this.authService.currentUser()?.role === 'SYSTEM_ADMIN') {
      clinicId = this.systemAdminService.actingClinicContext()?.clinicId;
    }

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);


    if (clinicId) {
      params = params.set('clinicId', clinicId.toString());
    }

    if (date) params = params.set('date', date);
    if (doctorId) params = params.set('doctorId', doctorId.toString());
    if (status) params = params.set('status', status);

    return this.http.get<ApiResponse<AppointmentPageResponse>>(this.apiUrl, { params }).pipe(
      tap(response => {
        console.log('getAllAppointments: ', response.data);
        if (response.success && response.data) {
          this.appointments.set(response.data.appointments);
          this.appointmentsSubject.next(response.data.appointments);
          this.currentPage.set(response.data.pageNumber);
          this.totalElements.set(response.data.totalElements);
          this.totalPages.set(response.data.totalPages);
        }
        this.loading.set(false);
      }),
      map(response => response.data!),
      catchError(error => {
        this.loading.set(false);
        this.handleError('فشل في جلب المواعيد', error);
        return throwError(() => error);
      })
    );
  }

  // 3. Get Today's Appointments
  getTodayAppointments(): Observable<AppointmentSummaryResponse[]> {
    const today = new Date().toISOString().split('T')[0];
    let params = new HttpParams().set('date', today);

    let clinicId = null;
    if (this.authService.currentUser()?.role === 'SYSTEM_ADMIN') {
      clinicId = this.systemAdminService.actingClinicContext()?.clinicId;
    }

    if (clinicId) {
      params = params.set('clinicId', clinicId.toString());
    }

    return this.http.get<ApiResponse<AppointmentSummaryResponse[]>>(`${this.apiUrl}/today`, { params }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.todayAppointments.set(response.data);
        }
        this.loading.set(false);
      }),
      map(response => response.data!),
      catchError(error => {
        this.loading.set(false);
        this.handleError('فشل في جلب مواعيد اليوم', error);
        return throwError(() => error);
      })
    );
  }

  // 4. Get Appointment by ID
  getAppointmentById(id: number): Observable<AppointmentResponse> {
    this.loading.set(true);
    this.error.set(null);
    let clinicId = null;
    if (this.authService.currentUser()?.role === 'SYSTEM_ADMIN') {
      clinicId = this.systemAdminService.actingClinicContext()?.clinicId;
    }

    let params = new HttpParams();
    if (clinicId) {
      params = params.set('clinicId', clinicId.toString());
    }
    return this.http.get<ApiResponse<AppointmentResponse>>(`${this.apiUrl}/${id}`, { params }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.selectedAppointment.set(response.data);
          console.log(this.selectedAppointment());
        }
        this.loading.set(false);
      }),
      map(response => response.data!),
      catchError(error => {
        this.loading.set(false);
        this.handleError('فشل في جلب تفاصيل الموعد', error);
        return throwError(() => error);
      })
    );
  }

  // 5. Get Doctor's Appointments
  getDoctorAppointments(
    doctorId: number,
    date?: string,
    status?: AppointmentStatus,
    page: number = 0,
    size: number = 10
  ): Observable<AppointmentPageResponse> {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (date) params = params.set('date', date);
    if (status) params = params.set('status', status);

    return this.http.get<ApiResponse<AppointmentPageResponse>>(
      `${this.apiUrl}/doctor/${doctorId}`,
      { params }
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.appointments.set(response.data.appointments);
          this.appointmentsSubject.next(response.data.appointments);
        }
        this.loading.set(false);
      }),
      map(response => response.data!),
      catchError(error => {
        this.loading.set(false);
        this.handleError('فشل في جلب مواعيد الطبيب', error);
        return throwError(() => error);
      })
    );
  }

  // 6. Get Patient's Upcoming Appointments
  getPatientUpcomingAppointments(patientId: number): Observable<AppointmentSummaryResponse[]> {
    this.loading.set(true);
    this.error.set(null);

    let clinicId = null;
    if (this.authService.currentUser()?.role === 'SYSTEM_ADMIN') {
      clinicId = this.systemAdminService.actingClinicContext()?.clinicId;
    }

    let params = new HttpParams();
    if (clinicId) {
      params = params.set('clinicId', clinicId.toString());
    }

    return this.http.get<ApiResponse<AppointmentSummaryResponse[]>>(
      `${this.apiUrl}/patient/${patientId}/upcoming`, { params }
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.upcomingAppointments.set(response.data);
        }
        this.loading.set(false);
      }),
      map(response => response.data!),
      catchError(error => {
        this.loading.set(false);
        this.handleError('فشل في جلب المواعيد القادمة', error);
        return throwError(() => error);
      })
    );
  }

  // 7. Get Overdue Appointments
  getOverdueAppointments(): Observable<AppointmentSummaryResponse[]> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<ApiResponse<AppointmentSummaryResponse[]>>(`${this.apiUrl}/overdue`).pipe(
      tap(response => {
        if (response.success && response.data) {
          // Can store in a signal if needed
        }
        this.loading.set(false);
      }),
      map(response => response.data!),
      catchError(error => {
        this.loading.set(false);
        this.handleError('فشل في جلب المواعيد المتأخرة', error);
        return throwError(() => error);
      })
    );
  }

  // 8. Get Appointment Statistics
  getAppointmentStatistics(date?: string): Observable<AppointmentStatistics> {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams();
    if (date) params = params.set('date', date);

    return this.http.get<ApiResponse<AppointmentStatistics>>(
      `${this.apiUrl}/statistics`,
      { params }
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.statistics.set(response.data);
        }
        this.loading.set(false);
      }),
      map(response => response.data!),
      catchError(error => {
        this.loading.set(false);
        this.handleError('فشل في جلب الإحصائيات', error);
        return throwError(() => error);
      })
    );
  }

  // 9. Update Appointment
  updateAppointment(id: number, request: UpdateAppointmentRequest): Observable<AppointmentResponse> {
    this.loading.set(true);
    this.error.set(null);

    // Validate SYSTEM_ADMIN context for write operations
    const currentUser = this.authService.currentUser();
    if (currentUser?.role === 'SYSTEM_ADMIN') {
      if (!this.systemAdminService.canPerformWriteOperation()) {
        return throwError(() => new Error('يجب تحديد العيادة المستهدفة قبل إنشاء مريض جديد'));
      }

      // Add clinic ID from context if not provided
      const actingClinicId = this.systemAdminService.getActingClinicId();
      if (actingClinicId && !request.clinicId) {
        request.clinicId = actingClinicId;
      }
    }

    return this.http.put<ApiResponse<AppointmentResponse>>(`${this.apiUrl}/${id}`, request).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.notificationService.success('تم تحديث الموعد بنجاح');
          // Update in appointments list
          const appointments = this.appointments();
          const index = appointments.findIndex(a => a.id === id);
          if (index !== -1) {
            appointments[index] = response.data;
            this.appointments.set([...appointments]);
            this.appointmentsSubject.next(appointments);
          }
          this.selectedAppointment.set(response.data);
        }
        this.loading.set(false);
      }),
      map(response => response.data!),
      catchError(error => {
        this.loading.set(false);
        this.handleError('فشل في تحديث الموعد', error);
        return throwError(() => error);
      })
    );
  }

  // 10. Update Appointment Status
  updateAppointmentStatus(id: number, status: AppointmentStatus): Observable<AppointmentResponse> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams().set('status', status);

    return this.http.patch<ApiResponse<AppointmentResponse>>(
      `${this.apiUrl}/${id}/status`,
      null,
      { params }
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.notificationService.success('تم تحديث حالة الموعد بنجاح');
          // Update in appointments list
          const appointments = this.appointments();
          const index = appointments.findIndex(a => a.id === id);
          if (index !== -1) {
            appointments[index] = response.data;
            this.appointments.set([...appointments]);
            this.appointmentsSubject.next(appointments);
          }
          switch (status) {
            case AppointmentStatus.SCHEDULED:
              return this.activityService.logAppointmentScheduled(id, response.data.patient.fullName, response.data.appointmentDate);
            case AppointmentStatus.CONFIRMED:
              return this.activityService.logAppointmentConfirmed(id, response.data.patient.fullName);
            case AppointmentStatus.IN_PROGRESS:
              return this.activityService.logAppointmentInProgress(id, response.data.patient.fullName);
            case AppointmentStatus.COMPLETED:
              return this.activityService.logAppointmentCompleted(id, response.data.patient.fullName);
            case AppointmentStatus.CANCELLED:
              return this.activityService.logAppointmentCancelled(id, response.data.patient.fullName);
            case AppointmentStatus.NO_SHOW:
              return this.activityService.logAppointmentNoShow(id, response.data.patient.fullName);
            default:
              return 'غير معروف';
          }
        }
        this.loading.set(false);
      }),
      map(response => response.data!),
      catchError(error => {
        this.loading.set(false);
        this.handleError('فشل في تحديث حالة الموعد', error);
        return throwError(() => error);
      })
    );
  }

  // 11. Cancel Appointment
  cancelAppointment(id: number, reason?: string): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    let deletedAppointment: AppointmentResponse;
    this.getAppointmentById(id).subscribe(response => {
      deletedAppointment = response!;
    });

    let params = new HttpParams();
    if (reason) params = params.set('reason', reason);

    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`, { params }).pipe(
      tap(response => {
        if (response.success) {
          this.notificationService.success('تم إلغاء الموعد بنجاح');
          // Remove from appointments list or update status
          const appointments = this.appointments();
          const index = appointments.findIndex(a => a.id === id);
          if (index !== -1) {
            appointments[index].status = AppointmentStatus.CANCELLED;
            if (reason) appointments[index].cancellationReason = reason;
            this.appointments.set([...appointments]);
            this.appointmentsSubject.next(appointments);
          }
          this.activityService.logAppointmentCancelled(id, deletedAppointment.patient.fullName);
        }
        this.loading.set(false);
      }),
      map(() => undefined),
      catchError(error => {
        this.loading.set(false);
        this.handleError('فشل في إلغاء الموعد', error);
        return throwError(() => error);
      })
    );
  }

  // Utility Methods
  private handleError(message: string, error: any): void {
    console.error(message, error);
    const errorMessage = error?.error?.message || message;
    this.error.set(errorMessage);
    this.notificationService.error(errorMessage);
  }

  // Clear selected appointment
  clearSelectedAppointment(): void {
    this.selectedAppointment.set(null);
  }

  // Clear all appointments
  clearAppointments(): void {
    this.appointments.set([]);
    this.appointmentsSubject.next([]);
    this.todayAppointments.set([]);
    this.upcomingAppointments.set([]);
    this.statistics.set(null);
  }
}
