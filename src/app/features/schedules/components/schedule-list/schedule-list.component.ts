// ===================================================================
// src/app/features/schedules/components/schedule-list/schedule-list.component.ts
// Schedule List Component - FIXED VERSION with working filters and pagination
// ===================================================================
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// Services & Models
import { ScheduleService } from '../../services/schedule.service';
import { AuthService, User } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  DoctorScheduleResponse,
  DayOfWeek,
  ScheduleType,
  DAY_OF_WEEK_ARABIC,
  SCHEDULE_TYPE_ARABIC,
  ScheduleSearchCriteria,
  getDurationConfigTypeLabel
} from '../../models/schedule.model';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-schedule-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDividerModule,
    MatDialogModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './schedule-list.component.html',
  styleUrl: './schedule-list.component.scss'
})
export class ScheduleListComponent implements OnInit {
  readonly scheduleService = inject(ScheduleService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  // Component state
  public readonly currentUser = this.authService.currentUser;
  public readonly pageSize = signal(10);
  public readonly currentPage = signal(0);

  // Filter form - FIXED: Initialize isActive as null (not false)
  public filtersForm = this.fb.group({
    search: [''],
    dayOfWeek: [''],
    scheduleType: [''],
    isActive: [null as boolean | null]  // FIXED: Changed from false to null
  });

  // Table configuration
  public displayedColumns: string[] = [
    'doctor',
    'day',
    'time',
    'duration',
    'type',
    'hours',
    'status',
    'actions'
  ];

  // Options for dropdowns
  public daysOfWeek = Object.entries(DAY_OF_WEEK_ARABIC).map(([value, label]) => ({
    value,
    label
  }));

  public scheduleTypes = Object.entries(SCHEDULE_TYPE_ARABIC).map(([value, label]) => ({
    value,
    label
  }));

  // Computed properties - FIXED: Corrected filter logic
  public filteredSchedules = computed(() => {
    const schedules = this.scheduleService.doctorSchedules();
    const filters = this.filtersForm.value;

    return schedules.filter(schedule => {
      // Search filter - check both doctor name and specialization
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase().trim();
        const doctorName = schedule.doctorName?.toLowerCase() || '';
        const doctorSpec = schedule.doctorSpecialization?.toLowerCase() || '';

        if (!doctorName.includes(searchTerm) && !doctorSpec.includes(searchTerm)) {
          return false;
        }
      }

      // Day of week filter
      if (filters.dayOfWeek && filters.dayOfWeek !== '') {
        if (schedule.dayOfWeek !== filters.dayOfWeek) {
          return false;
        }
      }

      // Schedule type filter
      if (filters.scheduleType && filters.scheduleType !== '') {
        if (schedule.scheduleType !== filters.scheduleType) {
          return false;
        }
      }

      // FIXED: Active status filter - corrected logic
      if (filters.isActive !== null && filters.isActive !== undefined) {
        if (schedule.isActive !== filters.isActive) {
          return false;
        }
      }

      return true;
    });
  });

  // FIXED: Pagination computed property
  public paginatedSchedules = computed(() => {
    const filtered = this.filteredSchedules();
    const start = this.currentPage() * this.pageSize();
    const end = start + this.pageSize();
    return filtered.slice(start, end);
  });

  public totalSchedules = computed(() => this.filteredSchedules().length);

  public activeDoctors = computed(() => {
    const schedules = this.filteredSchedules();
    const activeDoctorIds = new Set(
      schedules.filter(s => s.isActive).map(s => s.doctorId)
    );
    return activeDoctorIds.size;
  });

  public totalWorkingHours = computed(() => {
    const totalMinutes = this.filteredSchedules()
      .reduce((sum, s) => sum + (s.availableWorkingMinutes || 0), 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);

    return `${hours} ساعة${hours !== 1 ? '' : ''}${minutes ? ` و ${minutes} دقيقة` : ''}`;
  });

  // Helper method for duration config type label
  getDurationConfigTypeLabel(type: string): string {
    return getDurationConfigTypeLabel(type);
  }

  formatDuration(totalMinutes: number): string {
    if (!totalMinutes || totalMinutes <= 0) return '0 دقيقة';

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const hourLabel =
      hours === 0
        ? ''
        : hours === 1
          ? 'ساعة'
          : hours === 2
            ? 'ساعتان'
            : 'ساعات';

    const minuteLabel =
      minutes === 0
        ? ''
        : minutes === 1
          ? 'دقيقة'
          : minutes === 2
            ? 'دقيقتان'
            : 'دقائق';

    if (hours > 0 && minutes > 0)
      return `${hours} ${hourLabel} و ${minutes} ${minuteLabel}`;
    if (hours > 0)
      return `${hours} ${hourLabel}`;
    return `${minutes} ${minuteLabel}`;
  }

  ngOnInit(): void {
    this.loadSchedules();
    this.setupFilters();
  }

  private loadSchedules(): void {
    this.scheduleService.getAllDoctorsSchedules().subscribe();
  }

  // FIXED: Setup filters to reset page when filter changes
  private setupFilters(): void {
    this.filtersForm.valueChanges.subscribe(() => {
      this.currentPage.set(0); // Reset to first page when filters change
    });
  }

  public applyFilters(): void {
    const formValues = this.filtersForm.value;

    // Build search criteria from form values
    const criteria: ScheduleSearchCriteria = {};

    if (formValues.search) {
      criteria.searchTerm = formValues.search;
    }

    if (formValues.dayOfWeek) {
      criteria.dayOfWeek = formValues.dayOfWeek as DayOfWeek;
    }

    if (formValues.scheduleType) {
      criteria.scheduleType = formValues.scheduleType as ScheduleType;
    }

    // Handle isActive checkbox
    if (formValues.isActive) {
      criteria.isActive = true;
    }

    // If no filters are applied, load all schedules
    const hasFilters = Object.keys(criteria).length > 0;

    if (hasFilters) {
      // Use search endpoint with filters
      this.scheduleService.searchSchedules(criteria).subscribe({
        next: () => {
          this.currentPage.set(0); // Reset to first page
          this.notificationService.success('تم تطبيق الفلاتر');
        },
        error: (error) => {
          console.error('Error applying filters:', error);
          this.notificationService.error('فشل في تطبيق الفلاتر');
        }
      });
    } else {
      // Load all schedules if no filters
      this.loadSchedules();
      this.notificationService.success('تم مسح الفلاتر');
    }
  }

  public resetFilters(): void {
    this.filtersForm.reset();
    this.currentPage.set(0);
    this.loadSchedules(); // Reload all schedules
    this.notificationService.success('تم مسح الفلاتر');
  }

  // FIXED: Page change handler
  public onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  public getDayLabel(day: DayOfWeek): string {
    return DAY_OF_WEEK_ARABIC[day] || day;
  }

  public getTypeLabel(type: ScheduleType): string {
    return SCHEDULE_TYPE_ARABIC[type] || type;
  }

  public getDayColor(day: DayOfWeek): string {
    const colors: Record<DayOfWeek, string> = {
      [DayOfWeek.FRIDAY]: 'accent',
      [DayOfWeek.SATURDAY]: 'accent',
      [DayOfWeek.SUNDAY]: 'primary',
      [DayOfWeek.MONDAY]: 'primary',
      [DayOfWeek.TUESDAY]: 'primary',
      [DayOfWeek.WEDNESDAY]: 'primary',
      [DayOfWeek.THURSDAY]: 'primary'
    };
    return colors[day] || 'primary';
  }

  public getTypeColor(type: ScheduleType): string {
    const colors: Record<ScheduleType, string> = {
      [ScheduleType.REGULAR]: 'primary',
      [ScheduleType.TEMPORARY]: 'accent',
      [ScheduleType.EMERGENCY]: 'warn',
      [ScheduleType.HOLIDAY_COVERAGE]: 'accent'
    };
    return colors[type] || 'primary';
  }

  public formatTime(time: string): string {
    return time.substring(0, 5); // Format HH:MM
  }

  public canCreateSchedule(): boolean {
    const user = this.currentUser();
    return user?.role === 'ADMIN' || user?.role === 'SYSTEM_ADMIN';
  }

  public canEditSchedule(schedule: DoctorScheduleResponse): boolean {
    const user = this.currentUser();
    if (!user) return false;

    // System admin and admin can edit any schedule
    if (user.role === 'SYSTEM_ADMIN' || user.role === 'ADMIN') {
      return true;
    }

    // Doctors can only edit their own schedules
    return user.role === 'DOCTOR' && user.id === schedule.doctorId;
  }

  public canDeleteSchedule(schedule: DoctorScheduleResponse): boolean {
    const user = this.currentUser();
    return user?.role === 'ADMIN' || user?.role === 'SYSTEM_ADMIN';
  }

  public editSchedule(schedule: DoctorScheduleResponse): void {
    if (!this.canEditSchedule(schedule)) {
      this.notificationService.error('ليس لديك صلاحية لتعديل هذا الجدول');
      return;
    }
    this.router.navigate(['/schedules/edit', schedule.id]);
  }

  public viewSchedule(schedule: DoctorScheduleResponse): void {
    this.router.navigate(['/schedules', schedule.id]);
  }

  public toggleScheduleStatus(schedule: DoctorScheduleResponse): void {
    if (!this.canEditSchedule(schedule)) {
      this.notificationService.error('ليس لديك صلاحية لتعديل حالة هذا الجدول');
      return;
    }

    const action = schedule.isActive ? 'تعطيل' : 'تفعيل';
    const confirmMessage = `هل أنت متأكد من ${action} هذا الجدول؟`;

    if (confirm(confirmMessage)) {
      if (schedule.isActive) {
        this.scheduleService.deactivateSchedule(schedule.id).subscribe({
          next: () => {
            this.notificationService.success('تم تعطيل الجدول بنجاح');
            this.loadSchedules();
          },
          error: (error) => {
            console.error('Error deactivating schedule:', error);
            this.notificationService.error('فشل في تعطيل الجدول');
          }
        });
      } else {
        this.scheduleService.activateSchedule(schedule.id).subscribe({
          next: () => {
            this.notificationService.success('تم تفعيل الجدول بنجاح');
            this.loadSchedules();
          },
          error: (error) => {
            console.error('Error activating schedule:', error);
            this.notificationService.error('فشل في تفعيل الجدول');
          }
        });
      }
    }
  }

  public deleteSchedule(schedule: DoctorScheduleResponse): void {
    if (!this.canDeleteSchedule(schedule)) {
      this.notificationService.error('ليس لديك صلاحية لحذف هذا الجدول');
      return;
    }

    const confirmMessage = `هل أنت متأكد من حذف جدول ${schedule.doctorName} - ${this.getDayLabel(schedule.dayOfWeek)}؟`;

    if (confirm(confirmMessage)) {
      this.scheduleService.deleteSchedule(schedule.id).subscribe({
        next: () => {
          this.notificationService.success('تم حذف الجدول بنجاح');
          this.loadSchedules();
        },
        error: (error) => {
          console.error('Error deleting schedule:', error);
          this.notificationService.error('فشل في حذف الجدول');
        }
      });
    }
  }

  public cloneSchedule(schedule: DoctorScheduleResponse): void {
    if (!this.canCreateSchedule()) {
      this.notificationService.error('ليس لديك صلاحية لنسخ الجدول');
      return;
    }

    // Navigate to create form with query params to pre-fill data
    this.router.navigate(['/schedules/create'], {
      queryParams: {
        cloneFrom: schedule.id
      }
    });
  }
}
