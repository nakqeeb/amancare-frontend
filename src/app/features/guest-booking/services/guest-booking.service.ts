// src/app/features/guest-booking/services/guest-booking.service.ts

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { NotificationService } from '../../../core/services/notification.service';
import {
  GuestBookingRequest,
  GuestBookingResponse,
  ClinicDoctorSummary
} from '../models/guest-booking.model';
import { AppointmentResponse } from '../../appointments/models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class GuestBookingService {
  private readonly http = inject(HttpClient);
  private readonly notificationService = inject(NotificationService);
  private readonly apiUrl = `${environment.apiUrl}/guest`;

  // Signals
  loading = signal(false);
  error = signal<string | null>(null);

  /**
   * Get clinic doctors
   */
  getClinicDoctors(clinicId: number): Observable<ClinicDoctorSummary[]> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<ApiResponse<ClinicDoctorSummary[]>>(
      `${this.apiUrl}/clinics/${clinicId}/doctors`
    ).pipe(
      tap(() => this.loading.set(false)),
      map(response => response.data!),
      catchError(error => {
        this.loading.set(false);
        this.handleError('فشل في تحميل قائمة الأطباء', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get available time slots
   */
  getAvailableTimeSlots(
    clinicId: number,
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
      `${this.apiUrl}/clinics/${clinicId}/doctors/${doctorId}/available-slots`,
      { params }
    ).pipe(
      tap(() => this.loading.set(false)),
      map(response => response.data!),
      catchError(error => {
        this.loading.set(false);
        this.handleError('فشل في تحميل الأوقات المتاحة', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Book appointment as guest
   */
  bookAppointment(request: GuestBookingRequest): Observable<GuestBookingResponse> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.post<ApiResponse<GuestBookingResponse>>(
      `${this.apiUrl}/book-appointment`,
      request
    ).pipe(
      tap(response => {
        if (response.success) {
          this.notificationService.success('تم حجز موعدك بنجاح! تحقق من بريدك الإلكتروني');
        }
        this.loading.set(false);
      }),
      map(response => response.data!),
      catchError(error => {
        this.loading.set(false);
        this.handleError('فشل في حجز الموعد', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Confirm appointment
   */
  confirmAppointment(token: string): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams().set('token', token);

    return this.http.post<ApiResponse<void>>(
      `${this.apiUrl}/confirm-appointment`,
      null,
      { params }
    ).pipe(
      tap(() => {
        this.notificationService.success('تم تأكيد موعدك بنجاح!');
        this.loading.set(false);
      }),
      map(response => response.data!),
      catchError(error => {
        this.loading.set(false);
        this.handleError('فشل في تأكيد الموعد', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get patient appointments
   */
  getMyAppointments(patientNumber: string): Observable<AppointmentResponse[]> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams().set('patientNumber', patientNumber);

    return this.http.get<ApiResponse<AppointmentResponse[]>>(
      `${this.apiUrl}/appointments`,
      { params }
    ).pipe(
      tap(() => this.loading.set(false)),
      map(response => response.data!),
      catchError(error => {
        this.loading.set(false);
        this.handleError('فشل في تحميل المواعيد', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Cancel appointment
   */
  cancelAppointment(appointmentId: number, patientNumber: string): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams().set('patientNumber', patientNumber);

    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/appointments/${appointmentId}`,
      { params }
    ).pipe(
      tap(() => {
        this.notificationService.success('تم إلغاء الموعد بنجاح');
        this.loading.set(false);
      }),
      map(response => response.data!),
      catchError(error => {
        this.loading.set(false);
        this.handleError('فشل في إلغاء الموعد', error);
        return throwError(() => error);
      })
    );
  }

  private handleError(message: string, error: any): void {
    const errorMessage = error?.error?.message || message;
    this.error.set(errorMessage);
    this.notificationService.error(errorMessage);
  }
}
