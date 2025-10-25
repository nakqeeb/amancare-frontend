// src/app/features/appointments/components/appointment-arrangement/appointment-arrangement.component.ts
import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { Subject, takeUntil } from 'rxjs';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { TokenBadgeComponent } from '../../../../shared/components/token-badge/token-badge.component';

// Services & Models
import { AppointmentService } from '../../services/appointment.service';
import { UserService } from '../../../users/services/user.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  AppointmentResponse,
  AppointmentStatus,
  AppointmentType,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_TYPE_LABELS,
  APPOINTMENT_STATUS_COLORS
} from '../../models/appointment.model';
import { User } from '../../../users/models/user.model';

interface AppointmentArrangementItem {
  id: number;
  tokenNumber: number;
  patientName: string;
  appointmentType: AppointmentType;
  appointmentTime: string;
  status: AppointmentStatus;
  appointmentDate: string;
}

@Component({
  selector: 'app-appointment-arrangement',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatListModule,
    HeaderComponent,
    SidebarComponent,
    TokenBadgeComponent
  ],
  templateUrl: './appointment-arrangement.component.html',
  styleUrl: './appointment-arrangement.component.scss'
})
export class AppointmentArrangementComponent implements OnInit, OnDestroy {
  // Services
  private readonly appointmentService = inject(AppointmentService);
  private readonly userService = inject(UserService);
  private readonly notificationService = inject(NotificationService);
  private destroy$ = new Subject<void>();

  // State
  doctors = signal<User[]>([]);
  appointments = signal<AppointmentArrangementItem[]>([]);
  loading = signal<boolean>(false);
  loadingAppointments = signal<boolean>(false);
  selectedDoctorControl = new FormControl<number | null>(null);

  // Enums for template
  appointmentStatus = AppointmentStatus;
  statusLabels = APPOINTMENT_STATUS_LABELS;
  typeLabels = APPOINTMENT_TYPE_LABELS;
  statusColors = APPOINTMENT_STATUS_COLORS;

  // ===================================================================
  // LIFECYCLE HOOKS
  // ===================================================================
  ngOnInit(): void {
    this.loadDoctors();
    this.setupDoctorSelectionListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===================================================================
  // SETUP
  // ===================================================================
  private setupDoctorSelectionListener(): void {
    this.selectedDoctorControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(doctorId => {
        if (doctorId) {
          this.loadDoctorAppointments(doctorId);
        } else {
          this.appointments.set([]);
        }
      });
  }

  // ===================================================================
  // DATA LOADING
  // ===================================================================
  private loadDoctors(): void {
    this.loading.set(true);
    this.userService.getDoctors().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.doctors.set(response.data);
          console.log('Doctors loaded:', response.data);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading doctors:', error);
        this.notificationService.error('فشل في تحميل قائمة الأطباء');
        this.loading.set(false);
      }
    });
  }

  private loadDoctorAppointments(doctorId: number): void {
    this.loadingAppointments.set(true);
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

    console.log('Loading appointments for doctor:', doctorId, 'Date:', today);

    // Fetch appointments for the selected doctor for today
    this.appointmentService.getAllAppointments(
      today,          // date
      doctorId,       // doctorId
      undefined,      // status - no filter
      0,              // page
      100,            // size - large enough to get all
      'tokenNumber',  // sortBy
      'asc'           // sortDirection
    ).subscribe({
      next: (response) => {
        console.log('Appointments response:', response);

        // Filter out completed appointments and map to arrangement items
        const items = response.appointments
          .filter(apt => apt.status !== AppointmentStatus.COMPLETED)
          .map(apt => this.mapToArrangementItem(apt))
          .sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0));

        console.log('Filtered and mapped appointments:', items);
        this.appointments.set(items);
        this.loadingAppointments.set(false);
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.notificationService.error('فشل في تحميل المواعيد');
        this.appointments.set([]);
        this.loadingAppointments.set(false);
      }
    });
  }

  // ===================================================================
  // HELPER METHODS
  // ===================================================================
  private mapToArrangementItem(appointment: AppointmentResponse): AppointmentArrangementItem {
    console.log('Mapping appointment:', appointment);
    return {
      id: appointment.id,
      tokenNumber: appointment.tokenNumber || 0,
      patientName: appointment.patient.fullName,
      appointmentType: appointment.appointmentType,
      appointmentTime: this.formatTimeOnly(appointment.appointmentTime),
      status: appointment.status,
      appointmentDate: appointment.appointmentDate
    };
  }

  private formatTimeOnly(time: string): string {
    // Input format: "HH:mm:ss" or "HH:mm"
    // Output format: "HH:mm" in 12-hour format with AM/PM in Arabic
    try {
      const timeParts = time.split(':');
      let hours = parseInt(timeParts[0]);
      const minutes = timeParts[1];

      const period = hours >= 12 ? 'م' : 'ص';
      hours = hours % 12 || 12;

      return `${hours}:${minutes} ${period}`;
    } catch (error) {
      return time;
    }
  }

  private getDoctorNameById(doctorId: number): string {
    const doctor = this.doctors().find(d => d.id === doctorId);
    return doctor ? doctor.fullName : '';
  }

  // ===================================================================
  // USER ACTIONS
  // ===================================================================
  onDoctorChange(): void {
    const doctorId = this.selectedDoctorControl.value;
    console.log('Doctor changed to:', doctorId);
    if (doctorId) {
      const doctorName = this.getDoctorNameById(doctorId);
      this.notificationService.info(`تم اختيار د. ${doctorName}`);
    }
  }

  updateAppointmentStatus(appointment: AppointmentArrangementItem, newStatus: AppointmentStatus): void {
    this.loading.set(true);
    console.log('Updating appointment', appointment.id, 'to status', newStatus);

    this.appointmentService.updateAppointmentStatus(appointment.id, newStatus).subscribe({
      next: (updatedAppointment) => {
        console.log('Appointment updated:', updatedAppointment);

        // If status is COMPLETED, remove from list
        if (newStatus === AppointmentStatus.COMPLETED) {
          const updatedList = this.appointments().filter(a => a.id !== appointment.id);
          this.appointments.set(updatedList);
          this.notificationService.success('تم إكمال الموعد وإخفاؤه من القائمة');
        } else {
          // Update the appointment in the list
          const appointments = this.appointments();
          const index = appointments.findIndex(a => a.id === appointment.id);

          if (index !== -1) {
            appointments[index] = {
              ...appointments[index],
              status: newStatus
            };
            this.appointments.set([...appointments]);
          }

          this.notificationService.success(`تم تحديث حالة الموعد إلى ${this.statusLabels[newStatus]}`);
        }

        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error updating appointment status:', error);
        this.notificationService.error('فشل في تحديث حالة الموعد');
        this.loading.set(false);
      }
    });
  }

  refreshAppointments(): void {
    const doctorId = this.selectedDoctorControl.value;
    console.log('Refreshing appointments for doctor:', doctorId);

    if (doctorId) {
      this.loadDoctorAppointments(doctorId);
      this.notificationService.info('جاري تحديث قائمة المواعيد...');
    } else {
      this.notificationService.warning('الرجاء اختيار طبيب أولاً');
    }
  }

  getStatusColor(status: AppointmentStatus): string {
    return this.statusColors[status] || 'default';
  }

  getTypeLabel(type: AppointmentType): string {
    return this.typeLabels[type] || type;
  }

  getStatusLabel(status: AppointmentStatus): string {
    return this.statusLabels[status] || status;
  }

  // Get available status transitions for an appointment
  getAvailableStatusTransitions(currentStatus: AppointmentStatus): AppointmentStatus[] {
    const transitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      [AppointmentStatus.SCHEDULED]: [
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.NO_SHOW
      ],
      [AppointmentStatus.CONFIRMED]: [
        AppointmentStatus.IN_PROGRESS,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.NO_SHOW
      ],
      [AppointmentStatus.IN_PROGRESS]: [
        AppointmentStatus.COMPLETED,
        AppointmentStatus.CANCELLED
      ],
      [AppointmentStatus.COMPLETED]: [],
      [AppointmentStatus.CANCELLED]: [],
      [AppointmentStatus.NO_SHOW]: []
    };

    return transitions[currentStatus] || [];
  }

  canUpdateStatus(currentStatus: AppointmentStatus): boolean {
    return this.getAvailableStatusTransitions(currentStatus).length > 0;
  }

  getStatusIcon(status: AppointmentStatus): string {
    const icons: Record<AppointmentStatus, string> = {
      [AppointmentStatus.SCHEDULED]: 'schedule',
      [AppointmentStatus.CONFIRMED]: 'check_circle',
      [AppointmentStatus.IN_PROGRESS]: 'play_circle',
      [AppointmentStatus.COMPLETED]: 'done_all',
      [AppointmentStatus.CANCELLED]: 'cancel',
      [AppointmentStatus.NO_SHOW]: 'event_busy'
    };
    return icons[status] || 'event';
  }

  get appointmentCount(): number {
    return this.appointments().length;
  }
}
