// ===================================================================
// src/app/core/services/auth.service.ts - خدمة المصادقة المُحدثة
// متكاملة بالكامل مع Spring Boot Auth API Endpoints
// ===================================================================
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';
import { NotificationService } from './notification.service';

// ===================================================================
// INTERFACES & TYPES - متطابقة مع Spring Boot DTOs
// ===================================================================

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  specialization?: string;
  clinicId: number;
  clinicName: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type UserRole = 'SYSTEM_ADMIN' | 'ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST';

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

// Authentication DTOs
export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface JwtAuthenticationResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface ClinicRegistrationRequest {
  // بيانات العيادة
  clinicName: string;
  clinicDescription?: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicEmail: string;

  // بيانات مدير العيادة
  adminUsername: string;
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
  adminPhone?: string;
}

export interface UserCreationRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  specialization?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ===================================================================
// AUTH SERVICE
// ===================================================================

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private storageService = inject(StorageService);
  private notificationService = inject(NotificationService);

  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // State management
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  // Public observables
  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // Signals for reactive UI
  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);

  constructor() {
    this.initializeAuthState();
  }

  // ===================================================================
  // INITIALIZATION
  // ===================================================================

  /**
   * تهيئة حالة المصادقة عند بدء التطبيق
   */
  private initializeAuthState(): void {
    const token = this.getToken();
    const user = this.storageService.getItem<User>(environment.userKey);

    if (token && user) {
      this.setAuthState(user);
    }
  }

  // ===================================================================
  // AUTH API ENDPOINTS - متكاملة مع Spring Boot
  // ===================================================================

  /**
   * 1. تسجيل الدخول - POST /auth/login
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<ApiResponse<JwtAuthenticationResponse>>(`${this.apiUrl}/login`, credentials).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message);
        }
        // Combine JWT response with user data for frontend
        const loginResponse: LoginResponse = {
          ...response.data,
          user: this.currentUser() || {} as User // Will be fetched after login
        };
        return loginResponse;
      }),
      tap(response => {
        this.handleLoginSuccess(response);
        // Fetch current user data after successful login
        this.getCurrentUser().subscribe();
      }),
      catchError(error => {
        this.handleLoginError(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 2. تسجيل عيادة جديدة - POST /auth/register-clinic
   */
  registerClinic(request: ClinicRegistrationRequest): Observable<User> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/register-clinic`, request).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message);
        }
        return response.data;
      }),
      tap(user => {
        this.notificationService.success('تم تسجيل العيادة وإنشاء حساب المدير بنجاح');
        // Optionally auto-login the created admin
        // this.setAuthState(user);
      }),
      catchError(error => {
        const message = error.error?.message || 'فشل في تسجيل العيادة';
        this.notificationService.error(message);
        return throwError(() => error);
      })
    );
  }

  /**
   * 3. إنشاء مستخدم جديد - POST /auth/create-user
   */
  createUser(request: UserCreationRequest): Observable<User> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/create-user`, request).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message);
        }
        return response.data;
      }),
      tap(() => {
        this.notificationService.success('تم إنشاء المستخدم بنجاح');
      }),
      catchError(error => {
        const message = error.error?.message || 'فشل في إنشاء المستخدم';
        this.notificationService.error(message);
        return throwError(() => error);
      })
    );
  }

  /**
   * 4. تغيير كلمة المرور - POST /auth/change-password
   */
  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/change-password`, request).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message);
        }
        return response.data;
      }),
      tap(() => {
        this.notificationService.success('تم تغيير كلمة المرور بنجاح');
      }),
      catchError(error => {
        const message = error.error?.message || 'فشل في تغيير كلمة المرور';
        this.notificationService.error(message);
        return throwError(() => error);
      })
    );
  }

  /**
   * 5. تحديث الرمز المميز - POST /auth/refresh
   */
  refreshToken(): Observable<JwtAuthenticationResponse> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const request: RefreshTokenRequest = { refreshToken };

    return this.http.post<ApiResponse<JwtAuthenticationResponse>>(`${this.apiUrl}/refresh`, request).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message);
        }
        return response.data;
      }),
      tap(response => {
        this.setToken(response.accessToken);
        this.setRefreshToken(response.refreshToken);
      }),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * 6. معلومات المستخدم الحالي - GET /auth/me
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/me`).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message);
        }
        return response.data;
      }),
      tap(user => {
        this.setAuthState(user);
        this.storageService.setItem(environment.userKey, user);
      }),
      catchError(error => {
        console.error('Error fetching current user:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 7. تسجيل الخروج - POST /auth/logout
   */
  logout(): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/logout`, {}).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message);
        }
        return response.data;
      }),
      tap(() => {
        this.handleLogoutSuccess();
      }),
      catchError(error => {
        // حتى لو فشل في API، سنقوم بتسجيل الخروج محلياً
        console.warn('Logout API failed, performing local logout:', error);
        this.handleLogoutSuccess();
        return throwError(() => error);
      })
    );
  }

  /**
   * 8. فحص صحة الرمز المميز - GET /auth/validate
   */
  validateToken(): Observable<boolean> {
    return this.http.get<ApiResponse<boolean>>(`${this.apiUrl}/validate`).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message);
        }
        return response.data;
      }),
      catchError(() => {
        this.logout();
        return throwError(() => false);
      })
    );
  }

  /**
 * 9. طلب إعادة تعيين كلمة المرور - POST /auth/forgot-password
 */
  forgotPassword(email: string): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/forgot-password`, { email }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message);
        }
        return response;
      }),
      tap(() => {
        this.notificationService.success('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
      }),
      catchError(error => {
        const message = error.error?.message || 'فشل في إرسال رابط إعادة التعيين';
        this.notificationService.error(message);
        return throwError(() => error);
      })
    );
  }

  /**
   * 10. التحقق من رمز إعادة التعيين - GET /auth/validate-reset-token
   */
  validateResetToken(token: string): Observable<boolean> {
    return this.http.get<ApiResponse<boolean>>(`${this.apiUrl}/validate-reset-token`, {
      params: { token }
    }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message);
        }
        return response.data;
      }),
      catchError(error => {
        const message = error.error?.message || 'الرمز غير صحيح أو منتهي الصلاحية';
        this.notificationService.error(message);
        return throwError(() => error);
      })
    );
  }

  /**
   * 11. إعادة تعيين كلمة المرور - POST /auth/reset-password
   */
  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/reset-password`, {
      token,
      newPassword
    }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message);
        }
        return response;
      }),
      tap(() => {
        this.notificationService.success('تم تغيير كلمة المرور بنجاح');
      }),
      catchError(error => {
        const message = error.error?.message || 'فشل في تغيير كلمة المرور';
        this.notificationService.error(message);
        return throwError(() => error);
      })
    );
  }

  /**
 * 8. التحقق من رمز تأكيد البريد الإلكتروني - GET /auth/validate-verification-token
 */
  validateVerificationToken(token: string): Observable<boolean> {
    return this.http.get<ApiResponse<boolean>>(`${this.apiUrl}/validate-verification-token`, {
      params: { token }
    }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message);
        }
        return response.data;
      }),
      catchError(error => {
        const message = error.error?.message || 'الرمز غير صحيح أو منتهي الصلاحية';
        this.notificationService.error(message);
        return throwError(() => error);
      })
    );
  }

  /**
   * 9. تأكيد البريد الإلكتروني - POST /auth/verify-email
   */
  verifyEmail(token: string): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/verify-email`, null, {
      params: { token }
    }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message);
        }
        return response;
      }),
      tap(() => {
        this.notificationService.success('تم تفعيل حسابك بنجاح. يمكنك الآن تسجيل الدخول');
      }),
      catchError(error => {
        const message = error.error?.message || 'فشل في تفعيل الحساب';
        this.notificationService.error(message);
        return throwError(() => error);
      })
    );
  }

  /**
   * 10. إعادة إرسال رابط التأكيد - POST /auth/resend-verification
   */
  resendVerificationEmail(email: string): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/resend-verification`, { email }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message);
        }
        return response;
      }),
      tap(() => {
        this.notificationService.success('تم إعادة إرسال رابط التأكيد إلى بريدك الإلكتروني');
      }),
      catchError(error => {
        const message = error.error?.message || 'فشل في إعادة إرسال رابط التأكيد';
        this.notificationService.error(message);
        return throwError(() => error);
      })
    );
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================

  /**
   * الحصول على الرمز المميز
   */
  getToken(): string | null {
    return this.storageService.getItem<string>(environment.tokenKey);
  }

  /**
   * حفظ الرمز المميز
   */
  setToken(token: string): void {
    this.storageService.setItem(environment.tokenKey, token);
  }

  /**
   * الحصول على رمز التحديث
   */
  getRefreshToken(): string | null {
    return this.storageService.getItem<string>(environment.refreshTokenKey);
  }

  /**
   * حفظ رمز التحديث
   */
  setRefreshToken(token: string): void {
    this.storageService.setItem(environment.refreshTokenKey, token);
  }

  /**
   * التحقق من وجود صلاحية معينة
   */
  hasRole(role: string | string[]): boolean {
    const user = this.currentUser();
    if (!user) return false;

    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  }

  /**
   * التحقق من أن المستخدم مدير النظام
   */
  isSystemAdmin(): boolean {
    return this.hasRole('SYSTEM_ADMIN');
  }

  /**
   * التحقق من أن المستخدم مدير عيادة
   */
  isClinicAdmin(): boolean {
    return this.hasRole(['ADMIN', 'SYSTEM_ADMIN']);
  }

  /**
   * التحقق من أن المستخدم طبيب
   */
  isDoctor(): boolean {
    return this.hasRole('DOCTOR');
  }

  /**
   * التحقق من أن المستخدم ممرض
   */
  isNurse(): boolean {
    return this.hasRole('NURSE');
  }

  /**
   * التحقق من أن المستخدم موظف استقبال
   */
  isReceptionist(): boolean {
    return this.hasRole('RECEPTIONIST');
  }

  /**
   * التحقق من الصلاحيات المتعددة
   */
  hasAnyRole(roles: UserRole[]): boolean {
    return this.hasRole(roles);
  }

  /**
   * الحصول على اسم الدور بالعربية
   */
  getRoleDisplayName(role?: UserRole): string {
    const user = this.currentUser();
    const userRole = role || user?.role;

    const roleNames: Record<UserRole, string> = {
      'SYSTEM_ADMIN': 'مدير النظام',
      'ADMIN': 'مدير العيادة',
      'DOCTOR': 'طبيب',
      'NURSE': 'ممرض/ممرضة',
      'RECEPTIONIST': 'موظف استقبال'
    };

    return userRole ? roleNames[userRole] : 'غير محدد';
  }

  // ===================================================================
  // PRIVATE HELPER METHODS
  // ===================================================================

  /**
   * معالجة نجاح تسجيل الدخول
   */
  private handleLoginSuccess(response: LoginResponse): void {
    this.setToken(response.accessToken);
    this.setRefreshToken(response.refreshToken);

    if (response.user) {
      this.storageService.setItem(environment.userKey, response.user);
      this.setAuthState(response.user);
      this.notificationService.success(`مرحباً ${response.user.fullName}`);
    }

    this.router.navigate(['/dashboard']);
  }

  /**
   * معالجة فشل تسجيل الدخول
   */
  private handleLoginError(error: any): void {
    let message = 'حدث خطأ في تسجيل الدخول';

    if (error.error?.message) {
      message = error.error.message;
    } else if (error.status === 401) {
      message = 'اسم المستخدم أو كلمة المرور غير صحيحة';
    } else if (error.status === 403) {
      message = 'الحساب معطل أو لا يملك صلاحيات';
    } else if (error.status === 0) {
      message = 'فشل في الاتصال بالخادم. تأكد من اتصالك بالإنترنت';
    }

    this.notificationService.error(message);
  }

  /**
   * معالجة تسجيل الخروج
   */
  private handleLogoutSuccess(): void {
    this.clearAuthState();
    this.notificationService.info('تم تسجيل الخروج بنجاح');
    this.router.navigate(['/auth/login']);
  }

  /**
   * تعيين حالة المصادقة
   */
  private setAuthState(user: User): void {
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * مسح حالة المصادقة
   */
  private clearAuthState(): void {
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);

    // مسح البيانات المحفوظة
    this.storageService.removeItem(environment.tokenKey);
    this.storageService.removeItem(environment.refreshTokenKey);
    this.storageService.removeItem(environment.userKey);
    this.storageService.removeItem(environment.clinicKey);
  }
}

