// ===================================================================
// src/app/features/schedules/services/schedule.service.ts
// Complete Schedule Service integrating all 10 API endpoints
// ===================================================================
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map, finalize } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { NotificationService } from '../../../core/services/notification.service';
import { ApiResponse } from '../../../core/models/api-response.model';

import {
  DoctorSchedule,
  CreateDoctorScheduleRequest,
  UpdateDoctorScheduleRequest,
  DoctorUnavailability,
  CreateUnavailabilityRequest,
  DoctorScheduleResponse,
  UnavailabilityResponse,
  DoctorSummaryResponse,
  AvailabilityCheckResponse,
  ScheduleStatistics,
  WeeklyScheduleView,
  ScheduleSearchCriteria,
  UnavailabilitySearchCriteria,
  DayOfWeek
} from '../models/schedule.model';
import { AuthService } from '../../../core/services/auth.service';
import { SystemAdminService } from '../../../core/services/system-admin.service';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private readonly http = inject(HttpClient);
  private readonly notificationService = inject(NotificationService);
  private readonly authService = inject(AuthService);
  private readonly systemAdminService = inject(SystemAdminService);
  private readonly apiUrl = `${environment.apiUrl}/schedules`;

  // ===================================================================
  // SIGNALS & OBSERVABLES FOR STATE MANAGEMENT
  // ===================================================================
  public readonly loading = signal(false);
  public readonly error = signal<string | null>(null);

  // Schedules state
  public readonly doctorSchedules = signal<(DoctorScheduleResponse | DoctorSchedule)[]>([]);
  public readonly selectedDoctorSchedules = signal<DoctorScheduleResponse[]>([]);

  // Unavailabilities state
  public readonly unavailabilities = signal<UnavailabilityResponse[]>([]);
  public readonly selectedDoctorUnavailabilities = signal<UnavailabilityResponse[]>([]);

  // Available doctors and time slots
  public readonly availableDoctors = signal<DoctorSummaryResponse[]>([]);
  public readonly availableTimeSlots = signal<string[]>([]);

  // Statistics
  public readonly scheduleStatistics = signal<ScheduleStatistics | null>(null);
  public readonly weeklyScheduleView = signal<WeeklyScheduleView[]>([]);

  // Subjects for reactive updates
  private schedulesSubject = new BehaviorSubject<(DoctorScheduleResponse | DoctorSchedule)[]>([]);
  public schedules$ = this.schedulesSubject.asObservable();

  private unavailabilitiesSubject = new BehaviorSubject<UnavailabilityResponse[]>([]);
  public unavailabilities$ = this.unavailabilitiesSubject.asObservable();

  // ===================================================================
  // 1. POST /schedules/doctor - Create Doctor Schedule
  // ===================================================================
  createDoctorSchedule(request: CreateDoctorScheduleRequest): Observable<DoctorScheduleResponse[]> {
    this.loading.set(true);
    this.error.set(null);

    // Validate SYSTEM_ADMIN context for write operations
    const currentUser = this.authService.currentUser();
    if (currentUser?.role === 'SYSTEM_ADMIN') {
      if (!this.systemAdminService.canPerformWriteOperation()) {
        return throwError(() => new Error('يجب تحديد العيادة المستهدفة قبل إنشاء جدول جديد'));
      }
    }

    return this.http.post<ApiResponse<DoctorScheduleResponse[]>>(`${this.apiUrl}/doctor`, request).pipe(
      tap(response => {
        if (response.success && response.data) {
          // Update local state
          const currentSchedules = this.doctorSchedules();
          const updatedSchedules = [...currentSchedules, ...response.data];
          this.doctorSchedules.set(updatedSchedules);
          this.schedulesSubject.next(updatedSchedules);

          this.notificationService.success('تم إنشاء جدولة الطبيب بنجاح');
        }
        this.loading.set(false);
      }),
      map(response => response.data!),
      catchError(error => {
        this.loading.set(false);
        this.handleError('خطأ في إنشاء جدولة الطبيب', error);
        return throwError(() => error);
      })
    );
  }

  // ===================================================================
  // 2. POST /schedules/unavailability - Add Doctor Unavailability
  // ===================================================================
  addUnavailability(request: CreateUnavailabilityRequest): Observable<UnavailabilityResponse> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.post<ApiResponse<UnavailabilityResponse>>(`${this.apiUrl}/unavailability`, request).pipe(
      tap(response => {
        if (response.success && response.data) {
          // Update local state
          const currentUnavailabilities = this.unavailabilities();
          const updatedUnavailabilities = [response.data, ...currentUnavailabilities];
          this.unavailabilities.set(updatedUnavailabilities);
          this.unavailabilitiesSubject.next(updatedUnavailabilities);

          this.notificationService.success('تم إضافة فترة عدم التوفر بنجاح');
        }
        this.loading.set(false);
      }),
      map(response => response.data!),
      catchError(error => {
        this.loading.set(false);
        this.handleError('خطأ في إضافة فترة عدم التوفر', error);
        return throwError(() => error);
      })
    );
  }

  // ===================================================================
  // 3. GET /schedules/all - Get All Doctors Schedules
  // ===================================================================
  getAllDoctorsSchedules(): Observable<DoctorScheduleResponse[]> {
    this.loading.set(true);
    this.error.set(null);
    let clinicId = null;
    if (this.authService.currentUser()?.role === 'SYSTEM_ADMIN') {
      clinicId = this.systemAdminService.actingClinicContext()?.clinicId;
    }
    let params = new HttpParams();

    if (clinicId) {
      params = params.set('clinicId', clinicId);
    }

    return this.http.get<ApiResponse<DoctorScheduleResponse[]>>(`${this.apiUrl}/all`, { params }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.doctorSchedules.set(response.data);
          this.schedulesSubject.next(response.data);
        }
        this.loading.set(false);
      }),
      map(response => response.data!),
      catchError(error => {
        this.loading.set(false);
        this.handleError('خطأ في الحصول على جداول الأطباء', error);
        return throwError(() => error);
      })
    );
  }

  // ===================================================================
  // 4. GET /schedules/doctor/{doctorId} - Get Doctor Schedule
  // ===================================================================
  getDoctorSchedule(doctorId: number): Observable<DoctorScheduleResponse[]> {
    this.loading.set(true);
    this.error.set(null);
    let clinicId = null;
    if (this.authService.currentUser()?.role === 'SYSTEM_ADMIN') {
      clinicId = this.systemAdminService.actingClinicContext()?.clinicId;
    }
    let params = new HttpParams();

    if (clinicId) {
      params = params.set('clinicId', clinicId);
    }

    return this.http.get<ApiResponse<DoctorScheduleResponse[]>>(`${this.apiUrl}/doctor/${doctorId}`, { params }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.selectedDoctorSchedules.set(response.data);
        }
        this.loading.set(false);
      }),
      map(response => response.data!),
      catchError(error => {
        this.loading.set(false);
        this.handleError('خطأ في الحصول على جدولة الطبيب', error);
        return throwError(() => error);
      })
    );
  }

  // ===================================================================
  // 5. GET /schedules/doctor/{doctorId}/unavailability - Get Doctor Unavailability
  // ===================================================================
  getDoctorUnavailability(
    doctorId: number,
    startDate?: string,
    endDate?: string
  ): Observable<UnavailabilityResponse[]> {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<ApiResponse<UnavailabilityResponse[]>>(
      `${this.apiUrl}/doctor/${doctorId}/unavailability`,
      { params }
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.selectedDoctorUnavailabilities.set(response.data);
        }
        this.loading.set(false);
      }),
      map(response => response.data!),
      catchError(error => {
        this.loading.set(false);
        this.handleError('خطأ في الحصول على أوقات عدم التوفر', error);
        return throwError(() => error);
      })
    );
  }

  // ===================================================================
  // 6. GET /schedules/doctor/{doctorId}/availability - Check Doctor Availability
  // ===================================================================
  checkDoctorAvailability(
    doctorId: number,
    date: string,
    time: string
  ): Observable<boolean> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams()
      .set('date', date)
      .set('time', time);

    return this.http.get<ApiResponse<boolean>>(
      `${this.apiUrl}/doctor/${doctorId}/availability`,
      { params }
    ).pipe(
      tap(() => this.loading.set(false)),
      map(response => response.data!),
      catchError(error => {
        this.loading.set(false);
        this.handleError('خطأ في التحقق من توفر الطبيب', error);
        return throwError(() => error);
      })
    );
  }

  // ===================================================================
  // 7. GET /schedules/doctor/{doctorId}/available-slots - Get Available Time Slots
  // ===================================================================
  getAvailableTimeSlots(
    doctorId: number,
    date: string,
    durationMinutes: number = 30
  ): Observable<string[]> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams()
      .set('date', date)
      .set('durationMinutes', durationMinutes.toString());

    return this.http.get<ApiResponse<string[]>>(
      `${this.apiUrl}/doctor/${doctorId}/available-slots`,
      { params }
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.availableTimeSlots.set(response.data);
        }
        this.loading.set(false);
      }),
      map(response => response.data!),
      catchError(error => {
        this.loading.set(false);
        this.handleError('خطأ في الحصول على الأوقات المتاحة', error);
        return throwError(() => error);
      })
    );
  }

  // ===================================================================
  // 8. GET /schedules/available-doctors - Get Available Doctors
  // ===================================================================
  getAvailableDoctors(date: string, time: string): Observable<DoctorSummaryResponse[]> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams()
      .set('date', date)
      .set('time', time);

    return this.http.get<ApiResponse<DoctorSummaryResponse[]>>(
      `${this.apiUrl}/available-doctors`,
      { params }
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.availableDoctors.set(response.data);
        }
        this.loading.set(false);
      }),
      map(response => response.data!),
      catchError(error => {
        this.loading.set(false);
        this.handleError('خطأ في الحصول على الأطباء المتاحين', error);
        return throwError(() => error);
      })
    );
  }

  // ===================================================================
  // 9. DELETE /schedules/{scheduleId} - Delete Schedule
  // ===================================================================
  deleteSchedule(scheduleId: number): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${scheduleId}`).pipe(
      tap(response => {
        if (response.success) {
          // Remove from local state
          const currentSchedules = this.doctorSchedules();
          const updatedSchedules = currentSchedules.filter(s => s.id !== scheduleId);
          this.doctorSchedules.set(updatedSchedules);
          this.schedulesSubject.next(updatedSchedules);

          this.notificationService.success('تم حذف الجدولة بنجاح');
        }
        this.loading.set(false);
      }),
      map(() => void 0),
      catchError(error => {
        this.loading.set(false);
        this.handleError('خطأ في حذف الجدولة', error);
        return throwError(() => error);
      })
    );
  }

  // ===================================================================
  // 10. DELETE /schedules/unavailability/{unavailabilityId} - Delete Unavailability
  // ===================================================================
  deleteUnavailability(unavailabilityId: number): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/unavailability/${unavailabilityId}`).pipe(
      tap(response => {
        if (response.success) {
          // Remove from local state
          const currentUnavailabilities = this.unavailabilities();
          const updatedUnavailabilities = currentUnavailabilities.filter(u => u.id !== unavailabilityId);
          this.unavailabilities.set(updatedUnavailabilities);
          this.unavailabilitiesSubject.next(updatedUnavailabilities);

          this.notificationService.success('تم حذف فترة عدم التوفر بنجاح');
        }
        this.loading.set(false);
      }),
      map(() => void 0),
      catchError(error => {
        this.loading.set(false);
        this.handleError('خطأ في حذف فترة عدم التوفر', error);
        return throwError(() => error);
      })
    );
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================

  // ===================================================================
  // SEARCH/FILTER Schedules
  // ===================================================================
  searchSchedules(criteria: ScheduleSearchCriteria): Observable<DoctorScheduleResponse[]> {
    this.loading.set(true);
    this.error.set(null);

    let clinicId = null;
    if (this.authService.currentUser()?.role === 'SYSTEM_ADMIN') {
      clinicId = this.systemAdminService.actingClinicContext()?.clinicId;
    }

    let params = new HttpParams();

    if (clinicId) {
      params = params.set('clinicId', clinicId);
    }

    if (criteria.doctorId) {
      params = params.set('doctorId', criteria.doctorId.toString());
    }

    if (criteria.dayOfWeek) {
      params = params.set('dayOfWeek', criteria.dayOfWeek);
    }

    if (criteria.scheduleType) {
      params = params.set('scheduleType', criteria.scheduleType);
    }

    if (criteria.isActive !== undefined && criteria.isActive !== null) {
      params = params.set('isActive', criteria.isActive.toString());
    }

    if (criteria.searchTerm) {
      params = params.set('searchTerm', criteria.searchTerm);
    }

    return this.http.get<ApiResponse<DoctorScheduleResponse[]>>(
      `${this.apiUrl}/search`,
      { params }
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.doctorSchedules.set(response.data);
          this.schedulesSubject.next(response.data);
        }
        this.loading.set(false);
      }),
      map(response => response.data!),
      catchError(error => {
        this.loading.set(false);
        this.handleError('خطأ في البحث عن الجداول', error);
        return throwError(() => error);
      })
    );
  }

  // Get weekly schedule view for all doctors
  getWeeklyScheduleView(): Observable<WeeklyScheduleView[]> {
    this.loading.set(true);

    return this.getAllDoctorsSchedules().pipe(
      map(schedules => this.buildWeeklyScheduleView(schedules)),
      tap(weeklyView => {
        this.weeklyScheduleView.set(weeklyView);
        this.loading.set(false);
      }),
      catchError(error => {
        this.loading.set(false);
        return throwError(() => error);
      })
    );
  }

  // Get duration info
  getDurationInfo(scheduleId: number): Observable<DoctorScheduleResponse> {
    this.loading.set(true);
    this.error.set(null);
    let clinicId = null;
    if (this.authService.currentUser()?.role === 'SYSTEM_ADMIN') {
      clinicId = this.systemAdminService.actingClinicContext()?.clinicId;
    }
    let params = new HttpParams();

    if (clinicId) {
      params = params.set('clinicId', clinicId);
    }

    return this.http.get<ApiResponse<DoctorScheduleResponse>>(
      `${this.apiUrl}/${scheduleId}/duration-info`, { params }
    ).pipe(
      tap(() => this.loading.set(false)),
      map(response => response.data!),
      catchError(error => {
        this.loading.set(false);
        this.handleError('خطأ في الحصول على معلومات المدة', error);
        return throwError(() => error);
      })
    );
  }

  // Build weekly schedule view from schedules
  private buildWeeklyScheduleView(schedules: DoctorScheduleResponse[]): WeeklyScheduleView[] {
    const doctorGroups = schedules.reduce((acc, schedule) => {
      const doctorId = schedule.doctorId;
      if (!acc[doctorId]) {
        acc[doctorId] = {
          doctorId: schedule.doctorId,
          doctorName: schedule.doctorName,
          specialization: schedule.doctorSpecialization,
          weeklySchedules: {},
          totalWeeklyHours: 0,
          isFullTime: false
        };
      }

      acc[doctorId].weeklySchedules[schedule.dayOfWeek] = {
        schedule: schedule as any,
        unavailabilities: [],
        workingHours: schedule.workingHours,
        availableSlots: schedule.availableSlots || 0
      };

      acc[doctorId].totalWeeklyHours += schedule.workingHours;

      return acc;
    }, {} as Record<number, WeeklyScheduleView>);

    return Object.values(doctorGroups).map(doctor => ({
      ...doctor,
      isFullTime: doctor.totalWeeklyHours >= 40
    }));
  }

  // Calculate schedule statistics
  calculateStatistics(): Observable<ScheduleStatistics> {
    return this.getAllDoctorsSchedules().pipe(
      map(schedules => {
        const stats: ScheduleStatistics = {
          totalSchedules: schedules.length,
          activeDoctors: new Set(schedules.filter(s => s.isActive).map(s => s.doctorId)).size,
          inactiveDoctors: new Set(schedules.filter(s => !s.isActive).map(s => s.doctorId)).size,
          totalWorkingHours: schedules.reduce((sum, s) => sum + (s.workingHours || 0), 0),
          averageWorkingHoursPerDoctor: 0,
          doctorsWithBreaks: schedules.filter(s => s.breakStartTime && s.breakEndTime).length,
          weekendWorkingDoctors: schedules.filter(s =>
            s.dayOfWeek === DayOfWeek.FRIDAY || s.dayOfWeek === DayOfWeek.SATURDAY
          ).length,
          schedulesThisWeek: schedules.length,
          unavailabilityPeriodsActive: 0,
          mostBusyDay: DayOfWeek.SUNDAY,
          leastBusyDay: DayOfWeek.FRIDAY
        };

        const activeDoctorsCount = stats.activeDoctors;
        stats.averageWorkingHoursPerDoctor = activeDoctorsCount > 0
          ? stats.totalWorkingHours / activeDoctorsCount
          : 0;

        // Calculate busiest and least busy days
        const dayStats = schedules.reduce((acc, schedule) => {
          acc[schedule.dayOfWeek] = (acc[schedule.dayOfWeek] || 0) + 1;
          return acc;
        }, {} as Record<DayOfWeek, number>);

        const sortedDays = Object.entries(dayStats).sort(([, a], [, b]) => b - a);
        if (sortedDays.length > 0) {
          stats.mostBusyDay = sortedDays[0][0] as DayOfWeek;
          stats.leastBusyDay = sortedDays[sortedDays.length - 1][0] as DayOfWeek;
        }

        this.scheduleStatistics.set(stats);
        return stats;
      })
    );
  }

  // update method
  updateSchedule(scheduleId: number, request: UpdateDoctorScheduleRequest): Observable<DoctorSchedule> {
    this.loading.set(true);
    this.error.set(null);

    // Validate SYSTEM_ADMIN context for write operations
    const currentUser = this.authService.currentUser();
    if (currentUser?.role === 'SYSTEM_ADMIN') {
      if (!this.systemAdminService.canPerformWriteOperation()) {
        return throwError(() => new Error('يجب تحديد العيادة المستهدفة قبل تحديث الجدول'));
      }
    }

    return this.http.put<ApiResponse<DoctorSchedule>>(
      `${this.apiUrl}/${scheduleId}`,
      request
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.notificationService.success('تم تحديث الجدول بنجاح');
          // Update in schedules list
          const currentSchedules = this.doctorSchedules();
          const index = currentSchedules.findIndex(s => s.id === scheduleId);
          if (index !== -1) {
            currentSchedules[index] = response.data;
            this.doctorSchedules.set([...currentSchedules]);
          }
        }
        this.loading.set(false);
      }),
      map(response => response.data!),
      catchError(error => {
        this.loading.set(false);
        this.handleError('فشل في تحديث الجدول', error);
        return throwError(() => error);
      })
    );
  }

  // batch update method
  batchUpdateSchedules(
    doctorId: number,
    daysOfWeek: DayOfWeek[],
    request: UpdateDoctorScheduleRequest
  ): Observable<DoctorSchedule[]> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams()
      .set('daysOfWeek', daysOfWeek.join(','));

    return this.http.put<ApiResponse<DoctorSchedule[]>>(
      `${this.apiUrl}/batch/doctor/${doctorId}`,
      request,
      { params }
    ).pipe(
      tap(response => {
        if (response.success) {
          this.notificationService.success(
            `تم تحديث ${response.data?.length || 0} جدول بنجاح`
          );
        }
        this.loading.set(false);
      }),
      map(response => response.data || []),
      catchError(error => {
        this.loading.set(false);
        this.handleError('فشل في تحديث الجداول', error);
        return throwError(() => error);
      })
    );
  }

  // Deactivate method
  deactivateSchedule(scheduleId: number): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.put<ApiResponse<void>>(
      `${this.apiUrl}/${scheduleId}/deactivate`,
      null
    ).pipe(
      tap(response => {
        if (response.success) {
          this.notificationService.success('تم تعطيل الجدول بنجاح');
          // Remove from active schedules
          const currentSchedules = this.doctorSchedules();
          this.doctorSchedules.set(currentSchedules.filter(s => s.id !== scheduleId));
        }
        this.loading.set(false);
      }),
      map(() => void 0),
      catchError(error => {
        this.loading.set(false);
        this.handleError('فشل في تعطيل الجدول', error);
        return throwError(() => error);
      })
    );
  }

  /**
 * Activate a schedule by updating its isActive status to true
 * Uses PUT /schedules/{scheduleId} endpoint with minimal update request
 */
  activateSchedule(scheduleId: number): Observable<DoctorScheduleResponse> {
    this.loading.set(true);
    this.error.set(null);

    // Create minimal update request to set isActive to true
    const activationRequest: UpdateDoctorScheduleRequest = {
      isActive: true
    };

    return this.http.put<ApiResponse<DoctorScheduleResponse>>(
      `${this.apiUrl}/${scheduleId}`,
      activationRequest
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.notificationService.success('تم تفعيل الجدول بنجاح');

          // Update local state
          const currentSchedules = this.doctorSchedules();
          const updatedSchedules = currentSchedules.map(schedule =>
            schedule.id === scheduleId
              ? { ...schedule, isActive: true }
              : schedule
          );
          this.doctorSchedules.set(updatedSchedules);
          this.schedulesSubject.next(updatedSchedules);
        }
        this.loading.set(false);
      }),
      map(response => response.data!),
      catchError(error => {
        this.loading.set(false);
        this.handleError('فشل في تفعيل الجدول', error);
        return throwError(() => error);
      })
    );
  }

  // clone method
  cloneSchedule(scheduleId: number, targetDays: DayOfWeek[]): Observable<DoctorSchedule[]> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams()
      .set('targetDays', targetDays.join(','));

    return this.http.post<ApiResponse<DoctorSchedule[]>>(
      `${this.apiUrl}/${scheduleId}/clone`,
      null,
      { params }
    ).pipe(
      tap(response => {
        if (response.success) {
          this.notificationService.success(
            `تم نسخ الجدول إلى ${response.data?.length || 0} أيام جديدة`
          );
          // Add cloned schedules to list
          if (response.data) {
            const currentSchedules = this.doctorSchedules();
            this.doctorSchedules.set([...response.data, ...currentSchedules]);
          }
        }
        this.loading.set(false);
      }),
      map(response => response.data || []),
      catchError(error => {
        this.loading.set(false);
        this.handleError('فشل في نسخ الجدول', error);
        return throwError(() => error);
      })
    );
  }

  // Clear all state
  clearState(): void {
    this.doctorSchedules.set([]);
    this.selectedDoctorSchedules.set([]);
    this.unavailabilities.set([]);
    this.selectedDoctorUnavailabilities.set([]);
    this.availableDoctors.set([]);
    this.availableTimeSlots.set([]);
    this.scheduleStatistics.set(null);
    this.weeklyScheduleView.set([]);
    this.error.set(null);
    this.loading.set(false);
  }

  // Error handling
  private handleError(message: string, error: HttpErrorResponse): void {
    let errorMessage = message;

    if (error.error?.message) {
      errorMessage += `: ${error.error.message}`;
    } else if (error.error?.error) {
      errorMessage += `: ${error.error.error}`;
    } else if (error.message) {
      errorMessage += `: ${error.message}`;
    }

    this.error.set(errorMessage);
    this.notificationService.error(errorMessage);
    console.error('Schedule Service Error:', error);
  }
}
