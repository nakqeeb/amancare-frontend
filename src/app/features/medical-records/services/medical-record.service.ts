// ===================================================================
// src/app/features/medical-records/services/medical-record.service.ts
// Complete Medical Record Service with All API Endpoints
// ===================================================================

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError, map, finalize } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { NotificationService } from '../../../core/services/notification.service';
import { SystemAdminService } from '../../../core/services/system-admin.service';
import { ApiResponse, PageResponse } from '../../../core/models/api-response.model';

import {
  MedicalRecord,
  MedicalRecordSummary,
  CreateMedicalRecordRequest,
  UpdateMedicalRecordRequest,
  UpdateRecordStatusRequest,
  MedicalRecordSearchCriteria,
  MedicalRecordStatistics,
  MedicalRecordPageResponse,
  RecordStatus,
  GroupedRecords
} from '../models/medical-record.model';
import { AuthService } from '../../../core/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class MedicalRecordService {
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);
  private systemAdminService = inject(SystemAdminService);
  private authService = inject(AuthService);

  private readonly apiUrl = `${environment.apiUrl}/medical-records`;

  // ===================================================================
  // STATE MANAGEMENT
  // ===================================================================

  // Signals for reactive state
  medicalRecords = signal<MedicalRecordSummary[]>([]);
  selectedRecord = signal<MedicalRecord | null>(null);
  loading = signal(false);
  statistics = signal<MedicalRecordStatistics | null>(null);
  searchCriteria = signal<MedicalRecordSearchCriteria | null>(null);
  patientHistory = signal<MedicalRecordSummary[]>([]);
  doctorRecords = signal<MedicalRecordSummary[]>([]);

  // BehaviorSubjects for observables
  private medicalRecordsSubject = new BehaviorSubject<MedicalRecordSummary[]>([]);
  public medicalRecords$ = this.medicalRecordsSubject.asObservable();

  private statisticsSubject = new BehaviorSubject<MedicalRecordStatistics | null>(null);
  public statistics$ = this.statisticsSubject.asObservable();

  // ===================================================================
  // CREATE OPERATIONS
  // ===================================================================

  /**
   * 1. Create new medical record
   * POST /medical-records
   */
  createMedicalRecord(request: CreateMedicalRecordRequest): Observable<MedicalRecord> {
    this.loading.set(true);

    // Add SYSTEM_ADMIN headers if needed
    // const headers = this.systemAdminService.getSystemAdminHeaders();
    // Validate SYSTEM_ADMIN context for write operations
    const currentUser = this.authService.currentUser();
    if (currentUser?.role === 'SYSTEM_ADMIN') {
      if (!this.systemAdminService.canPerformWriteOperation()) {
        return throwError(() => new Error('يجب تحديد العيادة المستهدفة قبل إنشاء سجل طبي جديد'));
      }

      // Add clinic ID from context if not provided
      const actingClinicId = this.systemAdminService.getActingClinicId();
      if (actingClinicId && !request.clinicId) {
        request.clinicId = actingClinicId;
      }
    }

    return this.http.post<ApiResponse<MedicalRecord>>(
      this.apiUrl,
      request,
      /* { headers } */
    ).pipe(
      map(response => {
        if (response.success) {
          this.notificationService.success(response.message);
          // Refresh the list
          this.refreshMedicalRecords();
          return response.data!;
        }
        throw new Error(response.message);
      }),
      catchError(this.handleError.bind(this)),
      finalize(() => this.loading.set(false))
    );
  }

  // ===================================================================
  // READ OPERATIONS
  // ===================================================================

  /**
   * 2. Get all medical records with pagination
   * GET /medical-records
   */
  getAllMedicalRecords(
    page = 0,
    size = 10,
    sortBy = 'visitDate',
    sortDirection = 'DESC'
  ): Observable<MedicalRecordPageResponse> {
    this.loading.set(true);

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);

    return this.http.get<ApiResponse<PageResponse<MedicalRecordSummary>>>(
      this.apiUrl,
      { params }
    ).pipe(
      map(response => {
        if (response.success) {
          const records = response.data!.content || [];
          this.medicalRecords.set(records);
          this.medicalRecordsSubject.next(records);
          return response.data as MedicalRecordPageResponse;
        }
        throw new Error(response.message);
      }),
      catchError(this.handleError.bind(this)),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * 3. Get medical record by ID
   * GET /medical-records/{id}
   */
  getMedicalRecordById(id: number, clinicId?: number): Observable<MedicalRecord> {
    this.loading.set(true);

    let params = new HttpParams();
    if (clinicId) {
      params = params.set('clinicId', clinicId.toString());
    }

    return this.http.get<ApiResponse<MedicalRecord>>(
      `${this.apiUrl}/${id}`,
      { params }
    ).pipe(
      map(response => {
        if (response.success) {
          this.selectedRecord.set(response.data!);
          return response.data!;
        }
        throw new Error(response.message);
      }),
      catchError(this.handleError.bind(this)),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * 4. Search medical records with advanced criteria
   * GET /medical-records/search
   */
  searchMedicalRecords(
    criteria: MedicalRecordSearchCriteria,
    page = 0,
    size = 10,
    sortBy = 'visitDate',
    sortDirection = 'DESC'
  ): Observable<MedicalRecordPageResponse> {
    this.loading.set(true);
    this.searchCriteria.set(criteria);

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);

    // Add search criteria to params
    if (criteria.patientId) params = params.set('patientId', criteria.patientId.toString());
    if (criteria.doctorId) params = params.set('doctorId', criteria.doctorId.toString());
    if (criteria.visitType) params = params.set('visitType', criteria.visitType);
    if (criteria.status) params = params.set('status', criteria.status);
    if (criteria.visitDateFrom) params = params.set('visitDateFrom', criteria.visitDateFrom);
    if (criteria.visitDateTo) params = params.set('visitDateTo', criteria.visitDateTo);
    if (criteria.isConfidential !== undefined) params = params.set('isConfidential', criteria.isConfidential.toString());
    if (criteria.searchTerm) params = params.set('searchTerm', criteria.searchTerm);

    return this.http.get<ApiResponse<PageResponse<MedicalRecordSummary>>>(
      `${this.apiUrl}/search`,
      { params }
    ).pipe(
      map(response => {
        if (response.success) {
          const records = response.data!.content || [];
          this.medicalRecords.set(records);
          this.medicalRecordsSubject.next(records);
          return response.data as MedicalRecordPageResponse;
        }
        throw new Error(response.message);
      }),
      catchError(this.handleError.bind(this)),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * 5. Get patient medical history
   * GET /medical-records/patient/{patientId}
   */
  getPatientMedicalHistory(
    patientId: number,
    page = 0,
    size = 10
  ): Observable<MedicalRecordPageResponse> {
    this.loading.set(true);

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<PageResponse<MedicalRecordSummary>>>(
      `${this.apiUrl}/patient/${patientId}`,
      { params }
    ).pipe(
      map(response => {
        if (response.success) {
          const records = response.data!.content || [];
          this.patientHistory.set(records);
          return response.data as MedicalRecordPageResponse;
        }
        throw new Error(response.message);
      }),
      catchError(this.handleError.bind(this)),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * 6. Get doctor medical records
   * GET /medical-records/doctor/{doctorId}
   */
  getDoctorMedicalRecords(
    doctorId: number,
    page = 0,
    size = 10
  ): Observable<MedicalRecordPageResponse> {
    this.loading.set(true);

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<PageResponse<MedicalRecordSummary>>>(
      `${this.apiUrl}/doctor/${doctorId}`,
      { params }
    ).pipe(
      map(response => {
        if (response.success) {
          const records = response.data!.content || [];
          this.doctorRecords.set(records);
          return response.data as MedicalRecordPageResponse;
        }
        throw new Error(response.message);
      }),
      catchError(this.handleError.bind(this)),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * 7. Get medical record by appointment
   * GET /medical-records/appointment/{appointmentId}
   */
  getMedicalRecordByAppointment(appointmentId: number): Observable<MedicalRecord> {
    this.loading.set(true);

    return this.http.get<ApiResponse<MedicalRecord>>(
      `${this.apiUrl}/appointment/${appointmentId}`
    ).pipe(
      map(response => {
        if (response.success) {
          this.selectedRecord.set(response.data!);
          return response.data!;
        }
        throw new Error(response.message);
      }),
      catchError(this.handleError.bind(this)),
      finalize(() => this.loading.set(false))
    );
  }

  // ===================================================================
  // UPDATE OPERATIONS
  // ===================================================================

  /**
   * 8. Update medical record
   * PUT /medical-records/{id}
   */
  updateMedicalRecord(
    id: number,
    request: UpdateMedicalRecordRequest
  ): Observable<MedicalRecord> {
    this.loading.set(true);

    // const headers = this.systemAdminService.getSystemAdminHeaders();
    // Validate SYSTEM_ADMIN context for write operations
    const currentUser = this.authService.currentUser();
    if (currentUser?.role === 'SYSTEM_ADMIN') {
      if (!this.systemAdminService.canPerformWriteOperation()) {
        return throwError(() => new Error('يجب تحديد العيادة المستهدفة قبل تحديث السجل الطبي'));
      }

      // Add clinic ID from context if not provided
      const actingClinicId = this.systemAdminService.getActingClinicId();
      if (actingClinicId && !request.clinicId) {
        request.clinicId = actingClinicId;
      }
    }

    return this.http.put<ApiResponse<MedicalRecord>>(
      `${this.apiUrl}/${id}`,
      request,
      /* { headers } */
    ).pipe(
      map(response => {
        if (response.success) {
          this.notificationService.success(response.message);
          // Update selected record if it's the same
          if (this.selectedRecord()?.id === id) {
            this.selectedRecord.set(response.data!);
          }
          // Refresh list
          this.refreshMedicalRecords();
          return response.data!;
        }
        throw new Error(response.message);
      }),
      catchError(this.handleError.bind(this)),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * 9. Update record status
   * PUT /medical-records/{id}/status
   */
  updateRecordStatus(
    id: number,
    request: UpdateRecordStatusRequest
  ): Observable<MedicalRecord> {
    this.loading.set(true);

    // const headers = this.systemAdminService.getSystemAdminHeaders();
    // Validate SYSTEM_ADMIN context for write operations
    const currentUser = this.authService.currentUser();
    if (currentUser?.role === 'SYSTEM_ADMIN') {
      if (!this.systemAdminService.canPerformWriteOperation()) {
        return throwError(() => new Error('يجب تحديد العيادة المستهدفة قبل تحديث حالة السجل'));
      }

      // Add clinic ID from context if not provided
      const actingClinicId = this.systemAdminService.getActingClinicId();
      if (actingClinicId && !request.clinicId) {
        request.clinicId = actingClinicId;
      }
    }

    return this.http.put<ApiResponse<MedicalRecord>>(
      `${this.apiUrl}/${id}/status`,
      request,
      /* { headers } */
    ).pipe(
      map(response => {
        if (response.success) {
          this.notificationService.success(response.message);
          // Update selected record if it's the same
          if (this.selectedRecord()?.id === id) {
            this.selectedRecord.set(response.data!);
          }
          // Refresh list
          this.refreshMedicalRecords();
          return response.data!;
        }
        throw new Error(response.message);
      }),
      catchError(this.handleError.bind(this)),
      finalize(() => this.loading.set(false))
    );
  }

  // ===================================================================
  // DELETE OPERATIONS
  // ===================================================================

  /**
   * 10. Delete medical record (logical delete)
   * DELETE /medical-records/{id}
   */
  deleteMedicalRecord(id: number): Observable<void> {
    this.loading.set(true);

    // const headers = this.systemAdminService.getSystemAdminHeaders();

    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/${id}`,
      /* { headers } */
    ).pipe(
      map(response => {
        if (response.success) {
          this.notificationService.success(response.message);
          // Remove from local state
          const currentRecords = this.medicalRecords();
          this.medicalRecords.set(currentRecords.filter(r => r.id !== id));
          // Clear selected if it was deleted
          if (this.selectedRecord()?.id === id) {
            this.selectedRecord.set(null);
          }
          return;
        }
        throw new Error(response.message);
      }),
      catchError(this.handleError.bind(this)),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * 11. Permanently delete medical record (SYSTEM_ADMIN only)
   * DELETE /medical-records/{id}/permanent
   */
  permanentlyDeleteMedicalRecord(id: number): Observable<void> {
    this.loading.set(true);

    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/${id}/permanent`
    ).pipe(
      map(response => {
        if (response.success) {
          this.notificationService.success(response.message);
          // Remove from local state
          const currentRecords = this.medicalRecords();
          this.medicalRecords.set(currentRecords.filter(r => r.id !== id));
          // Clear selected if it was deleted
          if (this.selectedRecord()?.id === id) {
            this.selectedRecord.set(null);
          }
          return;
        }
        throw new Error(response.message);
      }),
      catchError(this.handleError.bind(this)),
      finalize(() => this.loading.set(false))
    );
  }

  // ===================================================================
  // STATISTICS & REPORTS
  // ===================================================================

  /**
   * 12. Get medical record statistics
   * GET /medical-records/statistics
   */
  getMedicalRecordStatistics(): Observable<MedicalRecordStatistics> {
    this.loading.set(true);

    return this.http.get<ApiResponse<MedicalRecordStatistics>>(
      `${this.apiUrl}/statistics`
    ).pipe(
      map(response => {
        if (response.success) {
          this.statistics.set(response.data!);
          this.statisticsSubject.next(response.data!);
          return response.data!;
        }
        throw new Error(response.message);
      }),
      catchError(this.handleError.bind(this)),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * 13. Export medical record as PDF
   * GET /medical-records/{id}/pdf
   */
  exportMedicalRecordAsPdf(id: number): Observable<Blob> {
    this.loading.set(true);

    return this.http.get(
      `${this.apiUrl}/${id}/pdf`,
      {
        responseType: 'blob',
        headers: new HttpHeaders({
          'Accept': 'application/pdf'
        })
      }
    ).pipe(
      tap(() => {
        this.notificationService.success('تم تحميل ملف PDF بنجاح');
      }),
      catchError(this.handleError.bind(this)),
      finalize(() => this.loading.set(false))
    );
  }

  // ===================================================================
  // HELPER METHODS
  // ===================================================================

  /**
   * Refresh medical records list
   */
  refreshMedicalRecords(): void {
    this.getAllMedicalRecords().subscribe();
  }

  /**
   * Clear selected record
   */
  clearSelectedRecord(): void {
    this.selectedRecord.set(null);
  }

  /**
   * Clear all state
   */
  clearState(): void {
    this.medicalRecords.set([]);
    this.selectedRecord.set(null);
    this.statistics.set(null);
    this.searchCriteria.set(null);
    this.patientHistory.set([]);
    this.doctorRecords.set([]);
  }

  /**
   * Group records by year and month for patient history view
   */
  groupRecordsByDate(records: MedicalRecordSummary[]): GroupedRecords[] {
    const grouped = new Map<number, Map<string, MedicalRecordSummary[]>>();

    records.forEach(record => {
      const date = new Date(record.visitDate);
      const year = date.getFullYear();
      const month = date.toLocaleDateString('ar-SA', { month: 'long' });

      if (!grouped.has(year)) {
        grouped.set(year, new Map());
      }

      const yearGroup = grouped.get(year)!;
      if (!yearGroup.has(month)) {
        yearGroup.set(month, []);
      }

      yearGroup.get(month)!.push(record);
    });

    const result: GroupedRecords[] = [];
    grouped.forEach((months, year) => {
      const monthGroups = Array.from(months.entries()).map(([month, recs]) => ({
        month,
        records: recs
      }));

      result.push({
        year,
        months: monthGroups
      });
    });

    return result.sort((a, b) => b.year - a.year);
  }

  /**
   * Download PDF helper
   */
  downloadPdf(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Check if user can modify record
   */
  canModifyRecord(record: MedicalRecord, userRole: string): boolean {
    if (record.status === RecordStatus.LOCKED) {
      return userRole === 'SYSTEM_ADMIN' || userRole === 'ADMIN';
    }
    return userRole === 'DOCTOR' || userRole === 'ADMIN' || userRole === 'SYSTEM_ADMIN';
  }

  /**
   * Check if user can view confidential records
   */
  canViewConfidential(userRole: string): boolean {
    return userRole === 'DOCTOR' || userRole === 'ADMIN' || userRole === 'SYSTEM_ADMIN';
  }

  // ===================================================================
  // ERROR HANDLING
  // ===================================================================

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'حدث خطأ غير متوقع';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `خطأ: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 0) {
        errorMessage = 'لا يمكن الاتصال بالخادم';
      } else if (error.status === 401) {
        errorMessage = 'غير مصرح - يجب تسجيل الدخول';
      } else if (error.status === 403) {
        errorMessage = 'ليست لديك الصلاحيات الكافية';
      } else if (error.status === 404) {
        errorMessage = 'السجل الطبي غير موجود';
      } else {
        errorMessage = `خطأ ${error.status}: ${error.statusText}`;
      }
    }

    this.notificationService.error(errorMessage);
    console.error('Medical Record Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
