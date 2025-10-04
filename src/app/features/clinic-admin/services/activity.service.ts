// =============================================================================
// Activity Service - خدمة الأنشطة
// src/app/features/admin/services/activity.service.ts
// =============================================================================

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, throwError } from 'rxjs';
import { format } from 'date-fns';

import { environment } from '../../../../environments/environment';
import { NotificationService } from '../../../core/services/notification.service';
import { ApiResponse, PageResponse } from '../../../core/models/api-response.model';
import {
  ActivityLogResponse,
  ActivityStatisticsResponse,
  ActivitySearchFilters,
  ActionType
} from '../models/activity.model';
import { SystemAdminService } from '../../../core/services/system-admin.service';
import { AuthService } from '../../../core/services/auth.service';

/**
 * خدمة الأنشطة - مسؤولة عن جلب وإدارة سجلات الأنشطة
 * Activity Service - Handles fetching and managing activity logs
 */
@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);
  private systemAdminService = inject(SystemAdminService);
  private authService = inject(AuthService);

  private readonly apiUrl = `${environment.apiUrl}/admin/activities`;

  // ===================================================================
  // STATE MANAGEMENT
  // ===================================================================

  // Signals for reactive state management
  recentActivities = signal<ActivityLogResponse[]>([]);
  statistics = signal<ActivityStatisticsResponse | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  // BehaviorSubjects for compatibility
  private activitiesSubject = new BehaviorSubject<ActivityLogResponse[]>([]);
  private statisticsSubject = new BehaviorSubject<ActivityStatisticsResponse | null>(null);

  public activities$ = this.activitiesSubject.asObservable();
  public statistics$ = this.statisticsSubject.asObservable();

  // ===================================================================
  // API METHODS
  // ===================================================================

  /**
   * Get recent activities
   */
  getRecentActivities(limit: number = 50): Observable<ApiResponse<ActivityLogResponse[]>> {
    this.loading.set(true);
    this.error.set(null);

    let clinicId = null;
    if (this.authService.currentUser()?.role === 'SYSTEM_ADMIN') {
      clinicId = this.systemAdminService.actingClinicContext()?.clinicId;
    }

    let params = new HttpParams().set('limit', limit.toString());

    if (clinicId) {
      params = params.set('clinicId', clinicId);
    }

    return this.http.get<ApiResponse<ActivityLogResponse[]>>(`${this.apiUrl}/recent`, { params })
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.recentActivities.set(response.data);
            this.activitiesSubject.next(response.data);
          }
          this.loading.set(false);
        }),
        catchError(error => {
          this.loading.set(false);
          this.error.set(error.message);
          this.notificationService.error('فشل في جلب الأنشطة الأخيرة');
          return throwError(() => error);
        })
      );
  }

  /**
   * Search activities with filters
   */
  searchActivities(
    filters: ActivitySearchFilters
  ): Observable<ApiResponse<PageResponse<ActivityLogResponse>>> {
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
    if (filters.userId) {
      params = params.set('userId', filters.userId.toString());
    }
    if (filters.actionType) {
      params = params.set('actionType', filters.actionType);
    }
    if (filters.entityType) {
      params = params.set('entityType', filters.entityType);
    }
    if (filters.startDate) {
      params = params.set('startDate', filters.startDate.toISOString());
    }
    if (filters.endDate) {
      params = params.set('endDate', filters.endDate.toISOString());
    }
    if (filters.searchTerm) {
      params = params.set('searchTerm', filters.searchTerm);
    }
    if (filters.page !== undefined) {
      params = params.set('page', filters.page.toString());
    }
    if (filters.size !== undefined) {
      params = params.set('size', filters.size.toString());
    }
    if (filters.sortBy) {
      params = params.set('sortBy', filters.sortBy);
    }
    if (filters.sortDirection) {
      params = params.set('sortDirection', filters.sortDirection);
    }

    return this.http.get<ApiResponse<PageResponse<ActivityLogResponse>>>(
      `${this.apiUrl}/search`,
      { params }
    ).pipe(
      tap(response => {
        this.loading.set(false);
      }),
      catchError(error => {
        this.loading.set(false);
        this.error.set(error.message);
        this.notificationService.error('فشل في البحث عن الأنشطة');
        return throwError(() => error);
      })
    );
  }

  /**
   * Get entity activity trail
   */
  getEntityActivityTrail(
    entityType: string,
    entityId: number
  ): Observable<ApiResponse<ActivityLogResponse[]>> {
    let clinicId = null;
    if (this.authService.currentUser()?.role === 'SYSTEM_ADMIN') {
      clinicId = this.systemAdminService.actingClinicContext()?.clinicId;
    }
    let params = new HttpParams();

    if (clinicId) {
      params = params.set('clinicId', clinicId);
    }

    return this.http.get<ApiResponse<ActivityLogResponse[]>>(
      `${this.apiUrl}/entity/${entityType}/${entityId}`, { params }
    ).pipe(
      catchError(error => {
        this.notificationService.error('فشل في جلب سجل نشاط الكيان');
        return throwError(() => error);
      })
    );
  }

  /**
   * Get activities by user
   */
  getActivitiesByUser(
    userId: number,
    page: number = 0,
    size: number = 20
  ): Observable<ApiResponse<PageResponse<ActivityLogResponse>>> {
    let clinicId = null;
    if (this.authService.currentUser()?.role === 'SYSTEM_ADMIN') {
      clinicId = this.systemAdminService.actingClinicContext()?.clinicId;
    }
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (clinicId) {
      params = params.set('clinicId', clinicId);
    }

    return this.http.get<ApiResponse<PageResponse<ActivityLogResponse>>>(
      `${this.apiUrl}/user/${userId}`,
      { params }
    ).pipe(
      catchError(error => {
        this.notificationService.error('فشل في جلب أنشطة المستخدم');
        return throwError(() => error);
      })
    );
  }

  /**
   * Get activity statistics
   */
  getStatistics(since?: Date): Observable<ApiResponse<ActivityStatisticsResponse>> {
    let clinicId = null;
    if (this.authService.currentUser()?.role === 'SYSTEM_ADMIN') {
      clinicId = this.systemAdminService.actingClinicContext()?.clinicId;
    }

    let params = new HttpParams();

    if (since) {
      params = params.set('since', since.toISOString());
    }

    if (clinicId) {
      params = params.set('clinicId', clinicId);
    }

    return this.http.get<ApiResponse<ActivityStatisticsResponse>>(
      `${this.apiUrl}/statistics`,
      { params }
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.statistics.set(response.data);
          this.statisticsSubject.next(response.data);
        }
      }),
      catchError(error => {
        this.notificationService.error('فشل في جلب إحصائيات الأنشطة');
        return throwError(() => error);
      })
    );
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================

  /**
   * Get action type label in Arabic
   */
  getActionTypeLabel(actionType: ActionType): string {
    const labels: { [key in ActionType]: string } = {
      [ActionType.CREATE]: 'إنشاء',
      [ActionType.UPDATE]: 'تحديث',
      [ActionType.PATCH]: 'تعديل',
      [ActionType.DELETE]: 'حذف'
    };
    return labels[actionType];
  }

  /**
   * Get entity type label in Arabic
   */
  getEntityTypeLabel(entityType: string): string {
    // Edited: Added authentication and registration labels
    const labels: { [key: string]: string } = {
      'Patient': 'مريض',
      'Appointment': 'موعد',
      'MedicalRecord': 'سجل طبي',
      'Invoice': 'فاتورة',
      'Payment': 'دفعة',
      'User': 'مستخدم',
      'Clinic': 'عيادة',
      'Authentication': 'تسجيل دخول',
      'Registration': 'تسجيل حساب'
    };
    // End of edit
    return labels[entityType] || entityType;
  }

  /**
   * Get action icon
   */
  getActionIcon(actionType: ActionType): string {
    const icons: { [key in ActionType]: string } = {
      [ActionType.CREATE]: 'add_circle',
      [ActionType.UPDATE]: 'edit',
      [ActionType.PATCH]: 'edit_note',
      [ActionType.DELETE]: 'delete'
    };
    return icons[actionType];
  }

  /**
   * Get action color
   */
  getActionColor(actionType: ActionType): string {
    const colors: { [key in ActionType]: string } = {
      [ActionType.CREATE]: 'success',
      [ActionType.UPDATE]: 'primary',
      [ActionType.PATCH]: 'accent',
      [ActionType.DELETE]: 'warn'
    };
    return colors[actionType];
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'الآن';
    } else if (diffMins < 60) {
      return `قبل ${diffMins} ${diffMins === 1 ? 'دقيقة' : 'دقائق'}`;
    } else if (diffHours < 24) {
      return `قبل ${diffHours} ${diffHours === 1 ? 'ساعة' : 'ساعات'}`;
    } else if (diffDays < 7) {
      return `قبل ${diffDays} ${diffDays === 1 ? 'يوم' : 'أيام'}`;
    } else {
      return format(date, 'dd/MM/yyyy HH:mm');
    }
  }

  /**
   * Clear cached data
   */
  clearCache(): void {
    this.recentActivities.set([]);
    this.statistics.set(null);
    this.activitiesSubject.next([]);
    this.statisticsSubject.next(null);
  }
}
