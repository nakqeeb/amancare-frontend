// ===================================================================
// src/app/features/schedules/components/doctor-schedule-detail/doctor-schedule-detail.component.ts
// Doctor Schedule Detail Component - Standalone with new control flow syntax
// ===================================================================
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// Services & Models
import { ScheduleService } from '../../services/schedule.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  DoctorScheduleResponse,
  UnavailabilityResponse,
  DayOfWeek,
  ScheduleType,
  UnavailabilityType,
  DAY_OF_WEEK_ARABIC,
  SCHEDULE_TYPE_ARABIC,
  UNAVAILABILITY_TYPE_ARABIC
} from '../../models/schedule.model';
import { MatInputModule } from "@angular/material/input";
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FormsModule } from '@angular/forms';

interface WeeklyScheduleSummary {
  totalDays: number;
  totalHours: number;
  hasBreaks: boolean;
  isFullTime: boolean;
  scheduleTypes: ScheduleType[];
}

@Component({
  selector: 'app-doctor-schedule-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatTooltipModule,
    MatMenuModule,
    MatDialogModule,
    MatDividerModule,
    MatDatepickerModule,
    HeaderComponent,
    SidebarComponent,
    MatInputModule
],
  templateUrl: './doctor-schedule-detail.component.html',
  styleUrl: './doctor-schedule-detail.component.scss'
})
export class DoctorScheduleDetailComponent implements OnInit {
  readonly scheduleService = inject(ScheduleService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notificationService = inject(NotificationService);

  // Component state
  public readonly doctorId = signal<number>(0);
  public readonly doctorSchedules = this.scheduleService.selectedDoctorSchedules;
  public readonly unavailabilities = this.scheduleService.selectedDoctorUnavailabilities;
  public readonly availableTimeSlots = this.scheduleService.availableTimeSlots;
  public readonly currentUser = this.authService.currentUser;
  public selectedDate = new Date();

  // Computed properties
  public readonly doctorName = computed(() => {
    const schedules = this.doctorSchedules();
    return schedules.length > 0 ? schedules[0].doctorName : '';
  });

  public readonly doctorSpecialization = computed(() => {
    const schedules = this.doctorSchedules();
    return schedules.length > 0 ? schedules[0].doctorSpecialization : '';
  });

  public readonly sortedSchedules = computed(() => {
    const schedules = this.doctorSchedules();
    const dayOrder = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY
    ];

    return schedules.sort((a, b) =>
      dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek)
    );
  });

  public readonly sortedUnavailabilities = computed(() => {
    const unavailabilities = this.unavailabilities();
    return unavailabilities.sort((a, b) =>
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  });

  public readonly weeklySummary = computed((): WeeklyScheduleSummary | null => {
    const schedules = this.doctorSchedules();
    if (schedules.length === 0) return null;

    const activeSchedules = schedules.filter(s => s.isActive);
    const totalHours = activeSchedules.reduce((sum, s) => sum + (s.workingHours || 0), 0);
    const hasBreaks = activeSchedules.some(s => s.breakStartTime && s.breakEndTime);
    const scheduleTypes = [...new Set(activeSchedules.map(s => s.scheduleType))];

    return {
      totalDays: activeSchedules.length,
      totalHours: Math.round(totalHours * 10) / 10,
      hasBreaks,
      isFullTime: totalHours >= 40,
      scheduleTypes
    };
  });

  ngOnInit(): void {
    this.loadDoctorId();
    this.loadDoctorSchedule();
    this.loadUnavailabilities();
    this.loadAvailableTimeSlots();
  }

  private loadDoctorId(): void {
    const id = this.route.snapshot.paramMap.get('doctorId');
    if (id) {
      this.doctorId.set(Number(id));
    } else {
      this.router.navigate(['/schedules']);
    }
  }

  private loadDoctorSchedule(): void {
    const id = this.doctorId();
    if (id) {
      this.scheduleService.getDoctorSchedule(id).subscribe();
    }
  }

  private loadUnavailabilities(): void {
    const id = this.doctorId();
    if (id) {
      // Load unavailabilities for the next 6 months
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 6);

      this.scheduleService.getDoctorUnavailability(
        id,
        startDate,
        endDate.toISOString().split('T')[0]
      ).subscribe();
    }
  }

  private loadAvailableTimeSlots(): void {
    const id = this.doctorId();
    if (id) {
      const dateStr = this.selectedDate.toISOString().split('T')[0];
      this.scheduleService.getAvailableTimeSlots(id, dateStr).subscribe();
    }
  }

  public onDateChange(): void {
    this.loadAvailableTimeSlots();
  }

  public formatTime(time: string): string {
    return time.substring(0, 5); // Format HH:MM
  }

  public getDayLabel(day: DayOfWeek): string {
    return DAY_OF_WEEK_ARABIC[day] || day;
  }

  public getTypeLabel(type: ScheduleType): string {
    return SCHEDULE_TYPE_ARABIC[type] || type;
  }

  public getUnavailabilityTypeLabel(type: UnavailabilityType): string {
    return UNAVAILABILITY_TYPE_ARABIC[type] || type;
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
      [ScheduleType.VACATION_COVER]: 'accent'
    };
    return colors[type] || 'primary';
  }

  public getUnavailabilityTypeColor(type: UnavailabilityType): string {
    const colors: Record<UnavailabilityType, string> = {
      [UnavailabilityType.VACATION]: 'primary',
      [UnavailabilityType.SICK_LEAVE]: 'warn',
      [UnavailabilityType.EMERGENCY]: 'warn',
      [UnavailabilityType.PERSONAL]: 'accent',
      [UnavailabilityType.CONFERENCE]: 'primary',
      [UnavailabilityType.TRAINING]: 'primary',
      [UnavailabilityType.OTHER]: 'accent'
    };
    return colors[type] || 'primary';
  }

  public canManageSchedule(): boolean {
    const user = this.currentUser();
    return user?.role === 'ADMIN' ||
      user?.role === 'SYSTEM_ADMIN' ||
      (user?.role === 'DOCTOR' && user.id === this.doctorId());
  }

  public deleteSchedule(schedule: DoctorScheduleResponse): void {
    const confirmed = confirm(`هل تريد حذف جدولة ${this.getDayLabel(schedule.dayOfWeek)}؟`);

    if (confirmed) {
      this.scheduleService.deleteSchedule(schedule.id).subscribe({
        next: () => {
          this.loadDoctorSchedule(); // Reload schedules
        },
        error: (error) => {
          console.error('Error deleting schedule:', error);
        }
      });
    }
  }

  public deleteUnavailability(unavailability: UnavailabilityResponse): void {
    const confirmed = confirm(`هل تريد حذف فترة عدم التوفر؟`);

    if (confirmed) {
      this.scheduleService.deleteUnavailability(unavailability.id).subscribe({
        next: () => {
          this.loadUnavailabilities(); // Reload unavailabilities
        },
        error: (error) => {
          console.error('Error deleting unavailability:', error);
        }
      });
    }
  }
}
