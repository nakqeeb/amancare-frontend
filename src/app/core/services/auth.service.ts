import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';
import { NotificationService } from './notification.service';

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  role: 'SYSTEM_ADMIN' | 'ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST';
  specialization?: string;
  clinicId: number;
  clinicName: string;
  isActive: boolean;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: User;
}

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

  /**
   * تسجيل الدخول
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        this.handleLoginSuccess(response);
      }),
      catchError(error => {
        this.handleLoginError(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * تسجيل الخروج
   */
  logout(): void {
    // استدعاء API لتسجيل الخروج
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
      next: () => {
        this.handleLogoutSuccess();
      },
      error: () => {
        // حتى لو فشل في API، سنقوم بتسجيل الخروج محلياً
        this.handleLogoutSuccess();
      }
    });
  }

  /**
   * تحديث الرمز المميز
   */
  refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<LoginResponse>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
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
   * تغيير كلمة المرور
   */
  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/change-password`, {
      oldPassword,
      newPassword
    }).pipe(
      tap(() => {
        this.notificationService.success('تم تغيير كلمة المرور بنجاح');
      }),
      catchError(error => {
        this.notificationService.error('فشل في تغيير كلمة المرور');
        return throwError(() => error);
      })
    );
  }

  /**
   * التحقق من صحة الرمز المميز
   */
  validateToken(): Observable<boolean> {
    return this.http.get<{valid: boolean}>(`${this.apiUrl}/validate`).pipe(
      map(response => response.valid),
      catchError(() => {
        this.logout();
        return throwError(() => false);
      })
    );
  }

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
   * معالجة نجاح تسجيل الدخول
   */
  private handleLoginSuccess(response: LoginResponse): void {
    this.setToken(response.accessToken);
    this.setRefreshToken(response.refreshToken);
    this.storageService.setItem(environment.userKey, response.user);

    this.setAuthState(response.user);

    this.notificationService.success(`مرحباً ${response.user.fullName}`);
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
