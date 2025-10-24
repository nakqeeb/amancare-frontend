import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { ScheduleService } from '../../services/schedule.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  DoctorScheduleResponse,
  DayOfWeek,
  getDurationConfigTypeLabel,
  DurationConfigType
} from '../../models/schedule.model';
import { MatChipsModule } from '@angular/material/chips';
import { UserService } from '../../../users/services/user.service';
import { MatDivider } from "@angular/material/divider";
import { getDayOfWeekLabel } from '../../../guest-booking/models/guest-booking.model';

interface CalendarDay {
  date: Date;
  dayOfWeek: DayOfWeek;
  isCurrentMonth: boolean;
  isToday: boolean;
  schedules: DoctorScheduleResponse[];
  hasSchedules: boolean;
}

interface WeekScheduleSummary {
  doctorId: number;
  doctorName: string;
  doctorSpecialization?: string;
  schedules: Map<DayOfWeek, DoctorScheduleResponse>;
  totalHours: number;
  totalSlots: number;
  averageDuration: number;
}

@Component({
  selector: 'app-schedule-calendar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatBadgeModule,
    MatDialogModule,
    HeaderComponent,
    SidebarComponent,
    MatDivider
],
  templateUrl: './schedule-calendar.component.html',
  styleUrl: './schedule-calendar.component.scss'
})
export class ScheduleCalendarComponent implements OnInit {
  private readonly scheduleService = inject(ScheduleService);
  private readonly userService = inject(UserService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  // State signals
  public readonly loading = signal(false);
  public readonly currentDate = signal(new Date());
  public readonly selectedDate = signal<Date | null>(null);
  public readonly viewMode = signal<'month' | 'week' | 'list'>('month');
  public readonly selectedDoctorId = signal<number | null>(null);

  // Data signals
  public readonly doctors = signal<any[]>([]);
  public readonly schedules = signal<DoctorScheduleResponse[]>([]);
  public readonly calendarDays = signal<CalendarDay[]>([]);
  public readonly weekSchedules = signal<WeekScheduleSummary[]>([]);

  // Computed values
  public readonly currentMonthYear = computed(() => {
    const date = this.currentDate();
    return date.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });
  });

  public readonly filteredSchedules = computed(() => {
    const doctorId = this.selectedDoctorId();
    const allSchedules = this.schedules();

    if (!doctorId) return allSchedules;
    return allSchedules.filter(s => s.doctorId === doctorId);
  });

  public readonly scheduleStats = computed(() => {
    const schedules = this.filteredSchedules();

    return {
      totalSchedules: schedules.length,
      activeDoctors: new Set(schedules.map(s => s.doctorId)).size,
      totalWorkingHours: schedules.reduce((sum, s) => sum + (s.workingHours || 0), 0),
      totalSlots: schedules.reduce((sum, s) => sum + (s.expectedTokens || 0), 0),
      averageDuration: schedules.length > 0
        ? Math.round(schedules.reduce((sum, s) => sum + (s.effectiveDuration || 0), 0) / schedules.length)
        : 0,
      directConfig: schedules.filter(s => s.durationConfigType === 'DIRECT').length,
      tokenBased: schedules.filter(s => s.durationConfigType === 'TOKEN_BASED').length
    };
  });

  // Day of week labels
  public readonly weekDays = [
    { value: DayOfWeek.SUNDAY, label: 'الأحد' },
    { value: DayOfWeek.MONDAY, label: 'الاثنين' },
    { value: DayOfWeek.TUESDAY, label: 'الثلاثاء' },
    { value: DayOfWeek.WEDNESDAY, label: 'الأربعاء' },
    { value: DayOfWeek.THURSDAY, label: 'الخميس' },
    { value: DayOfWeek.FRIDAY, label: 'الجمعة' },
    { value: DayOfWeek.SATURDAY, label: 'السبت' }
  ];

  ngOnInit(): void {
    this.loadDoctors();
    this.loadSchedules();
    this.generateCalendar();
  }

  private loadDoctors(): void {
    this.userService.getDoctors().subscribe({
      next: (response) => {
        this.doctors.set(response.data || []);
      },
      error: (error) => {
        console.error('Error loading doctors:', error);
      }
    });
  }

  private loadSchedules(): void {
    this.loading.set(true);
    this.scheduleService.getAllDoctorsSchedules().subscribe({
      next: (schedules) => {
        this.schedules.set(schedules);
        this.generateCalendar();
        this.generateWeekSchedules();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading schedules:', error);
        this.loading.set(false);
      }
    });
  }

  private generateCalendar(): void {
    const current = this.currentDate();
    const year = current.getFullYear();
    const month = current.getMonth();

    // Get first day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Get starting point (previous Sunday)
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());

    // Generate calendar days (6 weeks)
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const dayOfWeek = this.getDayOfWeekEnum(date);
      const daySchedules = this.getSchedulesForDay(dayOfWeek);

      days.push({
        date: date,
        dayOfWeek: dayOfWeek,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.getTime() === today.getTime(),
        schedules: daySchedules,
        hasSchedules: daySchedules.length > 0
      });
    }

    this.calendarDays.set(days);
  }

  private generateWeekSchedules(): void {
    const schedules = this.filteredSchedules();
    const doctorMap = new Map<number, WeekScheduleSummary>();

    schedules.forEach(schedule => {
      if (!doctorMap.has(schedule.doctorId)) {
        doctorMap.set(schedule.doctorId, {
          doctorId: schedule.doctorId,
          doctorName: schedule.doctorName,
          doctorSpecialization: schedule.doctorSpecialization,
          schedules: new Map(),
          totalHours: 0,
          totalSlots: 0,
          averageDuration: 0
        });
      }

      const summary = doctorMap.get(schedule.doctorId)!;
      summary.schedules.set(schedule.dayOfWeek as DayOfWeek, schedule);
      summary.totalHours += schedule.workingHours || 0;
      summary.totalSlots += schedule.expectedTokens || 0;
    });

    // Calculate average duration
    doctorMap.forEach(summary => {
      const schedulesCount = summary.schedules.size;
      if (schedulesCount > 0) {
        const totalDuration = Array.from(summary.schedules.values())
          .reduce((sum, s) => sum + (s.effectiveDuration || 0), 0);
        summary.averageDuration = Math.round(totalDuration / schedulesCount);
      }
    });

    this.weekSchedules.set(Array.from(doctorMap.values()));
  }

  private getDayOfWeekEnum(date: Date): DayOfWeek {
    const days = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY
    ];
    return days[date.getDay()];
  }

  private getSchedulesForDay(dayOfWeek: DayOfWeek): DoctorScheduleResponse[] {
    return this.filteredSchedules().filter(s => s.dayOfWeek === dayOfWeek);
  }

  // Navigation methods
  public previousMonth(): void {
    const current = this.currentDate();
    const newDate = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    this.currentDate.set(newDate);
    this.generateCalendar();
  }

  public nextMonth(): void {
    const current = this.currentDate();
    const newDate = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    this.currentDate.set(newDate);
    this.generateCalendar();
  }

  public goToToday(): void {
    this.currentDate.set(new Date());
    this.generateCalendar();
  }

  public changeViewMode(mode: 'month' | 'week' | 'list'): void {
    this.viewMode.set(mode);
  }

  public onDoctorFilterChange(doctorId: number | null): void {
    this.selectedDoctorId.set(doctorId);
    this.generateCalendar();
    this.generateWeekSchedules();
  }

  public selectDay(day: CalendarDay): void {
    this.selectedDate.set(day.date);
    // You can open a dialog or navigate to day view
  }

  public getDayLabel(dayOfWeek: DayOfWeek): string {
    return getDayOfWeekLabel(dayOfWeek);
  }

  public getDurationConfigLabel(type: string): string {
    return getDurationConfigTypeLabel(type);
  }

  public getScheduleColorClass(schedule: DoctorScheduleResponse): string {
    if (!schedule.isActive) return 'inactive';
    if (schedule.durationConfigType === 'TOKEN_BASED') return 'token-based';
    return 'direct';
  }

  public formatTime(time: string): string {
    return time.substring(0, 5); // HH:mm
  }

  public formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0 && mins > 0) {
      return `${hours}س ${mins}د`;
    } else if (hours > 0) {
      return `${hours}س`;
    } else {
      return `${mins}د`;
    }
  }

  // Action methods
  public editSchedule(scheduleId: number, event: Event): void {
    event.stopPropagation();
    // Navigate to edit form
  }

  public viewScheduleDetails(schedule: DoctorScheduleResponse, event: Event): void {
    event.stopPropagation();
    // Open details dialog
  }

  public cloneSchedule(schedule: DoctorScheduleResponse, event: Event): void {
    event.stopPropagation();
    // Open clone dialog
  }

  public deactivateSchedule(scheduleId: number, event: Event): void {
    event.stopPropagation();
    if (confirm('هل أنت متأكد من تعطيل هذا الجدول؟')) {
      this.scheduleService.deactivateSchedule(scheduleId).subscribe({
        next: () => {
          this.notificationService.success('تم تعطيل الجدول بنجاح');
          this.loadSchedules();
        },
        error: (error) => {
          console.error('Error deactivating schedule:', error);
        }
      });
    }
  }

  public getSchedulesByDoctor(doctorId: number): DoctorScheduleResponse[] {
    return this.filteredSchedules().filter(s => s.doctorId === doctorId);
  }

  public hasScheduleOnDay(summary: WeekScheduleSummary, day: DayOfWeek): boolean {
    return summary.schedules.has(day);
  }

  public getScheduleForDay(summary: WeekScheduleSummary, day: DayOfWeek): DoctorScheduleResponse | undefined {
    return summary.schedules.get(day);
  }
}
