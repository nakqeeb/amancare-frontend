// src/app/features/appointments/components/appointment-details/appointment-details.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

// Services & Models
import { AppointmentService } from '../../services/appointment.service';
import { PatientService } from '../../../patients/services/patient.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  AppointmentResponse,
  AppointmentSummaryResponse,  // Add this import
  AppointmentStatus,
  AppointmentType,              // Add this import
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_TYPE_LABELS,
  APPOINTMENT_STATUS_COLORS,
  OverrideDurationRequest
} from '../../models/appointment.model';
import { OverrideDurationDialogComponent, OverrideDurationDialogData } from '../override-duration-dialog/override-duration-dialog.component';
import { TokenBadgeComponent } from "../../../../shared/components/token-badge/token-badge.component";

@Component({
  selector: 'app-appointment-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatListModule,
    MatDialogModule,
    HeaderComponent,
    SidebarComponent,
    TokenBadgeComponent
],
  templateUrl: './appointment-details.component.html',
  styleUrl: './appointment-details.component.scss'
})
export class AppointmentDetailsComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly patientService = inject(PatientService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly notificationService = inject(NotificationService);

  // Component state - Fixed typing
  appointment = signal<AppointmentResponse | null>(null);
  patientHistory = signal<AppointmentResponse[]>([]);  // Fixed: Changed from any[] to AppointmentSummaryResponse[]
  loading = signal(false);
  loadingHistory = signal(false);

  // Labels - These need to be properly typed
  statusLabels: Record<AppointmentStatus, string> = APPOINTMENT_STATUS_LABELS;
  typeLabels: Record<AppointmentType, string> = APPOINTMENT_TYPE_LABELS;
  statusColors: Record<AppointmentStatus, string> = APPOINTMENT_STATUS_COLORS;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadAppointment(+id);
    } else {
      this.router.navigate(['/appointments']);
    }
  }

  private loadAppointment(id: number): void {
    this.loading.set(true);
    this.appointmentService.getAppointmentById(id).subscribe({
      next: (appointment) => {
        this.appointment.set(appointment);
        this.loadPatientHistory(appointment.patient.id);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading appointment:', error);
        this.notificationService.error('فشل في تحميل تفاصيل الموعد');
        this.loading.set(false);
        this.router.navigate(['/appointments']);
      }
    });
  }

  private loadPatientHistory(patientId: number): void {
    this.loadingHistory.set(true);
    this.appointmentService.getPatientUpcomingAppointments(patientId).subscribe({
      next: (response) => {  // Added type annotation
        this.patientHistory.set(response);
        this.loadingHistory.set(false);
      },
      error: (error) => {
        console.error('Error loading patient history:', error);
        this.loadingHistory.set(false);
      }
    });
  }

  editAppointment(): void {
    if (this.appointment()) {
      this.router.navigate(['/appointments', this.appointment()!.id, 'edit']);
    }
  }

  updateStatus(status: AppointmentStatus): void {
    if (!this.appointment()) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'تأكيد تغيير الحالة',
        message: `هل تريد تغيير حالة الموعد إلى ${this.statusLabels[status]}؟`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.appointmentService.updateAppointmentStatus(this.appointment()!.id, status).subscribe({
          next: (updated) => {
            this.appointment.set(updated);
            this.notificationService.success('تم تحديث حالة الموعد');
          }
        });
      }
    });
  }

  cancelAppointment(): void {
    if (!this.appointment()) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'إلغاء الموعد',
        message: 'هل تريد إلغاء هذا الموعد؟',
        showReasonInput: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.appointmentService.cancelAppointment(this.appointment()!.id, result.reason).subscribe({
          next: () => {
            this.notificationService.success('تم إلغاء الموعد');
            this.router.navigate(['/appointments']);
          }
        });
      }
    });
  }

  startAppointment(): void {
    this.updateStatus(AppointmentStatus.IN_PROGRESS);
  }

  completeAppointment(): void {
    this.updateStatus(AppointmentStatus.COMPLETED);
  }

  confirmAppointment(): void {
    this.updateStatus(AppointmentStatus.CONFIRMED);
  }

  printAppointment(): void {
    window.print();
  }

  getStatusColor(status: AppointmentStatus): string {
    return this.statusColors[status] || 'default';
  }

  // Helper method to get type label
  getTypeLabel(type: AppointmentType): string {
    return this.typeLabels[type] || type;
  }

  // Helper method to get status label
  getStatusLabel(status: AppointmentStatus): string {
    return this.statusLabels[status] || status;
  }

  navigateToPatient(): void {
    if (this.appointment()) {
      this.router.navigate(['/patients', this.appointment()!.patient.id]);
    }
  }

  navigateToDoctor(): void {
    if (this.appointment()) {
      this.router.navigate(['/users', this.appointment()!.doctor.id]);
    }
  }

  // Method to open override dialog
  openOverrideDurationDialog(): void {
    const appointment = this.appointment();
    if (!appointment) return;

    const dialogData: OverrideDurationDialogData = {
      appointmentId: appointment.id,
      currentDuration: appointment.durationMinutes,
      originalDuration: appointment.originalDurationMinutes || appointment.durationMinutes,
      appointmentTime: appointment.appointmentTime
    };

    const dialogRef = this.dialog.open(OverrideDurationDialogComponent, {
      width: '500px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.overrideDuration(appointment.id, result);
      }
    });
  }

  // Method to override duration
  private overrideDuration(appointmentId: number, request: OverrideDurationRequest): void {
    this.appointmentService.overrideAppointmentDuration(appointmentId, request).subscribe({
      next: (updatedAppointment) => {
        this.appointment.set(updatedAppointment);
        this.notificationService.success('تم تجاوز مدة الموعد بنجاح');
      },
      error: (error) => {
        console.error('Error overriding duration:', error);
        this.notificationService.error('فشل في تجاوز مدة الموعد');
      }
    });
  }
}
