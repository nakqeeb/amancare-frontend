// ===================================================================
// src/app/features/admin/services/admin.service.ts
// Admin Service - Complete Integration with Spring Boot Audit API
// ===================================================================
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, throwError } from 'rxjs';
import { format } from 'date-fns';

import { environment } from '../../../../environments/environment';
import { NotificationService } from '../../../core/services/notification.service';
import { ApiResponse, PageResponse } from '../../../core/models/api-response.model';
import {
  AuditLogResponse,
  AuditStatisticsResponse,
  AuditFilters,
  AuditExportParams
} from '../models/audit.model';

/**
 * Admin Service - Handles all /admin/audit endpoints
 * Only accessible by SYSTEM_ADMIN role
 */
@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);

  private readonly apiUrl = `${environment.apiUrl}/admin/audit`;

  // ===================================================================
  // STATE MANAGEMENT
  // ===================================================================

  // Signals for reactive state management
  auditLogs = signal<AuditLogResponse[]>([]);
  recentActions = signal<AuditLogResponse[]>([]);
  statistics = signal<AuditStatisticsResponse | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  // BehaviorSubjects for compatibility
  private auditLogsSubject = new BehaviorSubject<AuditLogResponse[]>([]);
  private statisticsSubject = new BehaviorSubject<AuditStatisticsResponse | null>(null);

  public auditLogs$ = this.auditLogsSubject.asObservable();
  public statistics$ = this.statisticsSubject.asObservable();

  // ===================================================================
  // ENDPOINT 1: GET /admin/audit/logs - Get audit logs with filtering and pagination
  // ===================================================================
  getAuditLogs(filters: AuditFilters): Observable<ApiResponse<PageResponse<AuditLogResponse>>> {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams();

    // Add optional filters
    if (filters.adminUserId) {
      params = params.set('adminUserId', filters.adminUserId.toString());
    }
    if (filters.clinicId) {
      params = params.set('clinicId', filters.clinicId.toString());
    }
    if (filters.actionType) {
      params = params.set('actionType', filters.actionType);
    }
    if (filters.resourceType) {
      params = params.set('resourceType', filters.resourceType);
    }
    if (filters.startDate) {
      // Format as ISO DateTime: 2025-08-23T00:00:00
      params = params.set('startDate', format(filters.startDate, "yyyy-MM-dd'T'HH:mm:ss"));
    }
    if (filters.endDate) {
      params = params.set('endDate', format(filters.endDate, "yyyy-MM-dd'T'HH:mm:ss"));
    }

    // Pagination and sorting
    params = params.set('page', (filters.page ?? 0).toString());
    params = params.set('size', (filters.size ?? 20).toString());
    params = params.set('sortBy', filters.sortBy ?? 'createdAt');
    params = params.set('sortDirection', filters.sortDirection ?? 'DESC');

    return this.http.get<ApiResponse<PageResponse<AuditLogResponse>>>(
      `${this.apiUrl}/logs`,
      { params }
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.auditLogs.set(response.data.content);
          this.auditLogsSubject.next(response.data.content);
        }
        this.loading.set(false);
      }),
      catchError(error => {
        this.loading.set(false);
        this.error.set('فشل في تحميل سجلات المراجعة');
        this.notificationService.error('فشل في تحميل سجلات المراجعة');
        return throwError(() => error);
      })
    );
  }

  // ===================================================================
  // ENDPOINT 2: GET /admin/audit/recent - Get recent actions for current user
  // ===================================================================
  getRecentActions(limit: number = 10): Observable<ApiResponse<AuditLogResponse[]>> {
    this.loading.set(true);

    let params = new HttpParams();
    params = params.set('limit', limit.toString());

    return this.http.get<ApiResponse<AuditLogResponse[]>>(
      `${this.apiUrl}/recent`,
      { params }
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.recentActions.set(response.data);
        }
        this.loading.set(false);
      }),
      catchError(error => {
        this.loading.set(false);
        this.notificationService.error('فشل في تحميل الإجراءات الأخيرة');
        return throwError(() => error);
      })
    );
  }

  // ===================================================================
  // ENDPOINT 3: GET /admin/audit/statistics - Get audit statistics
  // ===================================================================
  getAuditStatistics(
    adminUserId?: number,
    startDate?: Date,
    endDate?: Date
  ): Observable<ApiResponse<AuditStatisticsResponse>> {
    this.loading.set(true);

    let params = new HttpParams();

    if (adminUserId) {
      params = params.set('adminUserId', adminUserId.toString());
    }
    if (startDate) {
      // Format as ISO Date: 2025-08-23
      params = params.set('startDate', format(startDate, 'yyyy-MM-dd'));
    }
    if (endDate) {
      params = params.set('endDate', format(endDate, 'yyyy-MM-dd'));
    }

    return this.http.get<ApiResponse<AuditStatisticsResponse>>(
      `${this.apiUrl}/statistics`,
      { params }
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.statistics.set(response.data);
          this.statisticsSubject.next(response.data);
        }
        this.loading.set(false);
      }),
      catchError(error => {
        this.loading.set(false);
        this.notificationService.error('فشل في تحميل الإحصائيات');
        return throwError(() => error);
      })
    );
  }

  // ===================================================================
  // ENDPOINT 4: GET /admin/audit/resource/{resourceType}/{resourceId} - Get resource audit trail
  // ===================================================================
  getResourceAuditTrail(
    resourceType: string,
    resourceId: number
  ): Observable<ApiResponse<AuditLogResponse[]>> {
    this.loading.set(true);

    return this.http.get<ApiResponse<AuditLogResponse[]>>(
      `${this.apiUrl}/resource/${resourceType}/${resourceId}`
    ).pipe(
      tap(() => {
        this.loading.set(false);
      }),
      catchError(error => {
        this.loading.set(false);
        this.notificationService.error('فشل في تحميل سجل المورد');
        return throwError(() => error);
      })
    );
  }

  // ===================================================================
  // ENDPOINT 5: GET /admin/audit/export/csv - Export audit logs to CSV
  // ===================================================================
  exportAuditLogsToCsv(params: AuditExportParams): Observable<string> {
    this.loading.set(true);

    let httpParams = new HttpParams();
    // Format as ISO DateTime: 2025-08-23T00:00:00 (REQUIRED parameters)
    httpParams = httpParams.set('startDate', format(params.startDate, "yyyy-MM-dd'T'HH:mm:ss"));
    httpParams = httpParams.set('endDate', format(params.endDate, "yyyy-MM-dd'T'HH:mm:ss"));

    return this.http.get(
      `${this.apiUrl}/export/csv`,
      {
        params: httpParams,
        responseType: 'text' // Important: CSV is returned as plain text
      }
    ).pipe(
      tap(() => {
        this.loading.set(false);
        this.notificationService.success('تم تصدير سجلات المراجعة بنجاح');
      }),
      catchError(error => {
        this.loading.set(false);
        this.notificationService.error('فشل في تصدير السجلات');
        return throwError(() => error);
      })
    );
  }

  // ===================================================================
  // ENDPOINT 6: GET /admin/audit/activity/check - Check if user has recent activity
  // ===================================================================
  checkRecentActivity(withinMinutes: number = 30): Observable<ApiResponse<boolean>> {
    let params = new HttpParams();
    params = params.set('withinMinutes', withinMinutes.toString());

    return this.http.get<ApiResponse<boolean>>(
      `${this.apiUrl}/activity/check`,
      { params }
    ).pipe(
      catchError(error => {
        this.notificationService.error('فشل في التحقق من النشاط');
        return throwError(() => error);
      })
    );
  }

  // ===================================================================
  // HELPER METHODS
  // ===================================================================

  /**
   * Download CSV file helper
   */
  downloadCsvFile(csvContent: string, filename?: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const defaultFilename = `audit_logs_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename || defaultFilename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Export audit logs and trigger download
   */
  exportAndDownloadAuditLogs(startDate: Date, endDate: Date): void {
    this.exportAuditLogsToCsv({ startDate, endDate }).subscribe({
      next: (csvContent) => {
        const filename = `audit_logs_${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}.csv`;
        this.downloadCsvFile(csvContent, filename);
      },
      error: (error) => {
        console.error('Export failed:', error);
      }
    });
  }

  /**
   * Clear state
   */
  clearState(): void {
    this.auditLogs.set([]);
    this.recentActions.set([]);
    this.statistics.set(null);
    this.error.set(null);
  }
}
