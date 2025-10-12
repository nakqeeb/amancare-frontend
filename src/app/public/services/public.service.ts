// src/app/public/services/public.service.ts

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, interval } from 'rxjs';
import { map, catchError, switchMap, startWith, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/api-response.model';
import { Announcement, DoctorAvailability } from '../models/announcement.model';

@Injectable({
  providedIn: 'root'
})
export class PublicService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/public`;

  announcements = signal<Announcement[]>([]);
  availableDoctors = signal<DoctorAvailability[]>([]);
  loading = signal(false);

  /**
   * Get active announcements
   */
  getActiveAnnouncements(): Observable<Announcement[]> {
    return this.http.get<ApiResponse<Announcement[]>>(
      `${this.apiUrl}/announcements/active`
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.announcements.set(response.data);
        }
      }),
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching announcements:', error);
        return of([]);
      })
    );
  }

  /**
   * Get currently available doctors
   */
  getAvailableDoctors(clinicId?: number): Observable<DoctorAvailability[]> {
    let params = new HttpParams();
    if (clinicId) {
      params = params.set('clinicId', clinicId.toString());
    }

    return this.http.get<ApiResponse<DoctorAvailability[]>>(
      `${this.apiUrl}/doctors/available`,
      { params }
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.availableDoctors.set(response.data);
        }
      }),
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching available doctors:', error);
        return of([]);
      })
    );
  }

  /**
   * Auto-refresh announcements every 5 minutes
   */
  startAnnouncementsAutoRefresh(): Observable<Announcement[]> {
    return interval(5 * 60 * 1000).pipe(
      startWith(0),
      switchMap(() => this.getActiveAnnouncements())
    );
  }

  /**
   * Auto-refresh available doctors every 2 minutes
   */
  startDoctorsAutoRefresh(): Observable<DoctorAvailability[]> {
    return interval(2 * 60 * 1000).pipe(
      startWith(0),
      switchMap(() => this.getAvailableDoctors())
    );
  }
}
