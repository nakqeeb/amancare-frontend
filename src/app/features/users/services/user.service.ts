// ===================================================================
// User Service Implementation
// src/app/features/users/services/user.service.ts
// ===================================================================
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  User,
  UserRole,
  CreateUserRequest,
  UpdateUserRequest,
  UserFilters,
  UserStatsDto
} from '../models/user.model';
import { ApiResponse, PageResponse } from '../../../core/models/api-response.model';
import { NotificationService } from '../../../core/services/notification.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);

  private apiUrl = `${environment.apiUrl}/users`;

  // Signals for state management
  users = signal<User[]>([]);
  selectedUser = signal<User | null>(null);
  userStats = signal<UserStatsDto | null>(null);
  loading = signal(false);

  // BehaviorSubject for reactive data
  private usersSubject = new BehaviorSubject<User[]>([]);
  users$ = this.usersSubject.asObservable();

  // ===================================================================
  // CRUD Operations
  // ===================================================================

  // Get all users with filters
  getUsers(filters?: UserFilters): Observable<PageResponse<User>> {
    this.loading.set(true);

    let params = new HttpParams();
    if (filters) {
      if (filters.role) params = params.set('role', filters.role);
      if (filters.isActive !== undefined) params = params.set('isActive', filters.isActive.toString());
      if (filters.search) params = params.set('search', filters.search);
      if (filters.page !== undefined) params = params.set('page', filters.page.toString());
      if (filters.size !== undefined) params = params.set('size', filters.size.toString());
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.sortDirection) params = params.set('sortDirection', filters.sortDirection);
    }

    return this.http.get<PageResponse<User>>(this.apiUrl, { params }).pipe(
      tap(response => {
        this.users.set(response.content);
        this.usersSubject.next(response.content);
        this.loading.set(false);
      }),
      catchError(error => {
        this.loading.set(false);
        this.handleError('خطأ في تحميل المستخدمين', error);
        return throwError(() => error);
      })
    );
  }

  // Get user by ID
  getUserById(id: number): Observable<User> {
    this.loading.set(true);

    return this.http.get<User>(`${this.apiUrl}/${id}`).pipe(
      tap(user => {
        this.selectedUser.set(user);
        this.loading.set(false);
      }),
      catchError(error => {
        this.loading.set(false);
        this.handleError('خطأ في تحميل بيانات المستخدم', error);
        return throwError(() => error);
      })
    );
  }

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

  // Delete user (soft delete - set inactive)
  deleteUser(id: number): Observable<void> {
    this.loading.set(true);

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const currentUsers = this.users().filter(u => u.id !== id);
        this.users.set(currentUsers);
        this.usersSubject.next(currentUsers);
        this.loading.set(false);
        this.notificationService.success('تم حذف المستخدم بنجاح');
      }),
      catchError(error => {
        this.loading.set(false);
        this.handleError('خطأ في حذف المستخدم', error);
        return throwError(() => error);
      })
    );
  }

  // ===================================================================
  // User Status Management
  // ===================================================================

  // Activate user
  activateUser(id: number): Observable<User> {
    return this.updateUser(id, { isActive: true });
  }

  // Deactivate user
  deactivateUser(id: number): Observable<User> {
    return this.updateUser(id, { isActive: false });
  }

  // Bulk activate users
  bulkActivateUsers(userIds: number[]): Observable<void> {
    this.loading.set(true);

    return this.http.post<void>(`${this.apiUrl}/bulk/activate`, { userIds }).pipe(
      tap(() => {
        this.refreshUsers();
        this.notificationService.success('تم تفعيل المستخدمين المحددين');
      }),
      catchError(error => {
        this.loading.set(false);
        this.handleError('خطأ في تفعيل المستخدمين', error);
        return throwError(() => error);
      })
    );
  }

  // Bulk deactivate users
  bulkDeactivateUsers(userIds: number[]): Observable<void> {
    this.loading.set(true);

    return this.http.post<void>(`${this.apiUrl}/bulk/deactivate`, { userIds }).pipe(
      tap(() => {
        this.refreshUsers();
        this.notificationService.success('تم إلغاء تفعيل المستخدمين المحددين');
      }),
      catchError(error => {
        this.loading.set(false);
        this.handleError('خطأ في إلغاء تفعيل المستخدمين', error);
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

  // ===================================================================
  // Statistics & Analytics
  // ===================================================================

  // Get user statistics
  getUserStats(): Observable<UserStatsDto> {
    return this.http.get<UserStatsDto>(`${this.apiUrl}/stats`).pipe(
      tap(stats => {
        this.userStats.set(stats);
      }),
      catchError(error => {
        this.handleError('خطأ في تحميل إحصائيات المستخدمين', error);
        return throwError(() => error);
      })
    );
  }

  // Get doctors list (for dropdowns)
  getDoctors(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/doctors`);
  }

  // ===================================================================
  // Utility Methods
  // ===================================================================

  // Check if username exists
  checkUsernameExists(username: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/check/username/${username}`);
  }

  // Check if email exists
  checkEmailExists(email: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/check/email/${email}`);
  }

  // Refresh users list
  private refreshUsers(): void {
    this.getUsers().subscribe();
  }

  // Get role display name
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

  // Error handling
  private handleError(message: string, error: any): void {
    console.error('User Service Error:', error);

    if (error.status === 400) {
      this.notificationService.error(`${message}: ${error.error?.message || 'بيانات غير صحيحة'}`);
    } else if (error.status === 404) {
      this.notificationService.error('المستخدم غير موجود');
    } else if (error.status === 409) {
      this.notificationService.error('اسم المستخدم أو البريد الإلكتروني مستخدم مسبقاً');
    } else {
      this.notificationService.error(message);
    }
  }

  // Clear selected user
  clearSelection(): void {
    this.selectedUser.set(null);
  }

  // Reset loading state
  resetLoading(): void {
    this.loading.set(false);
  }
}
