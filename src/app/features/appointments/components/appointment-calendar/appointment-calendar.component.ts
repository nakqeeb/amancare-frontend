// src/app/features/appointments/components/appointment-calendar/appointment-calendar.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';

// FullCalendar imports
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarOptions, EventClickArg, DateSelectArg } from '@fullcalendar/core';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// Services & Models
import { AppointmentService } from '../../services/appointment.service';
import { UserService } from '../../../users/services/user.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  AppointmentResponse,
  AppointmentStatus,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_TYPE_LABELS,
  APPOINTMENT_STATUS_COLORS
} from '../../models/appointment.model';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  color: string;
  extendedProps: {
    appointment: AppointmentResponse;
  };
}

@Component({
  selector: 'app-appointment-calendar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatBadgeModule,
    FullCalendarModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './appointment-calendar.component.html',
  styleUrl: './appointment-calendar.component.scss'
})
export class AppointmentCalendarComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  // Component state
  loading = signal(false);
  selectedDoctor = signal<number | null>(null);
  doctors = signal<any[]>([]);
  calendarEvents = signal<CalendarEvent[]>([]);
  selectedDate = signal(new Date());

  // Calendar configuration
  calendarOptions = signal<CalendarOptions>({
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    weekends: true,
    editable: false,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    locale: 'ar',
    direction: 'rtl',
    events: [],
    eventClick: this.handleEventClick.bind(this),
    dateClick: this.handleDateClick.bind(this),
    select: this.handleDateSelect.bind(this)
  });

  // Statistics
  todayCount = signal(0);
  weekCount = signal(0);
  monthCount = signal(0);

  ngOnInit(): void {
    this.loadDoctors();
    this.loadAppointments();
  }

  private loadDoctors(): void {
    this.userService.getDoctors().subscribe({
      next: (doctors) => {
        this.doctors.set(doctors);
      },
      error: (error) => {
        console.error('Error loading doctors:', error);
      }
    });
  }

  loadAppointments(): void {
    this.loading.set(true);

    this.appointmentService.getAllAppointments(
      undefined, // date
      this.selectedDoctor() || undefined,
      undefined, // status
      0,
      1000, // Get more appointments for calendar
      'appointmentDate',
      'asc'
    ).subscribe({
      next: (response) => {
        const events = this.convertAppointmentsToEvents(response.appointments);
        this.calendarEvents.set(events);
        this.updateCalendarEvents(events);
        this.calculateStatistics(response.appointments);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.loading.set(false);
      }
    });
  }

  private convertAppointmentsToEvents(appointments: AppointmentResponse[]): CalendarEvent[] {
    return appointments.map(appointment => {
      const start = `${appointment.appointmentDate}T${appointment.appointmentTime}`;
      const [hours, minutes] = appointment.appointmentTime.split(':');
      const endTime = new Date();
      endTime.setHours(parseInt(hours));
      endTime.setMinutes(parseInt(minutes) + appointment.durationMinutes);
      const endTimeStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
      const end = `${appointment.appointmentDate}T${endTimeStr}`;

      return {
        id: appointment.id.toString(),
        title: `${appointment.patient.fullName} - ${appointment.doctor.fullName}`,
        start,
        end,
        color: this.getEventColor(appointment.status),
        extendedProps: {
          appointment
        }
      };
    });
  }

  private getEventColor(status: AppointmentStatus): string {
    const colors: Record<AppointmentStatus, string> = {
      [AppointmentStatus.SCHEDULED]: '#2196F3',
      [AppointmentStatus.CONFIRMED]: '#4CAF50',
      [AppointmentStatus.IN_PROGRESS]: '#FF9800',
      [AppointmentStatus.COMPLETED]: '#8BC34A',
      [AppointmentStatus.CANCELLED]: '#F44336',
      [AppointmentStatus.NO_SHOW]: '#9E9E9E'
    };
    return colors[status] || '#2196F3';
  }

  private updateCalendarEvents(events: CalendarEvent[]): void {
    this.calendarOptions.update(options => ({
      ...options,
      events: events
    }));
  }

  private calculateStatistics(appointments: AppointmentResponse[]): void {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    this.todayCount.set(
      appointments.filter(a => a.appointmentDate === this.formatDate(today)).length
    );

    this.weekCount.set(
      appointments.filter(a => {
        const date = new Date(a.appointmentDate);
        return date >= weekStart && date <= today;
      }).length
    );

    this.monthCount.set(
      appointments.filter(a => {
        const date = new Date(a.appointmentDate);
        return date >= monthStart && date <= today;
      }).length
    );
  }

  handleEventClick(clickInfo: EventClickArg): void {
    const appointment = clickInfo.event.extendedProps['appointment'] as AppointmentResponse;
    this.router.navigate(['/appointments', appointment.id]);
  }

  handleDateClick(arg: any): void {
    this.router.navigate(['/appointments/new'], {
      queryParams: { date: arg.dateStr }
    });
  }

  handleDateSelect(selectInfo: DateSelectArg): void {
    this.router.navigate(['/appointments/new'], {
      queryParams: {
        startDate: selectInfo.startStr,
        endDate: selectInfo.endStr
      }
    });
  }

  onDoctorChange(): void {
    this.loadAppointments();
  }

  goToToday(): void {
    // Reset calendar to today
    const calendarApi = (document.querySelector('.fc') as any)?.__fullCalendar?.calendar;
    if (calendarApi) {
      calendarApi.today();
    }
  }

  changeView(view: string): void {
    const calendarApi = (document.querySelector('.fc') as any)?.__fullCalendar?.calendar;
    if (calendarApi) {
      calendarApi.changeView(view);
    }
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
