// =============================================================================
// Recent Activities Component - مكون الأنشطة الأخيرة
// src/app/features/admin/components/recent-activities/recent-activities.component.ts
// =============================================================================

import { Component, OnInit, OnDestroy, Input, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { Subject, interval, takeUntil, switchMap } from 'rxjs';

import { ActivityService } from '../../services/activity.service';
import { ActivityLogResponse, ActionType, ENTITY_TYPE_LABELS } from '../../models/activity.model';

/**
 * مكون الأنشطة الأخيرة
 * Recent Activities Component
 */
@Component({
  selector: 'app-recent-activities',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './recent-activities.component.html',
  styleUrls: ['./recent-activities.component.scss']
})
export class RecentActivitiesComponent implements OnInit, OnDestroy {
  private activityService = inject(ActivityService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  // ===================================================================
  // INPUTS
  // ===================================================================

  @Input() limit: number = 20;
  @Input() showHeader: boolean = true;
  @Input() autoRefresh: boolean = true;
  @Input() refreshInterval: number = 30000; // 30 seconds

  // ===================================================================
  // STATE
  // ===================================================================

  activities = signal<ActivityLogResponse[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // ===================================================================
  // COMPUTED VALUES
  // ===================================================================

  hasActivities = computed(() => this.activities().length > 0);
  isEmpty = computed(() => !this.loading() && this.activities().length === 0);

  // ===================================================================
  // LIFECYCLE HOOKS
  // ===================================================================

  ngOnInit(): void {
    this.loadActivities();

    // Set up auto-refresh if enabled
    if (this.autoRefresh) {
      this.setupAutoRefresh();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===================================================================
  // DATA LOADING
  // ===================================================================

  loadActivities(): void {
    this.loading.set(true);
    this.error.set(null);

    this.activityService.getRecentActivities(this.limit)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.activities.set(response.data);
          }
          this.loading.set(false);
        },
        error: (error) => {
          this.error.set('فشل في تحميل الأنشطة');
          this.loading.set(false);
          console.error('Error loading activities:', error);
        }
      });
  }

  setupAutoRefresh(): void {
    interval(this.refreshInterval)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.activityService.getRecentActivities(this.limit))
      )
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.activities.set(response.data);
          }
        },
        error: (error) => {
          console.error('Auto-refresh error:', error);
        }
      });
  }

  // ===================================================================
  // UI METHODS
  // ===================================================================

  refresh(): void {
    this.loadActivities();
  }

  viewAllActivities(): void {
    this.router.navigate(['/admin/activities']);
  }

  viewActivityDetails(activity: ActivityLogResponse): void {
    // Edited: Don't navigate for authentication activities
    if (activity.entityType === 'Authentication' || activity.entityType === 'Registration') {
      // Authentication activities don't have a detail page
      return;
    }
    // End of edit

    // Navigate to entity details if available
    if (activity.entityType && activity.entityId) {
      this.navigateToEntity(activity.entityType, activity.entityId);
    }
  }

  navigateToEntity(entityType: string, entityId: number): void {
    const routes: { [key: string]: string } = {
      'Patient': `/patients/${entityId}`,
      'Appointment': `/appointments/${entityId}`,
      'MedicalRecord': `/medical-records/${entityId}`,
      'Invoice': `/invoices/${entityId}`,
      'Payment': `/invoices/payments/${entityId}`,
      'User': `/admin/users/${entityId}`,
      'Clinic': `/admin/clinics/${entityId}`
    };

    const route = routes[entityType];
    if (route) {
      this.router.navigate([route]);
    }
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================

  getActionIcon(actionType: ActionType): string {
    return this.activityService.getActionIcon(actionType);
  }

  getActionColor(actionType: ActionType): string {
    return this.activityService.getActionColor(actionType);
  }

  getActionLabel(actionType: ActionType): string {
    return this.activityService.getActionTypeLabel(actionType);
  }

  getEntityLabel(entityType: string): string {
    return ENTITY_TYPE_LABELS[entityType] || entityType;
  }

  formatTimestamp(timestamp: string): string {
    return this.activityService.formatTimestamp(timestamp);
  }

  getActivityDescription(activity: ActivityLogResponse): string {
    return activity.description || this.buildDescription(activity);
  }

  private buildDescription(activity: ActivityLogResponse): string {
    const action = this.getActionLabel(activity.actionType);
    const entity = this.getEntityLabel(activity.entityType);

    if (activity.entityName) {
      return `${action} ${entity}: ${activity.entityName}`;
    } else {
      return `${action} ${entity}`;
    }
  }

  getUserInitials(fullName: string): string {
    if (!fullName) return '؟';
    const parts = fullName.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return fullName[0].toUpperCase();
  }

  getSuccessIcon(success: boolean): string {
    return success ? 'check_circle' : 'error';
  }

  getSuccessColor(success: boolean): string {
    return success ? 'success' : 'warn';
  }
}
