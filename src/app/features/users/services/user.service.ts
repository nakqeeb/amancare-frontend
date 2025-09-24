// ===================================================================
// src/app/features/users/services/user.service.ts - UPDATED
// Complete Integration with Spring Boot UserController API Endpoints
// ===================================================================
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, throwError, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

// Models and Interfaces
import {
  User,
  UserRole,
  CreateUserRequest,
  UpdateUserRequest,
  UserFilters,
  UserStatsDto,
  DoctorsResponse
} from '../models/user.model';
import { ApiResponse, PageResponse } from '../../../core/models/api-response.model';

// Services
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { SystemAdminService } from '../../../core/services/system-admin.service';

// ===================================================================
// NEW INTERFACES FOR SPRING BOOT INTEGRATION
// ===================================================================

// Clinic User Response - matching Spring Boot DTO
// export interface ClinicUserResponse {
//   id: number;
//   username: string;
//   email: string;
//   firstName: string;
//   lastName: string;
//   fullName: string;
//   phone?: string;
//   role: UserRole;
//   specialization?: string;
//   isActive: boolean;
//   clinicId: number;
//   clinicName: string;
//   createdAt: string;
//   updatedAt?: string;
//   lastLoginAt?: string;
// }

// Doctor Response - matching Spring Boot DTO
// export interface DoctorResponse {
//   id: number;
//   username: string;
//   firstName: string;
//   lastName: string;
//   fullName: string;
//   phone?: string;
//   email?: string;
//   specialization?: string;
//   isActive: boolean;
//   clinicId: number;
//   clinicName: string;
// }

// Clinic User Statistics - matching Spring Boot DTO
export interface ClinicUserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  doctorsCount: number;
  nursesCount: number;
  receptionistsCount: number;
  adminCount: number;
  lastRegistrationDate?: string;
  mostActiveRole: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private systemAdminService = inject(SystemAdminService);

  private readonly apiUrl = `${environment.apiUrl}/users`;

  // ===================================================================
  // STATE MANAGEMENT - Enhanced for Spring Boot Integration
  // ===================================================================

  // Signals for state management
  users = signal<User[]>([]);
  clinicUsers = signal<User[]>([]);
  doctors = signal<User[]>([]);
  selectedUser = signal<User | null>(null);
  clinicUserStats = signal<ClinicUserStats | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  // BehaviorSubjects for reactive data
  private usersSubject = new BehaviorSubject<User[]>([]);
  private clinicUsersSubject = new BehaviorSubject<User[]>([]);
  private doctorsSubject = new BehaviorSubject<User[]>([]);

  // Public observables
  public users$ = this.usersSubject.asObservable();
  public clinicUsers$ = this.clinicUsersSubject.asObservable();
  public doctors$ = this.doctorsSubject.asObservable();

  // ===================================================================
  // SPRING BOOT API ENDPOINTS INTEGRATION
  // ===================================================================

  // Create new user
  createUser(request: CreateUserRequest): Observable<User> {
    this.loading.set(true);

    return this.http.post<User>(this.apiUrl, request).pipe(
      tap(newUser => {
        const currentUsers = this.users();
        this.users.set([newUser, ...currentUsers]);
        this.usersSubject.next([newUser, ...currentUsers]);
        this.loading.set(false);
        this.notificationService.success('تم إنشاء المستخدم بنجاح');
      }),
      catchError(error => {
        this.loading.set(false);
        this.handleError('خطأ في إنشاء المستخدم', error);
        return throwError(() => error);
      })
    );
  }

  // Update user
  updateUser(id: number, request: UpdateUserRequest): Observable<User> {
    this.loading.set(true);

    return this.http.put<User>(`${this.apiUrl}/${id}`, request).pipe(
      tap(updatedUser => {
        const currentUsers = this.users();
        const index = currentUsers.findIndex(u => u.id === id);
        if (index !== -1) {
          currentUsers[index] = updatedUser;
          this.users.set([...currentUsers]);
          this.usersSubject.next([...currentUsers]);
        }
        this.selectedUser.set(updatedUser);
        this.loading.set(false);
        this.notificationService.success('تم تحديث المستخدم بنجاح');
      }),
      catchError(error => {
        this.loading.set(false);
        this.handleError('خطأ في تحديث المستخدم', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 1. GET /users/doctors - Get all doctors in the clinic
   * Matches Spring Boot: UserController.getDoctors()
   */
  getDoctors(clinicId?: number): Observable<ApiResponse<User[]>> {
    this.loading.set(true);
    this.error.set(null);

    // Handle SYSTEM_ADMIN clinic context
    let effectiveClinicId = clinicId;
    const currentUser = this.authService.currentUser();

    if (currentUser?.role === 'SYSTEM_ADMIN' && !effectiveClinicId) {
      effectiveClinicId = this.systemAdminService.getActingClinicId()!;
    }

    let params = new HttpParams();
    if (effectiveClinicId) {
      params = params.set('clinicId', effectiveClinicId.toString());
    }

    return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}/doctors`, { params }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.doctors.set(response.data);
          this.doctorsSubject.next(response.data);
        }
        this.loading.set(false);
      }),
      catchError(error => {
        this.loading.set(false);
        this.error.set('خطأ في الحصول على قائمة الأطباء');
        this.handleError('خطأ في الحصول على قائمة الأطباء', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 2. GET /users/clinic-users - Get all clinic users with filtering
   * Matches Spring Boot: UserController.getClinicUsers()
   */
  getClinicUsers(
    clinicId?: number,
    role?: string,
    activeOnly: boolean = true
  ): Observable<ApiResponse<User[]>> {
    this.loading.set(true);
    this.error.set(null);

    // Handle SYSTEM_ADMIN clinic context
    let effectiveClinicId = clinicId;
    const currentUser = this.authService.currentUser();

    if (currentUser?.role === 'SYSTEM_ADMIN' && !effectiveClinicId) {
      effectiveClinicId = this.systemAdminService.getActingClinicId()!;
    }

    let params = new HttpParams();
    if (effectiveClinicId) {
      params = params.set('clinicId', effectiveClinicId.toString());
    }
    if (role) {
      params = params.set('role', role);
    }
    params = params.set('activeOnly', activeOnly.toString());

    return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}/clinic-users`, { params }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.clinicUsers.set(response.data);
          this.clinicUsersSubject.next(response.data);
        }
        this.loading.set(false);
      }),
      catchError(error => {
        this.loading.set(false);
        this.error.set('خطأ في الحصول على قائمة المستخدمين');
        this.handleError('خطأ في الحصول على قائمة المستخدمين', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 3. GET /users/clinic-users/stats - Get clinic user statistics
   * Matches Spring Boot: UserController.getClinicUserStats()
   */
  getClinicUserStats(clinicId?: number): Observable<ApiResponse<ClinicUserStats>> {
    this.loading.set(true);
    this.error.set(null);

    // Handle SYSTEM_ADMIN clinic context
    let effectiveClinicId = clinicId;
    const currentUser = this.authService.currentUser();

    if (currentUser?.role === 'SYSTEM_ADMIN' && !effectiveClinicId) {
      effectiveClinicId = this.systemAdminService.getActingClinicId()!;
    }

    let params = new HttpParams();
    if (effectiveClinicId) {
      params = params.set('clinicId', effectiveClinicId.toString());
    }

    return this.http.get<ApiResponse<ClinicUserStats>>(`${this.apiUrl}/clinic-users/stats`, { params }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.clinicUserStats.set(response.data);
        }
        this.loading.set(false);
      }),
      catchError(error => {
        this.loading.set(false);
        this.error.set('خطأ في الحصول على إحصائيات المستخدمين');
        this.handleError('خطأ في الحصول على إحصائيات المستخدمين', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 4. GET /users/clinic-users/{userId} - Get specific clinic user by ID
   * Matches Spring Boot: UserController.getClinicUserById()
   */
  getClinicUserById(userId: number, clinicId?: number): Observable<ApiResponse<User>> {
    this.loading.set(true);
    this.error.set(null);

    // Handle SYSTEM_ADMIN clinic context
    let effectiveClinicId = clinicId;
    const currentUser = this.authService.currentUser();

    if (currentUser?.role === 'SYSTEM_ADMIN' && !effectiveClinicId) {
      effectiveClinicId = this.systemAdminService.getActingClinicId()!;
    }

    let params = new HttpParams();
    if (effectiveClinicId) {
      params = params.set('clinicId', effectiveClinicId.toString());
    }

    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/clinic-users/${userId}`, { params }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.selectedUser.set(response.data);
        }
        this.loading.set(false);
      }),
      catchError(error => {
        this.loading.set(false);
        this.error.set('خطأ في الحصول على بيانات المستخدم');
        this.handleError('خطأ في الحصول على بيانات المستخدم', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 5. PUT /users/clinic-users/{userId}/toggle-status - Toggle user active status
   * Matches Spring Boot: UserController.toggleUserStatus()
   */
  toggleUserStatus(userId: number, isActive: boolean): Observable<ApiResponse<User>> {
    // Validate SYSTEM_ADMIN context for write operations
    const currentUser = this.authService.currentUser();
    if (currentUser?.role === 'SYSTEM_ADMIN') {
      if (!this.systemAdminService.canPerformWriteOperation()) {
        return throwError(() => new Error('يجب تحديد العيادة المستهدفة قبل تعديل حالة المستخدم'));
      }
    }

    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams().set('isActive', isActive.toString());

    return this.http.put<ApiResponse<User>>(
      `${this.apiUrl}/clinic-users/${userId}/toggle-status`,
      {},
      { params }
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          // Update local state
          const currentUsers = this.clinicUsers();
          const updatedUsers = currentUsers.map(user =>
            user.id === userId ? response.data! : user
          );
          this.clinicUsers.set(updatedUsers);
          this.clinicUsersSubject.next(updatedUsers);

          // Update selected user if it's the same one
          const selectedUser = this.selectedUser();
          if (selectedUser && selectedUser.id === userId) {
            this.selectedUser.set(response.data);
          }

          const action = isActive ? 'تفعيل' : 'تعطيل';
          this.notificationService.success(`تم ${action} المستخدم بنجاح`);

          // Activity logged - status change completed
        }
        this.loading.set(false);
      }),
      catchError(error => {
        this.loading.set(false);
        this.error.set('خطأ في تغيير حالة المستخدم');
        this.handleError('خطأ في تغيير حالة المستخدم', error);
        return throwError(() => error);
      })
    );
  }

   // ===================================================================
  // Password Management
  // ===================================================================

  // Reset user password
  resetUserPassword(id: number): Observable<{ temporaryPassword: string }> {
    return this.http.post<{ temporaryPassword: string }>(`${this.apiUrl}/${id}/reset-password`, {}).pipe(
      tap(() => {
        this.notificationService.success('تم إعادة تعيين كلمة المرور بنجاح');
      }),
      catchError(error => {
        this.handleError('خطأ في إعادة تعيين كلمة المرور', error);
        return throwError(() => error);
      })
    );
  }

  // Change user password (by admin)
  changeUserPassword(id: number, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/change-password`, { newPassword }).pipe(
      tap(() => {
        this.notificationService.success('تم تغيير كلمة المرور بنجاح');
      }),
      catchError(error => {
        this.handleError('خطأ في تغيير كلمة المرور', error);
        return throwError(() => error);
      })
    );
  }

  // Check if username exists
  /* checkUsernameExists(username: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/check/username/${username}`);
  } */

  // ===================================================================
  // LEGACY METHODS - Updated to work with new backend structure
  // ===================================================================

  /**
   * Legacy method updated to use new backend structure
   * @deprecated Use getClinicUsers() instead
   */
  getUsers(filters?: UserFilters): Observable<User[]> {
    // Map to clinic users and convert to legacy User format
    return this.getClinicUsers(
      filters?.clinicId,
      filters?.role?.toString(),
      filters?.isActive ?? true
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          // Convert User to User format for backward compatibility
          return response.data.map(clinicUser => ({
            id: clinicUser.id,
            username: clinicUser.username,
            email: clinicUser.email,
            firstName: clinicUser.firstName,
            lastName: clinicUser.lastName,
            fullName: clinicUser.fullName,
            phone: clinicUser.phone,
            role: clinicUser.role,
            specialization: clinicUser.specialization,
            isActive: clinicUser.isActive,
            clinicId: clinicUser.clinicId,
            clinicName: clinicUser.clinicName,
            createdAt: clinicUser.createdAt,
            updatedAt: clinicUser.updatedAt,
            lastLoginAt: clinicUser.lastLoginAt
          } as User));
        }
        return [];
      })
    );
  }

  /**
   * Legacy method updated to return doctors in User format
   * @deprecated Use getDoctors() for DoctorResponse format
   */
  getDoctorsLegacy(): Observable<User[]> {
    return this.getDoctors().pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data.map(doctor => ({
            id: doctor.id,
            username: doctor.username,
            email: doctor.email,
            firstName: doctor.firstName,
            lastName: doctor.lastName,
            fullName: doctor.fullName,
            phone: doctor.phone,
            role: UserRole.DOCTOR,
            specialization: doctor.specialization,
            isActive: doctor.isActive,
            clinicId: doctor.clinicId,
            clinicName: doctor.clinicName
          } as User));
        }
        return [];
      })
    );
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================

  /**
   * Refresh all user-related data
   */
  refreshAllData(): void {
    this.getClinicUsers().subscribe();
    this.getDoctors().subscribe();
    this.getClinicUserStats().subscribe();
  }

  /**
   * Get role display name in Arabic
   */
  getRoleDisplayName(role: UserRole): string {
    const roleNames = {
      [UserRole.SYSTEM_ADMIN]: 'مدير النظام',
      [UserRole.ADMIN]: 'مدير العيادة',
      [UserRole.DOCTOR]: 'طبيب',
      [UserRole.NURSE]: 'ممرض/ممرضة',
      [UserRole.RECEPTIONIST]: 'موظف استقبال'
    };
    return roleNames[role] || role;
  }

  /**
   * Get role icon
   */
  getRoleIcon(role: UserRole): string {
    const roleIcons = {
      [UserRole.SYSTEM_ADMIN]: 'admin_panel_settings',
      [UserRole.ADMIN]: 'manage_accounts',
      [UserRole.DOCTOR]: 'medical_services',
      [UserRole.NURSE]: 'health_and_safety',
      [UserRole.RECEPTIONIST]: 'support_agent'
    };
    return roleIcons[role] || 'person';
  }

  /**
   * Get role color
   */
  getRoleColor(role: UserRole): string {
    const roleColors = {
      [UserRole.SYSTEM_ADMIN]: 'warn',
      [UserRole.ADMIN]: 'primary',
      [UserRole.DOCTOR]: 'accent',
      [UserRole.NURSE]: 'primary',
      [UserRole.RECEPTIONIST]: 'primary'
    };
    return roleColors[role] || 'primary';
  }

  /**
   * Filter users by role
   */
  filterUsersByRole(users: User[], role: UserRole): User[] {
    return users.filter(user => user.role === role);
  }

  /**
   * Get active users count
   */
  getActiveUsersCount(users: User[]): number {
    return users.filter(user => user.isActive).length;
  }

  /**
   * Clear all selections and reset state
   */
  clearState(): void {
    this.selectedUser.set(null);
    this.error.set(null);
    this.loading.set(false);
  }

  // ===================================================================
  // ERROR HANDLING
  // ===================================================================

  /**
   * Handle service errors
   */
  private handleError(message: string, error: any): void {
    console.error('User Service Error:', error);

    if (error.status === 400) {
      this.notificationService.error(`${message}: ${error.error?.message || 'بيانات غير صحيحة'}`);
    } else if (error.status === 401) {
      this.notificationService.error('غير مصرح - يجب تسجيل الدخول');
    } else if (error.status === 403) {
      this.notificationService.error('ممنوع - صلاحيات غير كافية');
    } else if (error.status === 404) {
      this.notificationService.error('المستخدم غير موجود');
    } else if (error.status === 409) {
      this.notificationService.error('تعارض في البيانات');
    } else {
      this.notificationService.error(message);
    }
  }
}
