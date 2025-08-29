// ===================================================================
// 1. APPOINTMENT CALENDAR COMPONENT
// src/app/features/appointments/components/appointment-calendar/appointment-calendar.component.ts
// ===================================================================
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { FormsModule } from '@angular/forms';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// Services & Models
import { AppointmentService } from '../../services/appointment.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  Appointment,
  AppointmentStatus,
  AppointmentType
} from '../../models/appointment.model';

interface CalendarDay {
  date: Date;
  day: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  appointments: Appointment[];
}

interface CalendarWeek {
  days: CalendarDay[];
}

@Component({
  selector: 'app-appointment-calendar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    MatBadgeModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './appointment-calendar.component.html',
  styleUrl: './appointment-calendar.component.scss'
})
export class AppointmentCalendarComponent implements OnInit {
  // Services
  private appointmentService = inject(AppointmentService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  // Signals
  currentDate = signal(new Date());
  selectedDate = signal<Date | null>(null);
  appointments = signal<Appointment[]>([]);
  loading = signal(false);
  viewMode = signal<'month' | 'week' | 'day'>('month');
  selectedDoctor = signal<number | null>(null);

  // Calendar data
  calendarWeeks = computed(() => this.generateCalendar());
  selectedDateAppointments = computed(() => {
    if (!this.selectedDate()) return [];

    const selected = this.selectedDate()!;
    return this.appointments().filter(apt => {
      const aptDate = new Date(apt.appointmentDate);
      return aptDate.getDate() === selected.getDate() &&
        aptDate.getMonth() === selected.getMonth() &&
        aptDate.getFullYear() === selected.getFullYear();
    });
  });

  // Data
  doctors = [
    { id: null, name: 'جميع الأطباء' },
    { id: 1, name: 'د. سارة أحمد' },
    { id: 2, name: 'د. محمد خالد' },
    { id: 3, name: 'د. فاطمة علي' },
    { id: 4, name: 'د. أحمد حسن' },
    { id: 5, name: 'د. ليلى محمود' }
  ];

  weekDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  ngOnInit(): void {
    this.loadAppointments();
    this.selectToday();
  }

  private loadAppointments(): void {
    this.loading.set(true);

    const startOfMonth = new Date(this.currentDate().getFullYear(), this.currentDate().getMonth(), 1);
    const endOfMonth = new Date(this.currentDate().getFullYear(), this.currentDate().getMonth() + 1, 0);

    this.appointmentService.getAppointments({
      fromDate: this.formatDate(startOfMonth),
      toDate: this.formatDate(endOfMonth),
      doctorId: this.selectedDoctor() || undefined
    }).subscribe({
      next: (appointments) => {
        this.appointments.set(appointments);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.notificationService.error('حدث خطأ في تحميل المواعيد');
        this.loading.set(false);
      }
    });
  }

  private generateCalendar(): CalendarWeek[] {
    const year = this.currentDate().getFullYear();
    const month = this.currentDate().getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();

    // Get the first day of the calendar (might be from previous month)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const weeks: CalendarWeek[] = [];
    const currentDateIterator = new Date(startDate);

    while (currentDateIterator <= lastDay || currentDateIterator.getDay() !== 0) {
      const week: CalendarDay[] = [];

      for (let i = 0; i < 7; i++) {
        const date = new Date(currentDateIterator);
        const dayAppointments = this.getAppointmentsForDate(date);

        week.push({
          date,
          day: date.getDate(),
          isToday: this.isSameDate(date, today),
          isCurrentMonth: date.getMonth() === month,
          isWeekend: date.getDay() === 5 || date.getDay() === 6,
          appointments: dayAppointments
        });

        currentDateIterator.setDate(currentDateIterator.getDate() + 1);
      }

      weeks.push({ days: week });
    }

    return weeks;
  }

  private getAppointmentsForDate(date: Date): Appointment[] {
    return this.appointments().filter(apt => {
      const aptDate = new Date(apt.appointmentDate);
      return this.isSameDate(aptDate, date);
    });
  }

  private isSameDate(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear();
  }

  selectToday(): void {
    const today = new Date();
    this.currentDate.set(today);
    this.selectedDate.set(today);
  }

  previousMonth(): void {
    const newDate = new Date(this.currentDate());
    newDate.setMonth(newDate.getMonth() - 1);
    this.currentDate.set(newDate);
    this.loadAppointments();
  }

  nextMonth(): void {
    const newDate = new Date(this.currentDate());
    newDate.setMonth(newDate.getMonth() + 1);
    this.currentDate.set(newDate);
    this.loadAppointments();
  }

  selectDate(day: CalendarDay): void {
    if (day.isCurrentMonth) {
      this.selectedDate.set(day.date);
    }
  }

  onDoctorChange(): void {
    this.loadAppointments();
  }

  onViewModeChange(): void {
    // Implement view mode change logic
    this.notificationService.info(`تم التبديل إلى عرض ${this.getViewModeLabel()}`);
  }

  getViewModeLabel(): string {
    switch (this.viewMode()) {
      case 'month': return 'الشهر';
      case 'week': return 'الأسبوع';
      case 'day': return 'اليوم';
      default: return '';
    }
  }

  onNewAppointment(): void {
    const queryParams: any = {};

    if (this.selectedDate()) {
      queryParams.date = this.formatDate(this.selectedDate()!);
    }

    if (this.selectedDoctor()) {
      queryParams.doctorId = this.selectedDoctor();
    }

    this.router.navigate(['/appointments/new'], { queryParams });
  }

  onViewAppointment(appointment: Appointment): void {
    this.router.navigate(['/appointments', appointment.id]);
  }

  onEditAppointment(appointment: Appointment): void {
    this.router.navigate(['/appointments', appointment.id, 'edit']);
  }

  getAppointmentCountForDay(day: CalendarDay): number {
    return day.appointments.length;
  }

  getDayClasses(day: CalendarDay): string {
    const classes = ['calendar-day'];

    if (day.isToday) classes.push('today');
    if (!day.isCurrentMonth) classes.push('other-month');
    if (day.isWeekend) classes.push('weekend');
    if (this.selectedDate() && this.isSameDate(day.date, this.selectedDate()!)) {
      classes.push('selected');
    }
    if (day.appointments.length > 0) classes.push('has-appointments');

    return classes.join(' ');
  }

  getStatusColor(status: AppointmentStatus): string {
    const colors: Record<AppointmentStatus, string> = {
      [AppointmentStatus.SCHEDULED]: '#667eea',
      [AppointmentStatus.CONFIRMED]: '#48bb78',
      [AppointmentStatus.CHECKED_IN]: '#4299e1',
      [AppointmentStatus.IN_PROGRESS]: '#f6ad55',
      [AppointmentStatus.COMPLETED]: '#48bb78',
      [AppointmentStatus.CANCELLED]: '#f56565',
      [AppointmentStatus.NO_SHOW]: '#a0aec0',
      [AppointmentStatus.RESCHEDULED]: '#ed8936'
    };
    return colors[status] || '#718096';
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'م' : 'ص';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getMonthYear(): string {
    return `${this.monthNames[this.currentDate().getMonth()]} ${this.currentDate().getFullYear()}`;
  }
}
