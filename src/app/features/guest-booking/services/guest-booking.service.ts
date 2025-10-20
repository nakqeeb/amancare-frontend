// src/app/features/guest-booking/services/guest-booking.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  ClinicSummary,
  ClinicDoctorSummary,
  DoctorScheduleSummary,
  GuestBookingRequest,
  GuestBookingResponse,
  TimeSlot
} from '../models/guest-booking.model';
import { AppointmentResponse } from '../../appointments/models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class GuestBookingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/guest`;

  /**
   * Get all active clinics
   * Endpoint: GET /guest/clinics
   */
  getClinics(): Observable<ClinicSummary[]> {
    return this.http.get<ApiResponse<ClinicSummary[]>>(`${this.apiUrl}/clinics`).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching clinics:', error);
        return of([]);
      })
    );
  }

  /**
   * Get doctors for a specific clinic
   * Endpoint: GET /guest/clinics/{clinicId}/doctors
   */
  getClinicDoctors(clinicId: number): Observable<ClinicDoctorSummary[]> {
    return this.http.get<ApiResponse<ClinicDoctorSummary[]>>(
      `${this.apiUrl}/clinics/${clinicId}/doctors`
    ).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching doctors:', error);
        return of([]);
      })
    );
  }

  /**
   * Get doctor's schedules for a specific clinic
   * Endpoint: GET /guest/doctor/{doctorId}/schedules
   */
  getDoctorSchedules(clinicId: number, doctorId: number): Observable<DoctorScheduleSummary[]> {
    const params = new HttpParams()
      .set('clinicId', clinicId)
    return this.http.get<ApiResponse<DoctorScheduleSummary[]>>(
      `${this.apiUrl}/doctor/${doctorId}/schedules`, { params }
    ).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching schedules:', error);
        return of([]);
      })
    );
  }

  /**
   * Get available time slots for a doctor on a specific date
   * Endpoint: GET /guest/clinics/{clinicId}/doctors/{doctorId}/available-slots?date=YYYY-MM-DD&durationMinutes=30
   */
  getAvailableTimes(
    clinicId: number,
    doctorId: number,
    date: string,
    durationMinutes: number = 30
  ): Observable<string[]> {
    const params = new HttpParams()
      .set('date', date)
      .set('durationMinutes', durationMinutes.toString());

    return this.http.get<ApiResponse<string[]>>(
      `${this.apiUrl}/clinics/${clinicId}/doctors/${doctorId}/available-slots`,
      { params }
    ).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching available times:', error);
        return throwError(() => error);
      })
    );
  }

  // Update the getAvailableTimes method to include token numbers
getAvailableTimesWithTokens(
  clinicId: number,
  doctorId: number,
  date: string,
  durationMinutes: number = 30
): Observable<TimeSlot[]> {
  const params = new HttpParams()
    .set('date', date)
    .set('durationMinutes', durationMinutes.toString());

  return this.http.get<ApiResponse<{ [time: string]: number }>>(
    `${environment.apiUrl}/schedules/doctor/${doctorId}/available-slots-with-tokens`,
    { params }
  ).pipe(
    map(response => {
      if (response.success && response.data) {
        // Convert object to TimeSlot array
        return Object.entries(response.data).map(([time, tokenNumber]) => ({
          time,
          available: true,
          tokenNumber
        }));
      }
      return [];
    }),
    catchError(error => {
      console.error('Error fetching available times with tokens:', error);
      return of([]);
    })
  );
}

  /**
   * Book appointment as guest
   * Endpoint: POST /guest/book-appointment
   */
  createAppointment(request: GuestBookingRequest): Observable<GuestBookingResponse> {
    return this.http.post<ApiResponse<GuestBookingResponse>>(
      `${this.apiUrl}/book-appointment`,
      request
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'فشل في إنشاء الموعد');
      }),
      catchError(error => {
        console.error('Error creating appointment:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get guest appointments by patient number
   * Endpoint: GET /guest/appointments?patientNumber=XXX
   */
  getGuestAppointments(patientNumber: string): Observable<AppointmentResponse[]> {
    const params = new HttpParams().set('patientNumber', patientNumber);

    return this.http.get<ApiResponse<AppointmentResponse[]>>(
      `${this.apiUrl}/appointments`,
      { params }
    ).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching appointments:', error);
        return of([]);
      })
    );
  }

  /**
   * Confirm a guest appointment via token
   * Endpoint: POST /guest/confirm-appointment?token=XXX
   */
  confirmAppointment(token: string): Observable<boolean> {
    const params = new HttpParams().set('token', token);

    return this.http.post<ApiResponse<void>>(
      `${this.apiUrl}/confirm-appointment`,
      null,
      { params }
    ).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Error confirming appointment:', error);
        return of(false);
      })
    );
  }

  /**
   * Cancel a guest appointment
   * Endpoint: DELETE /guest/appointments/{appointmentId}?patientNumber=XXX
   */
  cancelAppointment(appointmentId: number, patientNumber: string): Observable<boolean> {
    const params = new HttpParams().set('patientNumber', patientNumber);

    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/appointments/${appointmentId}`,
      { params }
    ).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Error canceling appointment:', error);
        return of(false);
      })
    );
  }
}
