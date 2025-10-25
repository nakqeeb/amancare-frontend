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
import { MatExpansionModule } from '@angular/material/expansion';
import { Subject, takeUntil, forkJoin } from 'rxjs';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { TokenBadgeComponent } from '../../../../shared/components/token-badge/token-badge.component';

// Services & Models
import { AppointmentService } from '../../services/appointment.service';
import { UserService } from '../../../users/services/user.service';
import { PatientService } from '../../../patients/services/patient.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  AppointmentResponse,
  AppointmentStatus,
  AppointmentType,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_TYPE_LABELS,
  APPOINTMENT_STATUS_COLORS
} from '../../models/appointment.model';
import { Patient, BloodType } from '../../../patients/models/patient.model';
import { User } from '../../../users/models/user.model';

interface AppointmentArrangementItem {
  id: number;
  tokenNumber: number;
  patientId: number;
  patientName: string;
  appointmentType: AppointmentType;
  appointmentTime: string;
  status: AppointmentStatus;
  appointmentDate: string;
  chiefComplaint?: string;
  appointmentNotes?: string;

  // Extended patient information
  patientDetails?: Patient;
  loadingPatientDetails: boolean;
  showDetails: boolean;
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
    MatExpansionModule,
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
  private readonly patientService = inject(PatientService);
  private readonly notificationService = inject(NotificationService);
  private destroy$ = new Subject<void>();

  // State
  doctors = signal<User[]>([]);
  appointments = signal<AppointmentArrangementItem[]>([]);
  loading = signal<boolean>(false);
  loadingAppointments = signal<boolean>(false);
  selectedDoctorControl = new FormControl<number | null>(null);

  // Patient details cache to avoid repeated API calls
  private patientDetailsCache = new Map<number, Patient>();

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
    const today = new Date().toISOString().split('T')[0];

    console.log('Loading appointments for doctor:', doctorId, 'Date:', today);

    this.appointmentService.getAllAppointments(
      today,
      doctorId,
      undefined,
      0,
      100,
      'tokenNumber',
      'asc'
    ).subscribe({
      next: (response) => {
        console.log('Appointments response:', response);

        // CHANGED: Removed filter for completed appointments
        // Now all appointments are displayed, including completed ones
        const items = response.appointments
          .map(apt => this.mapToArrangementItem(apt))
          .sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0));

        console.log('Mapped appointments:', items);
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
  // PATIENT DETAILS
  // ===================================================================
  togglePatientDetails(appointment: AppointmentArrangementItem): void {
    appointment.showDetails = !appointment.showDetails;

    // Load patient details if not already loaded
    if (appointment.showDetails && !appointment.patientDetails && !appointment.loadingPatientDetails) {
      this.loadPatientDetails(appointment);
    }
  }

  private loadPatientDetails(appointment: AppointmentArrangementItem): void {
    // Check cache first
    if (this.patientDetailsCache.has(appointment.patientId)) {
      appointment.patientDetails = this.patientDetailsCache.get(appointment.patientId);
      return;
    }

    appointment.loadingPatientDetails = true;

    this.patientService.getPatientById(appointment.patientId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          appointment.patientDetails = response.data;
          // Cache the patient details
          this.patientDetailsCache.set(appointment.patientId, response.data);

          // Update the appointments signal to trigger change detection
          this.appointments.set([...this.appointments()]);
        }
        appointment.loadingPatientDetails = false;
      },
      error: (error) => {
        console.error('Error loading patient details:', error);
        this.notificationService.error('فشل في تحميل تفاصيل المريض');
        appointment.loadingPatientDetails = false;
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
      patientId: appointment.patient.id,
      patientName: appointment.patient.fullName,
      appointmentType: appointment.appointmentType,
      appointmentTime: this.formatTimeOnly(appointment.appointmentTime),
      status: appointment.status,
      appointmentDate: appointment.appointmentDate,
      chiefComplaint: appointment.chiefComplaint,
      appointmentNotes: appointment.notes,
      loadingPatientDetails: false,
      showDetails: false
    };
  }

  private formatTimeOnly(time: string): string {
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

  /**
   * Convert blood type from backend format to display format
   * B_POSITIVE -> B+, A_NEGATIVE -> A-, etc.
   */
  getBloodTypeDisplay(bloodType?: BloodType): string {
    if (!bloodType) return '-';

    const bloodTypeMap: Record<string, string> = {
      'A_POSITIVE': 'A+',
      'A_NEGATIVE': 'A-',
      'B_POSITIVE': 'B+',
      'B_NEGATIVE': 'B-',
      'AB_POSITIVE': 'AB+',
      'AB_NEGATIVE': 'AB-',
      'O_POSITIVE': 'O+',
      'O_NEGATIVE': 'O-',
      // In case the backend already sends in symbol format
      'A+': 'A+',
      'A-': 'A-',
      'B+': 'B+',
      'B-': 'B-',
      'AB+': 'AB+',
      'AB-': 'AB-',
      'O+': 'O+',
      'O-': 'O-'
    };

    return bloodTypeMap[bloodType] || bloodType;
  }

  hasPatientInfo(appointment: AppointmentArrangementItem): boolean {
    return !!(
      appointment.chiefComplaint ||
      appointment.patientDetails?.bloodType ||
      appointment.appointmentNotes ||
      appointment.patientDetails?.allergies ||
      appointment.patientDetails?.chronicDiseases
    );
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

        // CHANGED: No longer remove completed appointments from the list
        // Just update the status in place
        const appointments = this.appointments();
        const index = appointments.findIndex(a => a.id === appointment.id);

        if (index !== -1) {
          appointments[index] = {
            ...appointments[index],
            status: newStatus
          };
          this.appointments.set([...appointments]);
        }

        // Updated notification message
        if (newStatus === AppointmentStatus.COMPLETED) {
          this.notificationService.success('تم إكمال الموعد بنجاح');
        } else {
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

  /**
   * Get blood type color for styling
   */
  getBloodTypeColor(bloodType?: BloodType): string {
    if (!bloodType) return '#666';

    const displayType = this.getBloodTypeDisplay(bloodType);

    // Color coding based on Rh factor
    if (displayType.includes('+')) {
      return '#c62828'; // Red for positive
    } else if (displayType.includes('-')) {
      return '#1565c0'; // Blue for negative
    }

    return '#666';
  }

  /**
   * Clear doctor selection
   */
  clearDoctorSelection(event: Event): void {
    event.stopPropagation();
    this.selectedDoctorControl.setValue(null);
    this.appointments.set([]);
    this.notificationService.info('تم إلغاء اختيار الطبيب');
  }

  /**
   * Get selected doctor name
   */
  getSelectedDoctorName(): string {
    const doctorId = this.selectedDoctorControl.value;
    if (!doctorId) return '';
    const doctor = this.doctors().find(d => d.id === doctorId);
    return doctor ? doctor.fullName : '';
  }

  /**
   * Get selected doctor specialization
   */
  getSelectedDoctorSpecialization(): string {
    const doctorId = this.selectedDoctorControl.value;
    if (!doctorId) return '';
    const doctor = this.doctors().find(d => d.id === doctorId);
    return doctor?.specialization || '';
  }

  /**
   * Get selected doctor email
   */
  getSelectedDoctorEmail(): string {
    const doctorId = this.selectedDoctorControl.value;
    if (!doctorId) return '';
    const doctor = this.doctors().find(d => d.id === doctorId);
    return doctor?.email || '';
  }
}
