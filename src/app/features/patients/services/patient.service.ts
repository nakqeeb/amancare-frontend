// ===================================================================
// src/app/features/patients/services/patient.service.ts - Updated
// Fully Integrated with Spring Boot Patient API Endpoints
// ===================================================================
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { tap, catchError, map, finalize } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { NotificationService } from '../../../core/services/notification.service';
import { ApiResponse, PageResponse } from '../../../core/models/api-response.model';
import { UserRole } from '../../users/models/user.model';
import { AuthService } from '../../../core/services/auth.service';

// ===================================================================
// INTERFACES & MODELS - Matching Spring Boot DTOs
// ===================================================================

export interface Patient {
  id: number;
  patientNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
  age?: number;
  gender: Gender;
  phone: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodType?: BloodType;
  allergies?: string;
  chronicDiseases?: string;
  notes?: string;
  isActive: boolean;
  clinicId: number;
  appointmentsCount?: number;
  lastVisit?: string;
  totalInvoices?: number;
  outstandingBalance?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodType?: BloodType;
  allergies?: string;
  chronicDiseases?: string;
  notes?: string;
}

export interface UpdatePatientRequest {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: Gender;
  phone?: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodType?: BloodType;
  allergies?: string;
  chronicDiseases?: string;
  notes?: string;
}

export interface PatientSearchCriteria {
  searchTerm?: string;
  gender?: Gender;
  bloodType?: BloodType;
  ageFrom?: number;
  ageTo?: number;
  isActive?: boolean;
  city?: string;
  lastVisitFrom?: string;
  lastVisitTo?: string;
}

export interface PatientStatistics {
  totalPatients: number;
  activePatients: number;
  inactivePatients: number;
  newPatientsThisMonth: number;
  malePatients: number;
  femalePatients: number;
  averageAge: number;
  patientsWithAppointmentsToday: number;
  patientsWithPendingInvoices: number;
  totalOutstandingBalance: number;
}

export interface PatientSummaryResponse {
  id: number;
  patientNumber: string;
  fullName: string;
  phone: string;
  appointmentTime?: string;
  appointmentType?: string;
  doctorName?: string;
  status?: string;
}

export interface PatientPageResponse extends PageResponse<Patient> {
  // Additional fields specific to patient pagination if needed
  patients: Patient[]
}

// Permanent Delete Response Interface
export interface PermanentDeleteResponse {
  patientId: number;
  patientNumber: string;
  patientName: string;
  deletedAt: string;
  deletedByUserId: number;
  recordsDeleted: {
    appointments: number;
    medicalRecords: number;
    invoices: number;
  };
  confirmationMessage: string;
}

// Deletion Preview Interface
export interface DeletionPreview {
  canDelete: boolean;
  blockers?: string[];
  dataToDelete?: {
    appointments: number;
    medicalRecords: number;
    invoices: number;
    documents: number;
  };
}

export type Gender = 'MALE' | 'FEMALE';

export type BloodType =
  'A_POSITIVE' | 'A_NEGATIVE' |
  'B_POSITIVE' | 'B_NEGATIVE' |
  'AB_POSITIVE' | 'AB_NEGATIVE' |
  'O_POSITIVE' | 'O_NEGATIVE';

// ===================================================================
// PATIENT SERVICE
// ===================================================================

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/patients`;

  // ===================================================================
  // STATE MANAGEMENT
  // ===================================================================

  // Signals for reactive state management
  patients = signal<Patient[]>([]);
  selectedPatient = signal<Patient | null>(null);
  loading = signal(false);
  statistics = signal<PatientStatistics | null>(null);
  todayPatients = signal<PatientSummaryResponse[]>([]);

  // BehaviorSubject for compatibility with existing code
  private patientsSubject = new BehaviorSubject<Patient[]>([]);
  public patients$ = this.patientsSubject.asObservable();

  // ===================================================================
  // CRUD OPERATIONS - Matching Spring Boot Endpoints
  // ===================================================================

  /**
   * 1. GET /patients - Get all patients with pagination and sorting
   */
  getAllPatients(
    page: number = 0,
    size: number = 10,
    sortBy: string = 'firstName',
    sortDirection: string = 'asc'
  ): Observable<ApiResponse<PatientPageResponse>> {
    this.loading.set(true);

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);

    return this.http.get<ApiResponse<PatientPageResponse>>(`${this.apiUrl}`, { params }).pipe(
      tap(response => {
        if (response.success) {
          this.patients.set(response.data!.patients);
          this.patientsSubject.next(response.data!.content);
        }
        this.loading.set(false);
      }),
      catchError(error => {
        this.loading.set(false);
        this.handleError('خطأ في الحصول على قائمة المرضى', error);
        return throwError(() => error);
      }),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * 2. GET /patients/search - Search patients
   */
  searchPatients(
    criteria: PatientSearchCriteria,
    page: number = 0,
    size: number = 10
  ): Observable<ApiResponse<PatientPageResponse>> {
    this.loading.set(true);

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    // Add search criteria to params
    if (criteria.searchTerm) {
      params = params.set('q', criteria.searchTerm);
    }

    return this.http.get<ApiResponse<PatientPageResponse>>(`${this.apiUrl}/search`, { params }).pipe(
      tap(response => {
        if (response.success) {
          this.patients.set(response.data!.patients);
          this.patientsSubject.next(response.data!.patients);
        }
        this.loading.set(false);
      }),
      catchError(error => {
        this.loading.set(false);
        this.handleError('خطأ في البحث عن المرضى', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 3. GET /patients/{id} - Get patient by ID
   */
  getPatientById(id: number): Observable<ApiResponse<Patient>> {
    this.loading.set(true);

    return this.http.get<ApiResponse<Patient>>(`${this.apiUrl}/${id}`).pipe(
      tap(response => {
        if (response.success) {
          this.selectedPatient.set(response.data!);
        }
        this.loading.set(false);
      }),
      catchError(error => {
        this.loading.set(false);
        this.handleError('خطأ في الحصول على بيانات المريض', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 4. GET /patients/number/{patientNumber} - Get patient by patient number
   */
  getPatientByNumber(patientNumber: string): Observable<ApiResponse<Patient>> {
    this.loading.set(true);

    return this.http.get<ApiResponse<Patient>>(`${this.apiUrl}/number/${patientNumber}`).pipe(
      tap(response => {
        if (response.success) {
          this.selectedPatient.set(response.data!);
        }
        this.loading.set(false);
      }),
      catchError(error => {
        this.loading.set(false);
        this.handleError('خطأ في البحث عن المريض برقم المريض', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 5. POST /patients - Create new patient
   */
  createPatient(request: CreatePatientRequest): Observable<ApiResponse<Patient>> {
    this.loading.set(true);

    return this.http.post<ApiResponse<Patient>>(`${this.apiUrl}`, request).pipe(
      tap(response => {
        if (response.success) {
          // Update local state
          const currentPatients = this.patients();
          this.patients.set([response.data!, ...currentPatients]);
          this.patientsSubject.next([response.data!, ...currentPatients]);

          this.selectedPatient.set(response.data!);
          this.notificationService.success('تم إنشاء المريض بنجاح');
        }
        this.loading.set(false);
      }),
      catchError(error => {
        this.loading.set(false);
        this.handleError('خطأ في إنشاء المريض', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 6. PUT /patients/{id} - Update patient
   */
  updatePatient(id: number, request: UpdatePatientRequest): Observable<ApiResponse<Patient>> {
    this.loading.set(true);

    return this.http.put<ApiResponse<Patient>>(`${this.apiUrl}/${id}`, request).pipe(
      tap(response => {
        if (response.success) {
          // Update local state
          const currentPatients = this.patients();
          const index = currentPatients.findIndex(p => p.id === id);
          if (index !== -1) {
            currentPatients[index] = response.data!;
            this.patients.set([...currentPatients]);
            this.patientsSubject.next([...currentPatients]);
          }

          this.selectedPatient.set(response.data!);
          this.notificationService.success('تم تحديث بيانات المريض بنجاح');
        }
        this.loading.set(false);
      }),
      catchError(error => {
        this.loading.set(false);
        this.handleError('خطأ في تحديث بيانات المريض', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 7. DELETE /patients/{id} - Delete patient (soft delete)
   */
  deletePatient(id: number): Observable<ApiResponse<void>> {
    this.loading.set(true);

    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      tap(response => {
        if (response.success) {
          // Remove from local state
          const currentPatients = this.patients().filter(p => p.id !== id);
          this.patients.set(currentPatients);
          this.patientsSubject.next(currentPatients);

          this.notificationService.success('تم حذف المريض بنجاح');
        }
        this.loading.set(false);
      }),
      catchError(error => {
        this.loading.set(false);
        this.handleError('خطأ في حذف المريض', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 8. POST /patients/{id}/reactivate - Reactivate patient
   */
  reactivatePatient(id: number): Observable<ApiResponse<Patient>> {
    this.loading.set(true);

    return this.http.post<ApiResponse<Patient>>(`${this.apiUrl}/${id}/reactivate`, {}).pipe(
      tap(response => {
        if (response.success) {
          // Update local state
          const currentPatients = this.patients();
          const index = currentPatients.findIndex(p => p.id === id);
          if (index !== -1) {
            currentPatients[index] = response.data!;
          } else {
            currentPatients.unshift(response.data!);
          }
          this.patients.set([...currentPatients]);
          this.patientsSubject.next([...currentPatients]);

          this.selectedPatient.set(response.data!);
          this.notificationService.success('تم إعادة تفعيل المريض بنجاح');
        }
        this.loading.set(false);
      }),
      catchError(error => {
        this.loading.set(false);
        this.handleError('خطأ في إعادة تفعيل المريض', error);
        return throwError(() => error);
      })
    );
  }

  /**
  * PERMANENTLY DELETE PATIENT (SYSTEM_ADMIN ONLY)
  * WARNING: This action cannot be undone
  */
  permanentlyDeletePatient(
    id: number,
    confirmationCode: string
  ): Observable<ApiResponse<PermanentDeleteResponse>> {
    this.loading.set(true);

    // Add confirmation code as query parameter
    const params = new HttpParams().set('confirmationCode', confirmationCode);

    return this.http.delete<ApiResponse<PermanentDeleteResponse>>(
      `${this.apiUrl}/${id}/permanent`,
      { params }
    ).pipe(
      tap(response => {
        if (response.success) {
          // Remove from local state completely
          const currentPatients = this.patients().filter(p => p.id !== id);
          this.patients.set(currentPatients);
          this.patientsSubject.next(currentPatients);

          // Clear selected patient if it was the deleted one
          if (this.selectedPatient()?.id === id) {
            this.selectedPatient.set(null);
          }

          // Log this critical action
          console.warn('PERMANENT DELETE: Patient permanently deleted', {
            patientId: id,
            response: response.data
          });

          // Show detailed notification
          const data = response.data!;
          const message = `تم حذف المريض "${data.patientName}" نهائياً.
            تم حذف ${data.recordsDeleted.appointments} موعد،
            ${data.recordsDeleted.medicalRecords} سجل طبي،
            ${data.recordsDeleted.invoices} فاتورة.`;

          this.notificationService.warning(message);
        }
        this.loading.set(false);
      }),
      catchError(error => {
        this.loading.set(false);

        // Handle specific error cases
        if (error.status === 409) {
          this.notificationService.error(
            error.error?.message || 'لا يمكن حذف المريض - يحتوي على بيانات مرتبطة نشطة',
          );
        } else if (error.status === 403) {
          this.notificationService.error('غير مصرح - هذا الإجراء مخصص لمدير النظام فقط');
        } else if (error.status === 400) {
          this.notificationService.error(error.error?.message || 'رمز التأكيد غير صحيح');
        } else {
          this.handleError('خطأ في حذف المريض نهائياً', error);
        }

        return throwError(() => error);
      })
    );
  }

  /**
   * Get deletion preview for a patient
   * Shows what will be deleted and any blockers
   */
  getPatientDeletionPreview(id: number): Observable<ApiResponse<DeletionPreview>> {
    // Mock implementation - replace with actual API call when available
    return of({
      success: true,
      message: 'Deletion preview loaded',
      data: {
        canDelete: true,
        blockers: [],
        dataToDelete: {
          appointments: Math.floor(Math.random() * 10),
          medicalRecords: Math.floor(Math.random() * 20),
          invoices: Math.floor(Math.random() * 5),
          documents: Math.floor(Math.random() * 15)
        }
      },
    }).pipe(
      tap((response: any) => {
        console.log('Deletion preview:', response.data);
      }),
      catchError(error => {
        console.error('Error getting deletion preview:', error);
        // Return a default response on error
        return of({
          success: true,
          message: 'Preview unavailable',
          data: {
            canDelete: true,
            blockers: [],
            dataToDelete: undefined
          }
        });
      })
    );
  }

  /**
   * Check if current user can permanently delete patients
   */
  canPermanentlyDeletePatient(): boolean {
    const currentUser = this.authService.currentUser();
    return currentUser?.role === UserRole.SYSTEM_ADMIN;
  }

  /**
   * 9. GET /patients/statistics - Get patient statistics
   */
  getPatientStatistics(): Observable<ApiResponse<PatientStatistics>> {
    this.loading.set(true);

    return this.http.get<ApiResponse<PatientStatistics>>(`${this.apiUrl}/statistics`).pipe(
      tap(response => {
        if (response.success) {
          this.statistics.set(response.data!);
        }
        this.loading.set(false);
      }),
      catchError(error => {
        this.loading.set(false);
        this.handleError('خطأ في الحصول على إحصائيات المرضى', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 10. GET /patients/today - Get today's patients
   */
  getTodayPatients(): Observable<ApiResponse<PatientSummaryResponse[]>> {
    this.loading.set(true);

    return this.http.get<ApiResponse<PatientSummaryResponse[]>>(`${this.apiUrl}/today`).pipe(
      tap(response => {
        if (response.success) {
          this.todayPatients.set(response.data!);
        }
        this.loading.set(false);
      }),
      catchError(error => {
        this.loading.set(false);
        this.handleError('خطأ في الحصول على مرضى اليوم', error);
        return throwError(() => error);
      })
    );
  }

  // ===================================================================
  // HELPER METHODS
  // ===================================================================

  /**
   * Get blood types for dropdowns
   */
  getBloodTypes(): { value: BloodType; label: string }[] {
    return [
      { value: 'A_POSITIVE', label: 'A+' },
      { value: 'A_NEGATIVE', label: 'A-' },
      { value: 'B_POSITIVE', label: 'B+' },
      { value: 'B_NEGATIVE', label: 'B-' },
      { value: 'AB_POSITIVE', label: 'AB+' },
      { value: 'AB_NEGATIVE', label: 'AB-' },
      { value: 'O_POSITIVE', label: 'O+' },
      { value: 'O_NEGATIVE', label: 'O-' }
    ];
  }

  /**
   * Get genders for dropdowns
   */
  getGenders(): { value: Gender; label: string }[] {
    return [
      { value: 'MALE', label: 'ذكر' },
      { value: 'FEMALE', label: 'أنثى' }
    ];
  }

  /**
   * Format blood type for display
   */
  formatBloodType(bloodType: BloodType): string {
    const types = this.getBloodTypes();
    return types.find(t => t.value === bloodType)?.label || bloodType;
  }

  /**
   * Format gender for display
   */
  formatGender(gender: Gender): string {
    const genders = this.getGenders();
    return genders.find(g => g.value === gender)?.label || gender;
  }

  /**
   * Calculate age from date of birth
   */
  calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Clear selected patient
   */
  clearSelectedPatient(): void {
    this.selectedPatient.set(null);
  }

  /**
   * Reset service state
   */
  reset(): void {
    this.patients.set([]);
    this.selectedPatient.set(null);
    this.statistics.set(null);
    this.todayPatients.set([]);
    this.loading.set(false);
    this.patientsSubject.next([]);
  }

  // ===================================================================
  // ERROR HANDLING
  // ===================================================================

  private handleError(message: string, error: HttpErrorResponse): void {
    console.error(`${message}:`, error);

    let errorMessage = message;

    if (error.error?.message) {
      errorMessage = `${message}: ${error.error.message}`;
    } else if (error.status === 0) {
      errorMessage = `${message}: خطأ في الاتصال بالخادم`;
    } else if (error.status === 401) {
      errorMessage = `${message}: غير مصرح - يرجى تسجيل الدخول مرة أخرى`;
    } else if (error.status === 403) {
      errorMessage = `${message}: ممنوع - ليس لديك صلاحية للوصول`;
    } else if (error.status === 404) {
      errorMessage = `${message}: المريض غير موجود`;
    } else if (error.status >= 500) {
      errorMessage = `${message}: خطأ في الخادم`;
    }

    this.notificationService.error(errorMessage);
  }
}
