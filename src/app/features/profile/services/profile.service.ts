// ===================================================================
// Profile Service
// src/app/features/profile/services/profile.service.ts
// ===================================================================

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, BehaviorSubject, throwError } from 'rxjs';
import { tap, map, catchError, delay, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  UserProfile,
  UpdateProfileRequest,
  UpdatePreferencesRequest,
  ChangePasswordRequest,
  UpdateProfilePictureRequest,
  ActivityHistory,
  UserSession,
  ProfileDataExport,
  NotificationSettings,
  Education,
  Certification
} from '../models/profile.model';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  private apiUrl = `${environment.apiUrl}/profile`;

  // Signals for reactive state
  private _currentProfile = signal<UserProfile | null>(null);
  private _loading = signal<boolean>(false);
  private _activityHistory = signal<ActivityHistory[]>([]);
  private _sessions = signal<UserSession[]>([]);

  // Public readonly signals
  readonly currentProfile = this._currentProfile.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly activityHistory = this._activityHistory.asReadonly();
  readonly sessions = this._sessions.asReadonly();

  // Computed values
  readonly profileCompleteness = computed(() => {
    const profile = this._currentProfile();
    if (!profile) return 0;

    const requiredFields = ['firstName', 'lastName', 'email', 'phone'];
    const optionalFields = ['bio', 'address', 'dateOfBirth', 'profilePicture',
      'specialization', 'emergencyContact'];

    let completed = 0;
    let total = requiredFields.length + optionalFields.length;

    requiredFields.forEach(field => {
      if (profile[field as keyof UserProfile]) completed++;
    });

    optionalFields.forEach(field => {
      if (profile[field as keyof UserProfile]) completed++;
    });

    return Math.round((completed / total) * 100);
  });

  readonly hasProfilePicture = computed(() => {
    return !!this._currentProfile()?.profilePicture;
  });

  // Mock data for development
  private mockProfile: UserProfile = {
    id: 1,
    username: 'doctor.ahmed',
    email: 'ahmed@amancare.com',
    firstName: 'أحمد',
    lastName: 'محمد',
    fullName: 'د. أحمد محمد',
    phone: '+966501234567',
    profilePicture: undefined,
    role: 'DOCTOR' as any,
    isActive: true,
    clinicId: 1,
    clinicName: 'عيادة الشفاء',
    specialization: 'طب عام',
    licenseNumber: 'SAU-DOC-2024-1234',
    yearsOfExperience: 8,
    languages: ['العربية', 'English'],
    bio: 'طبيب عام متخصص في الرعاية الصحية الأولية',
    preferences: {
      theme: 'light',
      language: 'ar',
      fontSize: 'medium',
      timezone: 'Asia/Riyadh',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '12h',
      firstDayOfWeek: 6,
      currency: 'SAR',
      dashboardLayout: 'expanded',
      defaultLandingPage: '/dashboard',
      emailNotifications: {
        enabled: true,
        appointments: true,
        patients: true,
        invoices: true,
        reports: false,
        systemUpdates: true,
        reminders: true,
        digest: 'daily'
      },
      smsNotifications: {
        enabled: true,
        appointments: true,
        patients: false,
        invoices: false,
        reports: false,
        systemUpdates: false,
        reminders: true,
        digest: 'none'
      },
      pushNotifications: {
        enabled: true,
        appointments: true,
        patients: true,
        invoices: true,
        reports: true,
        systemUpdates: true,
        reminders: true,
        digest: 'none'
      },
      inAppNotifications: {
        enabled: true,
        appointments: true,
        patients: true,
        invoices: true,
        reports: true,
        systemUpdates: true,
        reminders: true,
        digest: 'none'
      },
      profileVisibility: 'clinic',
      showOnlineStatus: true,
      allowMessages: true,
      shareActivityStatus: false,
      highContrast: false,
      reduceMotion: false,
      screenReaderMode: false,
      keyboardShortcuts: true
    },
    statistics: {
      totalLogins: 245,
      lastLoginAt: new Date().toISOString(),
      accountCreatedAt: '2023-01-15T10:00:00Z',
      profileCompleteness: 75,
      appointmentsManaged: 1250,
      patientsHandled: 450,
      invoicesProcessed: 890,
      reportsGenerated: 120,
      loginsThisMonth: 22,
      actionsThisMonth: 340,
      storageUsed: 256000000, // 256 MB
      storageLimit: 1073741824 // 1 GB
    },
    twoFactorEnabled: false,
    createdAt: '2023-01-15T10:00:00Z',
    updatedAt: new Date().toISOString()
  };

  constructor() {
    // Initialize profile on service creation
    this.loadCurrentProfile();
  }

  // Load current user profile
  loadCurrentProfile(): Observable<UserProfile> {
    this._loading.set(true);

    // Mock implementation
    return of(this.mockProfile).pipe(
      delay(500),
      tap(profile => {
        this._currentProfile.set(profile);
        this._loading.set(false);
      }),
      catchError(error => {
        this._loading.set(false);
        this.notificationService.error('فشل تحميل الملف الشخصي');
        return throwError(() => error);
      })
    );

    // Real implementation
    // return this.http.get<UserProfile>(`${this.apiUrl}/me`).pipe(
    //   tap(profile => {
    //     this._currentProfile.set(profile);
    //     this._loading.set(false);
    //   }),
    //   catchError(error => {
    //     this._loading.set(false);
    //     this.notificationService.error('Failed to load profile');
    //     return throwError(() => error);
    //   })
    // );
  }

  // Update profile information
  updateProfile(request: UpdateProfileRequest): Observable<UserProfile> {
    this._loading.set(true);

    // Mock implementation
    const updatedProfile = {
      ...this.mockProfile,
      ...request,
      updatedAt: new Date().toISOString()
    };

    return of(updatedProfile).pipe(
      delay(800),
      tap(profile => {
        this._currentProfile.set(profile);
        this.mockProfile = profile;
        this._loading.set(false);
        this.notificationService.success('تم تحديث الملف الشخصي بنجاح');
      }),
      catchError(error => {
        this._loading.set(false);
        this.notificationService.error('فشل تحديث الملف الشخصي');
        return throwError(() => error);
      })
    );

    // Real implementation
    // return this.http.put<UserProfile>(`${this.apiUrl}/me`, request).pipe(
    //   tap(profile => {
    //     this._currentProfile.set(profile);
    //     this._loading.set(false);
    //     this.notificationService.success('Profile updated successfully');
    //   }),
    //   catchError(error => {
    //     this._loading.set(false);
    //     this.notificationService.error('Failed to update profile');
    //     return throwError(() => error);
    //   })
    // );
  }

  // Update user preferences
  updatePreferences(request: UpdatePreferencesRequest): Observable<UserProfile> {
    this._loading.set(true);

    // Mock implementation
    const updatedProfile = {
      ...this.mockProfile,
      preferences: {
        ...this.mockProfile.preferences!,
        ...request
      },
      updatedAt: new Date().toISOString()
    };

    return of(updatedProfile).pipe(
      delay(500),
      tap(profile => {
        this._currentProfile.set(profile);
        this.mockProfile = profile;
        this._loading.set(false);
        this.notificationService.success('تم تحديث الإعدادات بنجاح');
      })
    );

    // Real implementation
    // return this.http.put<UserProfile>(`${this.apiUrl}/preferences`, request).pipe(
    //   tap(profile => {
    //     this._currentProfile.set(profile);
    //     this._loading.set(false);
    //     this.notificationService.success('Preferences updated successfully');
    //   })
    // );
  }

  // Change password
  changePassword(request: ChangePasswordRequest): Observable<{ success: boolean; message: string }> {
    this._loading.set(true);

    // Mock implementation
    return of({ success: true, message: 'تم تغيير كلمة المرور بنجاح' }).pipe(
      delay(1000),
      tap(response => {
        this._loading.set(false);
        if (response.success) {
          this.notificationService.success(response.message);
          if (request.logoutOtherSessions) {
            this.terminateAllSessions();
          }
        }
      }),
      catchError(error => {
        this._loading.set(false);
        this.notificationService.error('فشل تغيير كلمة المرور');
        return throwError(() => error);
      })
    );

    // Real implementation
    // return this.http.post<{ success: boolean; message: string }>(
    //   `${this.apiUrl}/change-password`,
    //   request
    // ).pipe(
    //   tap(response => {
    //     this._loading.set(false);
    //     if (response.success) {
    //       this.notificationService.success(response.message);
    //     }
    //   })
    // );
  }

  // Update profile picture
  updateProfilePicture(request: UpdateProfilePictureRequest): Observable<string> {
    this._loading.set(true);

    // Mock implementation
    const newPictureUrl = `data:${request.mimeType};base64,${request.imageData}`;

    return of(newPictureUrl).pipe(
      delay(1500),
      tap(url => {
        const currentProfile = this._currentProfile();
        if (currentProfile) {
          currentProfile.profilePicture = url;
          this._currentProfile.set({ ...currentProfile });
        }
        this._loading.set(false);
        this.notificationService.success('تم تحديث صورة الملف الشخصي');
      })
    );

    // Real implementation
    // return this.http.post<{ url: string }>(
    //   `${this.apiUrl}/profile-picture`,
    //   request
    // ).pipe(
    //   map(response => response.url),
    //   tap(url => {
    //     const currentProfile = this._currentProfile();
    //     if (currentProfile) {
    //       currentProfile.profilePicture = url;
    //       this._currentProfile.set({...currentProfile});
    //     }
    //     this._loading.set(false);
    //     this.notificationService.success('Profile picture updated');
    //   })
    // );
  }

  // Remove profile picture
  removeProfilePicture(): Observable<boolean> {
    this._loading.set(true);

    // Mock implementation
    return of(true).pipe(
      delay(500),
      tap(() => {
        const currentProfile = this._currentProfile();
        if (currentProfile) {
          currentProfile.profilePicture = undefined;
          this._currentProfile.set({ ...currentProfile });
        }
        this._loading.set(false);
        this.notificationService.success('تم إزالة صورة الملف الشخصي');
      })
    );

    // Real implementation
    // return this.http.delete<boolean>(`${this.apiUrl}/profile-picture`).pipe(
    //   tap(() => {
    //     const currentProfile = this._currentProfile();
    //     if (currentProfile) {
    //       currentProfile.profilePicture = null;
    //       this._currentProfile.set({...currentProfile});
    //     }
    //     this._loading.set(false);
    //     this.notificationService.success('Profile picture removed');
    //   })
    // );
  }

  // Get activity history
  getActivityHistory(
    startDate?: string,
    endDate?: string,
    category?: string
  ): Observable<ActivityHistory[]> {
    // Mock implementation
    const mockHistory: ActivityHistory[] = [
      {
        id: 1,
        action: 'LOGIN',
        description: 'تسجيل دخول ناجح',
        category: 'AUTHENTICATION' as any,
        timestamp: new Date().toISOString(),
        ipAddress: '192.168.1.100',
        deviceType: 'desktop',
        success: true
      },
      {
        id: 2,
        action: 'PROFILE_UPDATE',
        description: 'تحديث معلومات الملف الشخصي',
        category: 'PROFILE' as any,
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        success: true
      },
      {
        id: 3,
        action: 'PASSWORD_CHANGE',
        description: 'تغيير كلمة المرور',
        category: 'SECURITY' as any,
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        success: true
      }
    ];

    return of(mockHistory).pipe(
      delay(300),
      tap(history => this._activityHistory.set(history))
    );

    // Real implementation
    // let params = new HttpParams();
    // if (startDate) params = params.set('startDate', startDate);
    // if (endDate) params = params.set('endDate', endDate);
    // if (category) params = params.set('category', category);
    //
    // return this.http.get<ActivityHistory[]>(`${this.apiUrl}/activity`, { params })
    //   .pipe(tap(history => this._activityHistory.set(history)));
  }

  // Get active sessions
  getActiveSessions(): Observable<UserSession[]> {
    // Mock implementation
    const mockSessions: UserSession[] = [
      {
        id: 'session-1',
        deviceName: 'Chrome على Windows',
        deviceType: 'desktop',
        browser: 'Chrome 120',
        ipAddress: '192.168.1.100',
        location: 'الرياض، السعودية',
        loginTime: new Date().toISOString(),
        lastActivityTime: new Date().toISOString(),
        isCurrentSession: true,
        isActive: true
      },
      {
        id: 'session-2',
        deviceName: 'Safari على iPhone',
        deviceType: 'mobile',
        browser: 'Safari 17',
        ipAddress: '192.168.1.101',
        location: 'جدة، السعودية',
        loginTime: new Date(Date.now() - 7200000).toISOString(),
        lastActivityTime: new Date(Date.now() - 3600000).toISOString(),
        isCurrentSession: false,
        isActive: true
      }
    ];

    return of(mockSessions).pipe(
      delay(300),
      tap(sessions => this._sessions.set(sessions))
    );

    // Real implementation
    // return this.http.get<UserSession[]>(`${this.apiUrl}/sessions`)
    //   .pipe(tap(sessions => this._sessions.set(sessions)));
  }

  // Terminate specific session
  terminateSession(sessionId: string): Observable<boolean> {
    return of(true).pipe(
      delay(500),
      tap(() => {
        const sessions = this._sessions();
        this._sessions.set(sessions.filter(s => s.id !== sessionId));
        this.notificationService.success('تم إنهاء الجلسة بنجاح');
      })
    );

    // Real implementation
    // return this.http.delete<boolean>(`${this.apiUrl}/sessions/${sessionId}`)
    //   .pipe(tap(() => {
    //     const sessions = this._sessions();
    //     this._sessions.set(sessions.filter(s => s.id !== sessionId));
    //     this.notificationService.success('Session terminated successfully');
    //   }));
  }

  // Terminate all sessions except current
  terminateAllSessions(): Observable<boolean> {
    return of(true).pipe(
      delay(500),
      tap(() => {
        const sessions = this._sessions();
        this._sessions.set(sessions.filter(s => s.isCurrentSession));
        this.notificationService.success('تم إنهاء جميع الجلسات الأخرى');
      })
    );

    // Real implementation
    // return this.http.post<boolean>(`${this.apiUrl}/sessions/terminate-all`, {})
    //   .pipe(tap(() => {
    //     const sessions = this._sessions();
    //     this._sessions.set(sessions.filter(s => s.isCurrentSession));
    //     this.notificationService.success('All other sessions terminated');
    //   }));
  }

  // Update notification settings
  updateNotificationSettings(
    type: 'email' | 'sms' | 'push' | 'inApp',
    settings: Partial<NotificationSettings>
  ): Observable<UserProfile> {
    const profile = this._currentProfile();
    if (!profile || !profile.preferences) {
      return throwError(() => new Error('Profile not loaded'));
    }

    const key = `${type}Notifications` as keyof typeof profile.preferences;
    const updated = {
      ...profile,
      preferences: {
        ...profile.preferences,
        [key]: {
         // ...profile.preferences[key],
          ...settings
        }
      }
    };

    return of(updated).pipe(
      delay(300),
      tap(updatedProfile => {
        this._currentProfile.set(updatedProfile);
        this.notificationService.success('تم تحديث إعدادات الإشعارات');
      })
    );

    // Real implementation
    // return this.http.put<UserProfile>(
    //   `${this.apiUrl}/notifications/${type}`,
    //   settings
    // ).pipe(
    //   tap(profile => {
    //     this._currentProfile.set(profile);
    //     this.notificationService.success('Notification settings updated');
    //   })
    // );
  }

  // Export profile data
  exportProfileData(format: 'json' | 'pdf' | 'csv'): Observable<Blob> {
    // Mock implementation
    const mockData: ProfileDataExport = {
      profile: this.mockProfile,
      activityHistory: this._activityHistory(),
      preferences: this.mockProfile.preferences!,
      exportDate: new Date().toISOString(),
      format
    };

    const blob = new Blob([JSON.stringify(mockData, null, 2)], {
      type: format === 'json' ? 'application/json' : 'text/csv'
    });

    return of(blob).pipe(
      delay(1000),
      tap(() => {
        this.notificationService.success('تم تصدير البيانات بنجاح');
      })
    );

    // Real implementation
    // return this.http.get(`${this.apiUrl}/export`, {
    //   params: { format },
    //   responseType: 'blob'
    // }).pipe(
    //   tap(() => {
    //     this.notificationService.success('Data exported successfully');
    //   })
    // );
  }

  // Enable two-factor authentication
  enableTwoFactor(): Observable<{ qrCode: string; secret: string }> {
    return of({
      qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      secret: 'JBSWY3DPEHPK3PXP'
    }).pipe(
      delay(500),
      tap(() => {
        const profile = this._currentProfile();
        if (profile) {
          profile.twoFactorEnabled = true;
          this._currentProfile.set({ ...profile });
        }
      })
    );

    // Real implementation
    // return this.http.post<{ qrCode: string; secret: string }>(
    //   `${this.apiUrl}/2fa/enable`,
    //   {}
    // );
  }

  // Disable two-factor authentication
  disableTwoFactor(password: string): Observable<boolean> {
    return of(true).pipe(
      delay(500),
      tap(() => {
        const profile = this._currentProfile();
        if (profile) {
          profile.twoFactorEnabled = false;
          this._currentProfile.set({ ...profile });
        }
        this.notificationService.success('تم تعطيل المصادقة الثنائية');
      })
    );

    // Real implementation
    // return this.http.post<boolean>(`${this.apiUrl}/2fa/disable`, { password });
  }

  // Add education
  addEducation(education: Education): Observable<Education> {
    const newEducation = { ...education, id: Date.now() };
    const profile = this._currentProfile();

    if (profile) {
      profile.education = [...(profile.education || []), newEducation];
      this._currentProfile.set({ ...profile });
    }

    return of(newEducation).pipe(
      delay(500),
      tap(() => this.notificationService.success('تمت إضافة التعليم بنجاح'))
    );
  }

  // Update education
  updateEducation(id: number, education: Education): Observable<Education> {
    const profile = this._currentProfile();

    if (profile && profile.education) {
      const index = profile.education.findIndex(e => e.id === id);
      if (index > -1) {
        profile.education[index] = { ...education, id };
        this._currentProfile.set({ ...profile });
      }
    }

    return of(education).pipe(
      delay(500),
      tap(() => this.notificationService.success('تم تحديث التعليم بنجاح'))
    );
  }

  // Delete education
  deleteEducation(id: number): Observable<boolean> {
    const profile = this._currentProfile();

    if (profile && profile.education) {
      profile.education = profile.education.filter(e => e.id !== id);
      this._currentProfile.set({ ...profile });
    }

    return of(true).pipe(
      delay(500),
      tap(() => this.notificationService.success('تم حذف التعليم بنجاح'))
    );
  }

  // Similar methods for certifications
  addCertification(certification: Certification): Observable<Certification> {
    const newCert = { ...certification, id: Date.now() };
    const profile = this._currentProfile();

    if (profile) {
      profile.certifications = [...(profile.certifications || []), newCert];
      this._currentProfile.set({ ...profile });
    }

    return of(newCert).pipe(
      delay(500),
      tap(() => this.notificationService.success('تمت إضافة الشهادة بنجاح'))
    );
  }

  updateCertification(id: number, certification: Certification): Observable<Certification> {
    const profile = this._currentProfile();

    if (profile && profile.certifications) {
      const index = profile.certifications.findIndex(c => c.id === id);
      if (index > -1) {
        profile.certifications[index] = { ...certification, id };
        this._currentProfile.set({ ...profile });
      }
    }

    return of(certification).pipe(
      delay(500),
      tap(() => this.notificationService.success('تم تحديث الشهادة بنجاح'))
    );
  }

  deleteCertification(id: number): Observable<boolean> {
    const profile = this._currentProfile();

    if (profile && profile.certifications) {
      profile.certifications = profile.certifications.filter(c => c.id !== id);
      this._currentProfile.set({ ...profile });
    }

    return of(true).pipe(
      delay(500),
      tap(() => this.notificationService.success('تم حذف الشهادة بنجاح'))
    );
  }
}
