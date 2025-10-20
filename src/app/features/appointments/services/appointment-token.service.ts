import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';

export interface TimeSlotsWithTokens {
  [time: string]: number; // time -> token number mapping
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentTokenService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/appointments/tokens`;

  /**
   * Get all time slots with their token numbers for a doctor on a specific date
   */
  getAllTimeSlotsWithTokens(
    doctorId: number,
    date: string,
    durationMinutes: number = 30
  ): Observable<TimeSlotsWithTokens> {
    const params = new HttpParams()
      .set('date', date)
      .set('durationMinutes', durationMinutes.toString());

    return this.http.get<ApiResponse<TimeSlotsWithTokens>>(
      `${this.apiUrl}/doctor/${doctorId}/slots`,
      { params }
    ).pipe(
      map(response => response.data || {}),
      catchError(error => {
        console.error('Error fetching time slots with tokens:', error);
        throw error;
      })
    );
  }

  /**
   * Get available time slots with their token numbers (excluding booked slots)
   */
  getAvailableTimeSlotsWithTokens(
    doctorId: number,
    date: string,
    durationMinutes: number = 30
  ): Observable<TimeSlotsWithTokens> {
    const params = new HttpParams()
      .set('date', date)
      .set('durationMinutes', durationMinutes.toString());

    return this.http.get<ApiResponse<TimeSlotsWithTokens>>(
      `${this.apiUrl}/doctor/${doctorId}/available-slots`,
      { params }
    ).pipe(
      map(response => response.data || {}),
      catchError(error => {
        console.error('Error fetching available slots with tokens:', error);
        throw error;
      })
    );
  }

  /**
   * Get token number for a specific time slot
   */
  getTokenForTimeSlot(
    doctorId: number,
    date: string,
    time: string,
    durationMinutes: number = 30
  ): Observable<number> {
    const params = new HttpParams()
      .set('date', date)
      .set('time', time)
      .set('durationMinutes', durationMinutes.toString());

    return this.http.get<ApiResponse<number>>(
      `${this.apiUrl}/doctor/${doctorId}/token`,
      { params }
    ).pipe(
      map(response => response.data!),
      catchError(error => {
        console.error('Error fetching token number:', error);
        throw error;
      })
    );
  }
}
