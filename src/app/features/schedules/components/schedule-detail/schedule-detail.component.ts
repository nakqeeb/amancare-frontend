import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
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
import { getDayOfWeekLabel } from '../../../guest-booking/models/guest-booking.model';

interface TimeSlotInfo {
  time: string;
  tokenNumber: number;
  isBreakTime: boolean;
  isAvailable: boolean;
}

@Component({
  selector: 'app-schedule-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTableModule,
    MatDialogModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './schedule-detail.component.html',
  styleUrl: './schedule-detail.component.scss'
})
export class ScheduleDetailComponent implements OnInit {
  private readonly scheduleService = inject(ScheduleService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);

  // State signals
  public readonly loading = signal(false);
  public readonly scheduleId = signal<number | null>(null);
  public readonly schedule = signal<DoctorScheduleResponse | null>(null);
  public readonly timeSlots = signal<TimeSlotInfo[]>([]);

  // Computed values
  public readonly isTokenBased = computed(() => {
    const schedule = this.schedule();
    return schedule?.durationConfigType === 'TOKEN_BASED';
  });

  public readonly isDirect = computed(() => {
    const schedule = this.schedule();
    return schedule?.durationConfigType === 'DIRECT';
  });

  public readonly isActive = computed(() => {
    return this.schedule()?.isActive ?? false;
  });

  public readonly hasBreak = computed(() => {
    const schedule = this.schedule();
    return !!(schedule?.breakStartTime && schedule?.breakEndTime);
  });

  public readonly scheduleColorClass = computed(() => {
    const schedule = this.schedule();
    if (!schedule) return '';

    if (!schedule.isActive) return 'inactive';
    if (schedule.durationConfigType === 'TOKEN_BASED') return 'token-based';
    return 'direct';
  });

  public readonly workingMinutesBreakdown = computed(() => {
    const schedule = this.schedule();
    if (!schedule) return null;

    const totalMinutes = this.calculateTotalMinutes(
      schedule.startTime,
      schedule.endTime
    );

    const breakMinutes = this.hasBreak() && schedule.breakStartTime && schedule.breakEndTime
      ? this.calculateTotalMinutes(schedule.breakStartTime, schedule.breakEndTime)
      : 0;

    const workingMinutes = totalMinutes - breakMinutes;

    return {
      total: totalMinutes,
      break: breakMinutes,
      working: workingMinutes,
      slots: schedule.expectedTokens || 0,
      duration: schedule.effectiveDuration || 0
    };
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.scheduleId.set(parseInt(id, 10));
      this.loadSchedule(parseInt(id, 10));
    } else {
      this.notificationService.error('معرف الجدول غير موجود');
      this.router.navigate(['/schedules']);
    }
  }

  private loadSchedule(scheduleId: number): void {
    this.loading.set(true);
    this.scheduleService.getDurationInfo(scheduleId).subscribe({
      next: (schedule) => {
        this.schedule.set(schedule);
        this.generateTimeSlots(schedule);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading schedule:', error);
        this.notificationService.error('فشل في تحميل تفاصيل الجدول');
        this.loading.set(false);
      }
    });
  }

  private generateTimeSlots(schedule: DoctorScheduleResponse): void {
    if (!schedule.effectiveDuration || !schedule.startTime || !schedule.endTime) {
      return;
    }

    const slots: TimeSlotInfo[] = [];
    const duration = schedule.effectiveDuration;

    let currentTime = this.parseTime(schedule.startTime);
    const endTime = this.parseTime(schedule.endTime);
    const breakStart = schedule.breakStartTime ? this.parseTime(schedule.breakStartTime) : null;
    const breakEnd = schedule.breakEndTime ? this.parseTime(schedule.breakEndTime) : null;

    // Calculate availability ratio if we have the data
    const totalSlots = schedule.totalSlots || schedule.expectedTokens || 0;
    const availableSlots = schedule.availableSlots ?? totalSlots;
    const bookedSlots = totalSlots - availableSlots;

    // Create a simple availability distribution
    // If we have 10 total slots and 3 are booked, mark every 3rd or 4th slot as unavailable
    const availabilityPattern = totalSlots > 0 ? Math.floor(totalSlots / Math.max(bookedSlots, 1)) : 0;

    let tokenNumber = 1;
    let slotIndex = 0;

    while (this.compareTime(currentTime, endTime) < 0) {
      const timeStr = this.formatTimeObject(currentTime);
      const nextTime = this.addMinutes(currentTime, duration);

      // Check if this slot falls within break time
      const isBreakTime = breakStart && breakEnd &&
        this.compareTime(currentTime, breakStart) >= 0 &&
        this.compareTime(currentTime, breakEnd) < 0;

      // Determine availability based on the pattern or if it's break time
      let isAvailable = !isBreakTime; // Break time slots are not available

      if (!isBreakTime && availabilityPattern > 0 && bookedSlots > 0) {
        // Distribute unavailable slots evenly across the day
        // This is a simple approximation since we don't have per-slot data
        isAvailable = (slotIndex % availabilityPattern) !== 0;
      }

      // Add all slots, including break time slots
      slots.push({
        time: timeStr,
        tokenNumber: isBreakTime ? 0 : tokenNumber++, // Don't increment token for break slots
        isBreakTime: isBreakTime!,
        isAvailable: isAvailable
      });

      currentTime = nextTime;
      slotIndex++;

      // Break if we've reached or passed the end time
      if (this.compareTime(currentTime, endTime) >= 0) {
        break;
      }
    }

    // If we have actual availability data and it's less than what we generated,
    // mark some slots as unavailable more accurately
    if (availableSlots < slots.filter(s => !s.isBreakTime).length) {
      const nonBreakSlots = slots.filter(s => !s.isBreakTime);
      const slotsToMarkUnavailable = nonBreakSlots.length - availableSlots;

      if (slotsToMarkUnavailable > 0) {
        // Mark slots as unavailable in a distributed pattern
        const step = Math.floor(nonBreakSlots.length / slotsToMarkUnavailable);
        let markedCount = 0;

        for (let i = 0; i < slots.length && markedCount < slotsToMarkUnavailable; i++) {
          if (!slots[i].isBreakTime && (i % step === 0 || (nonBreakSlots.length - markedCount) === (slots.length - i))) {
            slots[i].isAvailable = false;
            markedCount++;
          }
        }
      }
    }

    this.timeSlots.set(slots);
  }

  private parseTime(timeStr: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  }

  private formatTimeObject(time: { hours: number; minutes: number }): string {
    return `${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}`;
  }

  private addMinutes(time: { hours: number; minutes: number }, minutes: number): { hours: number; minutes: number } {
    let totalMinutes = time.hours * 60 + time.minutes + minutes;
    return {
      hours: Math.floor(totalMinutes / 60),
      minutes: totalMinutes % 60
    };
  }

  private compareTime(time1: { hours: number; minutes: number }, time2: { hours: number; minutes: number }): number {
    const minutes1 = time1.hours * 60 + time1.minutes;
    const minutes2 = time2.hours * 60 + time2.minutes;
    return minutes1 - minutes2;
  }

  private calculateTotalMinutes(startTime: string, endTime: string): number {
    const start = this.parseTime(startTime);
    const end = this.parseTime(endTime);

    const startMinutes = start.hours * 60 + start.minutes;
    const endMinutes = end.hours * 60 + end.minutes;

    return endMinutes - startMinutes;
  }

  // Helper methods
  public getDayLabel(dayOfWeek: DayOfWeek): string {
    return getDayOfWeekLabel(dayOfWeek);
  }

  public getDurationConfigLabel(type: string): string {
    return getDurationConfigTypeLabel(type);
  }

  public getScheduleTypeLabel(type: string): string {
    return this.getScheduleTypeLabel(type);
  }

  public formatTime(time: string): string {
    return time.substring(0, 5); // HH:mm
  }

  public formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0 && mins > 0) {
      return `${hours} ساعة ${mins} دقيقة`;
    } else if (hours > 0) {
      return `${hours} ساعة`;
    } else {
      return `${mins} دقيقة`;
    }
  }

  public formatDate(dateStr: string): string {
    if (!dateStr) return 'غير محدد';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Action methods
  public editSchedule(): void {
    this.router.navigate(['/schedules/edit', this.scheduleId()]);
  }

  public cloneSchedule(): void {
    // Open clone dialog
    this.notificationService.info('سيتم إضافة وظيفة النسخ قريباً');
  }

  public deactivateSchedule(): void {
    if (!confirm('هل أنت متأكد من تعطيل هذا الجدول؟')) {
      return;
    }

    const scheduleId = this.scheduleId();
    if (!scheduleId) return;

    this.scheduleService.deactivateSchedule(scheduleId).subscribe({
      next: () => {
        this.notificationService.success('تم تعطيل الجدول بنجاح');
        this.router.navigate(['/schedules']);
      },
      error: (error) => {
        console.error('Error deactivating schedule:', error);
      }
    });
  }

  public goBack(): void {
    this.router.navigate(['/schedules']);
  }

  public printSchedule(): void {
    window.print();
  }
}
