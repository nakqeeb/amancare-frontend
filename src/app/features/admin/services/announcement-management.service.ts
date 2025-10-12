// ===================================================================
// src/app/features/admin/services/announcement-management.service.ts
// Announcement Management Service for SYSTEM_ADMIN
// ===================================================================

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PageResponse } from '../../../core/models/api-response.model';
import {
  Announcement,
  CreateAnnouncementRequest,
  UpdateAnnouncementRequest,
  AnnouncementFilter
} from '../models/announcement-management.model';

@Injectable({
  providedIn: 'root'
})
export class AnnouncementManagementService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admin/announcements`;

  // Signals for state management
  announcements = signal<Announcement[]>([]);
  loading = signal(false);
  selectedAnnouncement = signal<Announcement | null>(null);

  /**
   * Get all announcements with pagination
   */
  getAnnouncements(
    page: number = 0,
    size: number = 10,
    sortBy: string = 'createdAt',
    direction: string = 'DESC'
  ): Observable<PageResponse<Announcement>> {
    this.loading.set(true);

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('direction', direction);

    return this.http.get<ApiResponse<PageResponse<Announcement>>>(this.apiUrl, { params })
      .pipe(
        map(response => response.data!), // extract PageResponse<Announcement>
        tap(pageResponse => {
          this.announcements.set(pageResponse.content); // update store with content array
          this.loading.set(false);
        })
      );
  }

  /**
   * Get all announcements as list (no pagination)
   */
  getAllAnnouncementsList(): Observable<Announcement[]> {
    this.loading.set(true);

    return this.http.get<ApiResponse<Announcement[]>>(`${this.apiUrl}/list`)
      .pipe(
        map(response => response.data ?? []),
        tap(announcements => {
          this.announcements.set(announcements);
          this.loading.set(false);
        })
      );
  }

  /**
   * Get announcement by ID
   */
  getAnnouncementById(id: number): Observable<Announcement> {
    return this.http.get<ApiResponse<Announcement>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => response.data!), // extract the Announcement
        tap(announcement => {
          this.selectedAnnouncement.set(announcement); // update store
        })
      );
  }

  /**
   * Create new announcement
   */
  createAnnouncement(request: CreateAnnouncementRequest): Observable<Announcement> {
    return this.http.post<ApiResponse<Announcement>>(this.apiUrl, request).pipe(
      map(response => response.data!), // extract the Announcement
    );
  }

  /**
   * Update announcement
   */
  updateAnnouncement(id: number, request: UpdateAnnouncementRequest): Observable<Announcement> {
    return this.http.put<ApiResponse<Announcement>>(`${this.apiUrl}/${id}`, request).pipe(
      map(response => response.data!), // extract the updated Announcement
    );
  }

  /**
   * Activate announcement
   */
  activateAnnouncement(id: number): Observable<Announcement> {
    return this.http.patch<ApiResponse<Announcement>>(`${this.apiUrl}/${id}/activate`, {}).pipe(
      map(response => {
        if (!response.success || !response.data) throw new Error('Failed to activate announcement');
        return response.data;
      })
    );
  }

  /**
   * Deactivate announcement
   */
  deactivateAnnouncement(id: number): Observable<Announcement> {
    return this.http.patch<ApiResponse<Announcement>>(`${this.apiUrl}/${id}/deactivate`, {}).pipe(
      map(response => {
        if (!response.success || !response.data) throw new Error('Failed to deactivate announcement');
        return response.data;
      })
    );
  }

  /**
   * Delete announcement
   */
  deleteAnnouncement(id: number): Observable<Announcement> {
    return this.http.delete<ApiResponse<Announcement>>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        if (!response.success) throw new Error('Failed to delete announcement');
        return response.data!;
      })
    );
  }

  /**
   * Clear selected announcement
   */
  clearSelectedAnnouncement(): void {
    this.selectedAnnouncement.set(null);
  }
}
