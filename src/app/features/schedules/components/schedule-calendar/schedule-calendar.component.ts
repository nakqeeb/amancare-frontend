// ===================================================================
// src/app/features/schedules/components/schedule-calendar/schedule-calendar.component.ts
// Schedule Calendar Component - Standalone with new control flow syntax
// ===================================================================
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// Services & Models
import { ScheduleService } from '../../services/schedule.service';
import { UserService } from '../../../users/services/user.service';
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

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  schedules: DoctorScheduleResponse[];
  unavailabilities: UnavailabilityResponse[];
  availableDoctors: number;
  totalSlots: number;
  bookedSlots: number;
}

interface CalendarWeek {
  days: CalendarDay[];
}

interface Doctor {
  id: number;
  fullName: string;
  specialization?: string;
}

@Component({
  selector: 'app-schedule-calendar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatMenuModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './schedule-calendar.component.html',
  styleUrl: './schedule-calendar.component.scss'
})
export class ScheduleCalendarComponent implements OnInit {
  readonly scheduleService = inject(ScheduleService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  // Component state
  public readonly currentDate = signal(new Date());
  public readonly showUnavailabilities = signal(false);
  public readonly doctors = signal<Doctor[]>([]);

  // Filters form
  public filtersForm = this.fb.group({
    doctorId: [''],
    scheduleType: [''],
    monthYear: [new Date()]
  });

  // Available options
  public scheduleTypes = Object.entries(SCHEDULE_TYPE_ARABIC).map(([value, label]) => ({
    value: value as ScheduleType,
    label
  }));

  // Calendar data
  public dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  // Computed properties
  public currentMonthTitle = computed(() => {
    const date = this.currentDate();
    const monthNames = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  });

  public calendarWeeks = computed((): CalendarWeek[] => {
    const currentDate = this.currentDate();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Get first day of month and last day of month
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Get first Sunday of the calendar (might be from previous month)
    const firstCalendarDay = new Date(firstDayOfMonth);
    firstCalendarDay.setDate(firstCalendarDay.getDate() - firstDayOfMonth.getDay());

    // Get last Saturday of the calendar (might be from next month)
    const lastCalendarDay = new Date(lastDayOfMonth);
    lastCalendarDay.setDate(lastCalendarDay.getDate() + (6 - lastDayOfMonth.getDay()));

    const weeks: CalendarWeek[] = [];
    const currentIterationDate = new Date(firstCalendarDay);

    while (currentIterationDate <= lastCalendarDay) {
      const week: CalendarWeek = { days: [] };

      for (let i = 0; i < 7; i++) {
        const day = this.createCalendarDay(new Date(currentIterationDate), month);
        week.days.push(day);
        currentIterationDate.setDate(currentIterationDate.getDate() + 1);
      }

      weeks.push(week);
    }

    return weeks;
  });

  ngOnInit(): void {
    this.loadDoctors();
    this.loadSchedules();
    this.setupFormSubscriptions();
  }

  // private loadDoctors(): void {
  //   this.userService.getDoctors().subscribe({
  //     next: (doctors) => {
  //       this.doctors.set(doctors.map(d => ({
  //         id: d.id,
  //         fullName: d.fullName,
  //         specialization: d.specialization
  //       })));
  //     },
  //     error: (error) => {
  //       console.error('Error loading doctors:', error);
  //     }
  //   });
  // }

  private loadDoctors(): void {
    this.userService.getDoctors().subscribe({
      next: (doctors) => {
        // Filter out doctors without id or fullName, and provide defaults if needed
        const validDoctors = doctors
          .filter(d => d.id !== undefined && d.fullName !== undefined)
          .map(d => ({
            id: d.id as number, // Assert that it's not undefined
            fullName: d.fullName as string, // Assert that it's not undefined
            specialization: d.specialization
          }));

        this.doctors.set(validDoctors);
      },
      error: (error) => {
        console.error('Error loading doctors:', error);
        this.notificationService.error('فشل في تحميل قائمة الأطباء');
      }
    });
  }

  private loadSchedules(): void {
    this.scheduleService.getAllDoctorsSchedules().subscribe();
  }

  private setupFormSubscriptions(): void {
    this.filtersForm.get('monthYear')?.valueChanges.subscribe(date => {
      if (date) {
        this.currentDate.set(new Date(date));
      }
    });
  }

  private createCalendarDay(date: Date, currentMonth: number): CalendarDay {
    const today = new Date();
    const dayOfWeek = this.getDayOfWeekEnum(date.getDay());

    // Get schedules for this day
    const allSchedules = this.scheduleService.doctorSchedules();
    const daySchedules = allSchedules.filter(schedule =>
      schedule.dayOfWeek === dayOfWeek &&
      this.isScheduleActiveOnDate(schedule, date) &&
      this.matchesFilters(schedule)
    );

    // Get unavailabilities for this day (placeholder - would need actual data)
    const dayUnavailabilities: UnavailabilityResponse[] = [];

    return {
      date: new Date(date),
      isCurrentMonth: date.getMonth() === currentMonth,
      isToday: this.isSameDay(date, today),
      isPast: date < today,
      schedules: daySchedules,
      unavailabilities: dayUnavailabilities,
      availableDoctors: new Set(daySchedules.map(s => s.doctorId)).size,
      totalSlots: daySchedules.reduce((sum, s) => sum + (s.totalSlots || 0), 0),
      bookedSlots: 0 // Placeholder
    };
  }

  private getDayOfWeekEnum(dayIndex: number): DayOfWeek {
    const days = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY
    ];
    return days[dayIndex];
  }

  private isScheduleActiveOnDate(schedule: DoctorScheduleResponse, date: Date): boolean {
    if (!schedule.isActive) return false;

    if (schedule.effectiveDate) {
      const effectiveDate = new Date(schedule.effectiveDate);
      if (date < effectiveDate) return false;
    }

    if (schedule.endDate) {
      const endDate = new Date(schedule.endDate);
      if (date > endDate) return false;
    }

    return true;
  }

  private matchesFilters(schedule: DoctorScheduleResponse): boolean {
    const filters = this.filtersForm.value;

    if (filters.doctorId && schedule.doctorId !== Number(filters.doctorId)) {
      return false;
    }

    if (filters.scheduleType && schedule.scheduleType !== filters.scheduleType) {
      return false;
    }

    return true;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  }

  public onFiltersChange(): void {
    // Trigger calendar rebuild with new filters
    this.currentDate.set(new Date(this.currentDate()));
  }

  public onMonthChange(): void {
    const newDate = this.filtersForm.get('monthYear')?.value;
    if (newDate) {
      this.currentDate.set(new Date(newDate));
    }
  }

  public previousMonth(): void {
    const current = this.currentDate();
    const newDate = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    this.currentDate.set(newDate);
    this.filtersForm.get('monthYear')?.setValue(newDate);
  }

  public nextMonth(): void {
    const current = this.currentDate();
    const newDate = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    this.currentDate.set(newDate);
    this.filtersForm.get('monthYear')?.setValue(newDate);
  }

  public goToToday(): void {
    const today = new Date();
    this.currentDate.set(today);
    this.filtersForm.get('monthYear')?.setValue(today);
  }

  public toggleUnavailabilities(): void {
    this.showUnavailabilities.set(!this.showUnavailabilities());
  }

  public getDayTooltip(day: CalendarDay): string {
    const parts: string[] = [];

    if (day.schedules.length > 0) {
      parts.push(`${day.schedules.length} جدولة`);
    }

    if (day.unavailabilities.length > 0) {
      parts.push(`${day.unavailabilities.length} فترة عدم توفر`);
    }

    if (day.availableDoctors > 0) {
      parts.push(`${day.availableDoctors} طبيب متاح`);
    }

    return parts.join(' • ') || 'لا توجد جداول';
  }

  public getScheduleTooltip(schedule: DoctorScheduleResponse): string {
    return `${schedule.doctorName} - ${schedule.startTime.substring(0, 5)} إلى ${schedule.endTime.substring(0, 5)}`;
  }

  public getUnavailabilityTooltip(unavailability: UnavailabilityResponse): string {
    return `${unavailability.doctorName} - ${unavailability.reason}`;
  }

  public getScheduleColor(schedule: DoctorScheduleResponse): string {
    const colors: Record<ScheduleType, string> = {
      [ScheduleType.REGULAR]: '#4caf50',
      [ScheduleType.TEMPORARY]: '#ff9800',
      [ScheduleType.EMERGENCY]: '#f44336',
      [ScheduleType.ON_CALL]: '#9c27b0',
      [ScheduleType.VACATION_COVER]: '#2196f3'
    };
    return colors[schedule.scheduleType] || '#4caf50';
  }

  public getUnavailabilityColor(unavailability: UnavailabilityResponse): string {
    const colors: Record<UnavailabilityType, string> = {
      [UnavailabilityType.VACATION]: '#ff5722',
      [UnavailabilityType.SICK_LEAVE]: '#e91e63',
      [UnavailabilityType.EMERGENCY]: '#f44336',
      [UnavailabilityType.PERSONAL]: '#9c27b0',
      [UnavailabilityType.CONFERENCE]: '#3f51b5',
      [UnavailabilityType.TRAINING]: '#009688',
      [UnavailabilityType.OTHER]: '#607d8b'
    };
    return colors[unavailability.unavailabilityType] || '#ff5722';
  }

  public onDayClick(day: CalendarDay): void {
    if (day.schedules.length > 0 || day.unavailabilities.length > 0) {
      // Here you would typically open a dialog or navigate to a detailed view
      console.log('Day clicked:', day);
      this.notificationService.info(`تم النقر على ${day.date.toLocaleDateString('ar-SA')}`);
    }
  }
}
