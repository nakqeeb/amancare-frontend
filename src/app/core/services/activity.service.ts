// ===================================================================
// Activity Service - Fixed Version
// src/app/core/services/activity.service.ts
// ===================================================================

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of, interval } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import {
  Activity,
  ActivityType,
  ActivityFilter,
  ActivityGroup,
  ActivityPriority,
  ACTIVITY_CONFIG
} from '../../shared/models/activity.model';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/activities`;

  // Local storage for activities (in production, this would come from backend)
  private activitiesSubject = new BehaviorSubject<Activity[]>([]);
  public activities$ = this.activitiesSubject.asObservable();

  // Signals for reactive state
  recentActivities = signal<Activity[]>([]);
  loading = signal(false);

  constructor() {
    // Load initial activities
    this.loadRecentActivities();

    // Poll for new activities every 30 seconds
    interval(30000).subscribe(() => {
      this.loadRecentActivities();
    });

    // Load some sample activities for demonstration
    this.initializeSampleActivities();
  }

  // ===================================================================
  // PUBLIC METHODS
  // ===================================================================

  /**
   * Log a new activity
   */
  logActivity(
    type: ActivityType,
    entityId?: number,
    entityName?: string,
    metadata?: Record<string, any>
  ): void {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return;

    // FIX: Build username properly, handling undefined values
    const userName = this.getUserDisplayName(currentUser);

    const config = ACTIVITY_CONFIG[type];
    const activity: Activity = {
      id: this.generateId(),
      type,
      title: config.titleTemplate,
      description: this.buildDescription(type, entityName, metadata),
      timestamp: new Date(),
      userId: currentUser.id,
      userName: userName, // Use the properly formatted username
      userRole: currentUser.role,
      entityId,
      entityType: this.getEntityType(type),
      entityName,
      metadata,
      priority: config.priority,
      icon: config.icon,
      iconColor: config.color,
      actionUrl: this.buildActionUrl(type, entityId),
      clinicId: currentUser.clinicId
    };

    // Add to local storage (in production, send to backend)
    const activities = this.activitiesSubject.value;
    activities.unshift(activity);

    // Keep only last 100 activities in memory
    if (activities.length > 100) {
      activities.pop();
    }

    this.activitiesSubject.next(activities);
    this.recentActivities.set(activities.slice(0, 20));

    // In production, send to backend
    this.saveActivityToBackend(activity).subscribe();
  }

  /**
   * Get recent activities
   */
  getRecentActivities(limit: number = 20): Observable<Activity[]> {
    this.loading.set(true);

    // In production, this would be an HTTP call
    // For now, return from local storage
    return of(this.activitiesSubject.value.slice(0, limit)).pipe(
      tap(activities => {
        this.recentActivities.set(activities);
        this.loading.set(false);
      }),
      catchError(error => {
        console.error('Error loading activities:', error);
        this.loading.set(false);
        return of([]);
      })
    );
  }

  /**
   * Get activities with filter
   */
  getActivities(filter?: ActivityFilter): Observable<Activity[]> {
    let params = new HttpParams();

    if (filter) {
      if (filter.types?.length) {
        params = params.set('types', filter.types.join(','));
      }
      if (filter.userId) {
        params = params.set('userId', filter.userId.toString());
      }
      if (filter.entityType) {
        params = params.set('entityType', filter.entityType);
      }
      if (filter.dateFrom) {
        params = params.set('dateFrom', filter.dateFrom.toISOString());
      }
      if (filter.dateTo) {
        params = params.set('dateTo', filter.dateTo.toISOString());
      }
      if (filter.priority) {
        params = params.set('priority', filter.priority);
      }
      if (filter.limit) {
        params = params.set('limit', filter.limit.toString());
      }
    }

    // In production, use HTTP
    // return this.http.get<Activity[]>(`${this.apiUrl}`, { params });

    // For now, filter local activities
    let filteredActivities = [...this.activitiesSubject.value];

    if (filter) {
      if (filter.types?.length) {
        filteredActivities = filteredActivities.filter(a =>
          filter.types!.includes(a.type)
        );
      }
      if (filter.userId) {
        filteredActivities = filteredActivities.filter(a =>
          a.userId === filter.userId
        );
      }
      if (filter.dateFrom) {
        filteredActivities = filteredActivities.filter(a =>
          new Date(a.timestamp) >= filter.dateFrom!
        );
      }
      if (filter.dateTo) {
        filteredActivities = filteredActivities.filter(a =>
          new Date(a.timestamp) <= filter.dateTo!
        );
      }
      if (filter.priority) {
        filteredActivities = filteredActivities.filter(a =>
          a.priority === filter.priority
        );
      }
      if (filter.limit) {
        filteredActivities = filteredActivities.slice(0, filter.limit);
      }
    }

    return of(filteredActivities);
  }

  /**
   * Group activities by date
   */
  getGroupedActivities(activities: Activity[]): ActivityGroup[] {
    const groups: Map<string, Activity[]> = new Map();

    activities.forEach(activity => {
      const dateKey = new Date(activity.timestamp).toDateString();
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(activity);
    });

    return Array.from(groups.entries()).map(([date, activities]) => ({
      date: new Date(date),
      activities
    }));
  }

  /**
   * Clear all activities (admin only)
   */
  clearActivities(): void {
    this.activitiesSubject.next([]);
    this.recentActivities.set([]);
  }

  // ===================================================================
  // PRIVATE METHODS
  // ===================================================================

  /**
   * FIX: Helper method to get user display name
   */
  private getUserDisplayName(user: any): string {
    // Try different combinations to get a valid display name
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user.fullName) {
      return user.fullName;
    } else if (user.username) {
      return user.username;
    } else if (user.email) {
      return user.email.split('@')[0]; // Use email prefix as fallback
    } else {
      return `مستخدم #${user.id || ''}`;
    }
  }

  /**
   * Initialize with sample activities for demonstration
   */
  private initializeSampleActivities(): void {
    // Only add sample activities if there are none
    if (this.activitiesSubject.value.length === 0) {
      const sampleActivities: Activity[] = [
        {
          id: this.generateId(),
          type: ActivityType.PATIENT_CREATED,
          title: 'تم إضافة مريض جديد',
          description: 'تم إضافة المريض "أحمد محمد علي"',
          timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
          userId: 1,
          userName: 'د. سارة أحمد',
          userRole: 'DOCTOR',
          entityId: 101,
          entityType: 'patient',
          entityName: 'أحمد محمد علي',
          priority: ActivityPriority.HIGH,
          icon: 'person_add',
          iconColor: 'success',
          actionUrl: '/patients/101'
        },
        {
          id: this.generateId(),
          type: ActivityType.APPOINTMENT_CONFIRMED,
          title: 'تم تأكيد موعد',
          description: 'موعد للمريض "فاطمة الزهراء" في 2025-09-18',
          timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
          userId: 2,
          userName: 'موظف الاستقبال',
          userRole: 'RECEPTIONIST',
          entityId: 202,
          entityType: 'appointment',
          entityName: 'فاطمة الزهراء',
          priority: ActivityPriority.MEDIUM,
          icon: 'event_available',
          iconColor: 'info',
          actionUrl: '/appointments/202'
        },
        {
          id: this.generateId(),
          type: ActivityType.INVOICE_PAID,
          title: 'تم دفع فاتورة',
          description: 'تم دفع فاتورة بقيمة 500 ريال',
          timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          userId: 3,
          userName: 'المحاسب',
          userRole: 'ADMIN',
          entityId: 303,
          entityType: 'invoice',
          metadata: { amount: 500 },
          priority: ActivityPriority.HIGH,
          icon: 'payment',
          iconColor: 'success',
          actionUrl: '/invoices/303'
        },
        {
          id: this.generateId(),
          type: ActivityType.MEDICAL_RECORD_CREATED,
          title: 'تم إضافة سجل طبي',
          description: 'سجل طبي جديد للمريض "عبدالله السالم"',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          userId: 1,
          userName: 'د. سارة أحمد',
          userRole: 'DOCTOR',
          entityId: 404,
          entityType: 'medical_record',
          entityName: 'عبدالله السالم',
          priority: ActivityPriority.MEDIUM,
          icon: 'medical_services',
          iconColor: 'primary',
          actionUrl: '/medical-records/404'
        }
      ];

      this.activitiesSubject.next(sampleActivities);
      this.recentActivities.set(sampleActivities);
    }
  }

  private loadRecentActivities(): void {
    // In production, load from backend
    // For now, just refresh the signal with current activities
    this.recentActivities.set(this.activitiesSubject.value.slice(0, 20));
  }

  private saveActivityToBackend(activity: Activity): Observable<any> {
    // In production, save to backend
    // return this.http.post(`${this.apiUrl}`, activity);
    return of(activity);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getEntityType(type: ActivityType): string {
    if (type.startsWith('PATIENT_')) return 'patient';
    if (type.startsWith('APPOINTMENT_')) return 'appointment';
    if (type.startsWith('INVOICE_')) return 'invoice';
    if (type.startsWith('MEDICAL_RECORD_')) return 'medical_record';
    if (type.startsWith('USER_')) return 'user';
    return 'system';
  }

  private buildDescription(
    type: ActivityType,
    entityName?: string,
    metadata?: Record<string, any>
  ): string {
    let description = '';

    switch (type) {
      case ActivityType.PATIENT_CREATED:
        description = `تم إضافة المريض "${entityName}"`;
        break;
      case ActivityType.APPOINTMENT_SCHEDULED:
        description = `موعد جديد للمريض "${entityName}" في ${metadata?.['date']}`;
        break;
      case ActivityType.INVOICE_PAID:
        description = `تم دفع فاتورة بقيمة ${metadata?.['amount']} ريال`;
        break;
      case ActivityType.MEDICAL_RECORD_CREATED:
        description = `سجل طبي جديد للمريض "${entityName}"`;
        break;
      default:
        description = entityName || '';
    }

    return description;
  }

  private buildActionUrl(type: ActivityType, entityId?: number): string {
    if (!entityId) return '';

    const entityType = this.getEntityType(type);
    switch (entityType) {
      case 'patient':
        return `/patients/${entityId}`;
      case 'appointment':
        return `/appointments/${entityId}`;
      case 'invoice':
        return `/invoices/${entityId}`;
      case 'medical_record':
        return `/medical-records/${entityId}`;
      case 'user':
        return `/users/${entityId}`;
      default:
        return '';
    }
  }

  // ===================================================================
  // ACTIVITY TRACKING METHODS (Called by other services)
  // ===================================================================

  // Patient Activities
  logPatientCreated(patientId: number, patientName: string): void {
    this.logActivity(ActivityType.PATIENT_CREATED, patientId, patientName);
  }

  logPatientUpdated(patientId: number, patientName: string): void {
    this.logActivity(ActivityType.PATIENT_UPDATED, patientId, patientName);
  }

  logPatientDeleted(patientId: number, patientName: string): void {
    this.logActivity(ActivityType.PATIENT_DELETED, patientId, patientName);
  }

  // Appointment Activities
  logAppointmentScheduled(appointmentId: number, patientName: string, date: string): void {
    this.logActivity(
      ActivityType.APPOINTMENT_SCHEDULED,
      appointmentId,
      patientName,
      { date }
    );
  }

  logAppointmentConfirmed(appointmentId: number, patientName: string): void {
    this.logActivity(ActivityType.APPOINTMENT_CONFIRMED, appointmentId, patientName);
  }

  logAppointmentCancelled(appointmentId: number, patientName: string): void {
    this.logActivity(ActivityType.APPOINTMENT_CANCELLED, appointmentId, patientName);
  }

  logAppointmentCompleted(appointmentId: number, patientName: string): void {
    this.logActivity(ActivityType.APPOINTMENT_COMPLETED, appointmentId, patientName);
  }

  logAppointmentInProgress(appointmentId: number, patientName: string): void {
    this.logActivity(ActivityType.APPOINTMENT_IN_PROGRESS, appointmentId, patientName);
  }

  logAppointmentNoShow(appointmentId: number, patientName: string): void {
    this.logActivity(ActivityType.APPOINTMENT_NO_SHOW, appointmentId, patientName);
  }

  // Invoice Activities
  logInvoiceCreated(invoiceId: number, amount: number): void {
    this.logActivity(
      ActivityType.INVOICE_CREATED,
      invoiceId,
      undefined,
      { amount }
    );
  }

  logInvoicePaid(invoiceId: number, amount: number): void {
    this.logActivity(
      ActivityType.INVOICE_PAID,
      invoiceId,
      undefined,
      { amount }
    );
  }

  // Medical Record Activities
  logMedicalRecordCreated(recordId: number, patientName: string): void {
    this.logActivity(ActivityType.MEDICAL_RECORD_CREATED, recordId, patientName);
  }

  logPrescriptionIssued(recordId: number, patientName: string): void {
    this.logActivity(ActivityType.PRESCRIPTION_ISSUED, recordId, patientName);
  }

  // User Activities
  logUserLogin(): void {
    // Only log if it's a real login, not just page navigation
    this.logActivity(ActivityType.USER_LOGIN);
  }

  logUserLogout(): void {
    this.logActivity(ActivityType.USER_LOGOUT);
  }
}
