// ===================================================================
// src/app/features/schedules/components/schedule-list/schedule-list.component.ts
// Schedule List Component - Standalone with new control flow syntax
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
  getDurationConfigTypeLabel // ADD IMPORT
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

  // Filter form
  public filtersForm = this.fb.group({
    search: [''],
    dayOfWeek: [''],
    scheduleType: [''],
    isActive: false
  });

  // Table configuration - UPDATED COLUMNS
  public displayedColumns: string[] = [
    'doctor',
    'day',
    'time',
    'duration', // NEW COLUMN
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

  // Computed properties
  public filteredSchedules = computed(() => {
    const schedules = this.scheduleService.doctorSchedules();
    const filters = this.filtersForm.value;

    return schedules.filter(schedule => {
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        if (!schedule.doctorName.toLowerCase().includes(searchTerm) &&
          !schedule.doctorSpecialization?.toLowerCase().includes(searchTerm)) {
          return false;
        }
      }

      if (filters.dayOfWeek && schedule.dayOfWeek !== filters.dayOfWeek) {
        return false;
      }

      if (filters.scheduleType && schedule.scheduleType !== filters.scheduleType) {
        return false;
      }

      if (filters.isActive !== false && schedule.isActive !== filters.isActive) {
        return false;
      }

      return true;
    });
  });

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

  // ADD HELPER METHOD
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

  private setupFilters(): void {
    this.filtersForm.valueChanges.subscribe(() => {
      this.currentPage.set(0); // Reset to first page when filters change
    });
  }

  public applyFilters(): void {
    // Filters are automatically applied via computed property
    this.notificationService.success('تم تطبيق الفلاتر');
  }

  public resetFilters(): void {
    this.filtersForm.reset();
    this.currentPage.set(0);
    this.notificationService.success('تم مسح الفلاتر');
  }

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
      [ScheduleType.ON_CALL]: 'accent',
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
    return user?.role === 'ADMIN' ||
      user?.role === 'SYSTEM_ADMIN' ||
      (user?.role === 'DOCTOR' && user.id === schedule.doctorId);
  }

  public canDeleteSchedule(schedule: DoctorScheduleResponse): boolean {
    const user = this.currentUser();
    return user?.role === 'ADMIN' || user?.role === 'SYSTEM_ADMIN';
  }

  public checkAvailability(doctorId: number): void {
    this.router.navigate(['/schedules/doctor', doctorId, 'availability']);
  }

  public deleteSchedule(schedule: DoctorScheduleResponse): void {
    const confirmed = confirm(`هل تريد حذف جدولة ${schedule.doctorName} لـ ${this.getDayLabel(schedule.dayOfWeek)}؟`);

    if (confirmed) {
      this.scheduleService.deleteSchedule(schedule.id).subscribe({
        next: () => {
          this.notificationService.success('تم حذف الجدولة بنجاح');
        },
        error: (error) => {
          console.error('Error deleting schedule:', error);
        }
      });
    }
  }
}
