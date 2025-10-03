// =============================================================================
// Activities List Component - مكون قائمة الأنشطة
// src/app/features/admin/components/activities-list/activities-list.component.ts
// =============================================================================

import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime } from 'rxjs';

import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { ActivityService } from '../../services/activity.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  ActivityLogResponse,
  ActivitySearchFilters,
  ActionType,
  EntityType,
  ACTION_TYPE_LABELS,
  ENTITY_TYPE_LABELS
} from '../../models/activity.model';
import { HeaderComponent } from "../../../../shared/components/header/header.component";
import { NotificationService } from '../../../../core/services/notification.service';

/**
 * مكون قائمة الأنشطة الكاملة
 * Full Activities List Component
 */
@Component({
  selector: 'app-activities-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SidebarComponent,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    MatProgressBarModule,
    HeaderComponent
],
  templateUrl: './activities-list.component.html',
  styleUrls: ['./activities-list.component.scss']
})
export class ActivitiesListComponent implements OnInit, OnDestroy {
  private activityService = inject(ActivityService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  // ===================================================================
  // STATE
  // ===================================================================

  activities = signal<ActivityLogResponse[]>([]);
  loading = signal(false);
  totalElements = 0;
  pageSize = 20;
  pageIndex = 0;

  // Filter form
  filterForm!: FormGroup;

  // Table columns
  displayedColumns: string[] = [
    'icon',
    'description',
    'actionType',
    'entityType',
    'user',
    'timestamp',
    'status',
    'actions'
  ];

  // Enum values for template
  actionTypes = Object.values(ActionType);
  entityTypes = Object.values(EntityType);
  actionTypeLabels = ACTION_TYPE_LABELS;
  entityTypeLabels = ENTITY_TYPE_LABELS;

  // Current user
  currentUser = this.authService.currentUser;

  // ===================================================================
  // COMPUTED VALUES
  // ===================================================================

  hasActivities = computed(() => this.activities().length > 0);
  isEmpty = computed(() => !this.loading() && this.activities().length === 0);

  // ===================================================================
  // LIFECYCLE HOOKS
  // ===================================================================

  ngOnInit(): void {
    this.initializeFilterForm();
    this.setupFilterWatchers();
    this.loadActivities();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===================================================================
  // INITIALIZATION
  // ===================================================================

  initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      searchTerm: [''],
      actionType: [null],
      entityType: [null],
      startDate: [null],
      endDate: [null]
    });
  }

  setupFilterWatchers(): void {
    // Watch for filter changes with debounce
    this.filterForm.valueChanges
      .pipe(
        debounceTime(500),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.pageIndex = 0; // Reset to first page on filter change
        this.loadActivities();
      });
  }

  // ===================================================================
  // DATA LOADING
  // ===================================================================

  loadActivities(): void {
    this.loading.set(true);

    const filters: ActivitySearchFilters = {
      searchTerm: this.filterForm.value.searchTerm || undefined,
      actionType: this.filterForm.value.actionType || undefined,
      entityType: this.filterForm.value.entityType || undefined,
      startDate: this.filterForm.value.startDate || undefined,
      endDate: this.filterForm.value.endDate || undefined,
      page: this.pageIndex,
      size: this.pageSize,
      sortBy: 'timestamp',
      sortDirection: 'DESC'
    };

    this.activityService.searchActivities(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.activities.set(response.data.content);
            this.totalElements = response.data.totalElements;
          }
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading activities:', error);
          this.loading.set(false);
        }
      });
  }

  // ===================================================================
  // FILTER ACTIONS
  // ===================================================================

  applyFilters(): void {
    this.pageIndex = 0;
    this.loadActivities();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.pageIndex = 0;
    this.loadActivities();
  }

  // ===================================================================
  // PAGINATION
  // ===================================================================

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadActivities();
  }

  // ===================================================================
  // NAVIGATION
  // ===================================================================

  viewActivityDetails(activity: ActivityLogResponse): void {
    // Edited: Don't navigate for authentication activities
    if (activity.entityType === 'Authentication' || activity.entityType === 'Registration') {
      // Authentication activities don't have a detail page
      return;
    }
    // End of edit

    if (activity.entityType && activity.entityId) {
      this.navigateToEntity(activity.entityType, activity.entityId);
    }
  }

  viewEntityTrail(activity: ActivityLogResponse): void {
    // Edited: Don't show trail for authentication activities
    if (activity.entityType === 'Authentication' || activity.entityType === 'Registration') {
      this.notificationService.info('لا يوجد سجل نشاط لعمليات تسجيل الدخول');
      return;
    }
    // End of edit

    if (activity.entityType && activity.entityId) {
      this.router.navigate(['/admin/activities/entity', activity.entityType, activity.entityId]);
    }
  }

  navigateToUserProfile(userId: number): void {
    this.router.navigate(['/users/profile', userId]);
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

  viewStatistics(): void {
    this.router.navigate(['/admin/activities/statistics']);
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
    const date = new Date(timestamp);
    return date.toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getRelativeTime(timestamp: string): string {
    return this.activityService.formatTimestamp(timestamp);
  }

  refresh(): void {
    this.loadActivities();
  }
}
