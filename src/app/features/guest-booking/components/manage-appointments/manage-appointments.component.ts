// src/app/features/guest-booking/components/manage-appointments/manage-appointments.component.ts

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

import { GuestBookingService } from '../../services/guest-booking.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AppointmentResponse, AppointmentStatus, APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_COLORS } from '../../../appointments/models/appointment.model';

@Component({
  selector: 'app-manage-appointments',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './manage-appointments.component.html',
  styleUrl: './manage-appointments.component.scss'
})
export class ManageAppointmentsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly guestBookingService = inject(GuestBookingService);

  // Signals
  appointments = signal<AppointmentResponse[]>([]);
  loading = signal(false);
  patientNumber = signal<string | null>(null);
  showLoginForm = signal(true);

  // Form
  loginForm!: FormGroup;

  // Table
  displayedColumns = ['appointmentDate', 'appointmentTime', 'doctor', 'status', 'actions'];

  // Enums for template
  AppointmentStatus = AppointmentStatus;
  APPOINTMENT_STATUS_LABELS = APPOINTMENT_STATUS_LABELS;
  APPOINTMENT_STATUS_COLORS = APPOINTMENT_STATUS_COLORS;

  ngOnInit(): void {
    this.initializeForm();

    // Check if patient number is in query params
    const patientNumberFromQuery = this.route.snapshot.queryParamMap.get('patientNumber');
    if (patientNumberFromQuery) {
      this.loginForm.patchValue({ patientNumber: patientNumberFromQuery });
      this.loadAppointments();
    }
  }

  private initializeForm(): void {
    this.loginForm = this.fb.group({
      patientNumber: ['', [
        Validators.required,
        // Validators.pattern(/^P\d{11}$/)
      ]]
    });
  }

  loadAppointments(): void {
    if (this.loginForm.invalid) {
      return;
    }

    const patientNumber = this.loginForm.get('patientNumber')?.value;
    this.loading.set(true);

    this.guestBookingService.getMyAppointments(patientNumber).subscribe({
      next: (appointments) => {
        this.appointments.set(appointments);
        this.patientNumber.set(patientNumber);
        this.showLoginForm.set(false);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.loading.set(false);
      }
    });
  }

  cancelAppointment(appointment: AppointmentResponse): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'تأكيد الإلغاء',
        message: `هل أنت متأكد من إلغاء موعدك مع ${appointment.doctor.fullName} بتاريخ ${appointment.appointmentDate}؟`,
        confirmText: 'نعم، إلغاء',
        cancelText: 'لا، تراجع'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.guestBookingService.cancelAppointment(
          appointment.id,
          this.patientNumber()!
        ).subscribe({
          next: () => {
            // Remove from list or reload
            this.loadAppointments();
          },
          error: (error) => console.error('Error cancelling appointment:', error)
        });
      }
    });
  }

  canCancelAppointment(appointment: AppointmentResponse): boolean {
    return appointment.status !== AppointmentStatus.COMPLETED &&
      appointment.status !== AppointmentStatus.CANCELLED;
  }

  logout(): void {
    this.showLoginForm.set(true);
    this.appointments.set([]);
    this.patientNumber.set(null);
    this.loginForm.reset();
    this.router.navigate(['/guest/appointments']);
  }

  bookNewAppointment(): void {
    this.router.navigate(['/guest/book']);
  }
  getStatusColor(status: AppointmentStatus): string {
    return this.APPOINTMENT_STATUS_COLORS[status];
  }

  getStatusLabel(status: AppointmentStatus): string {
    return this.APPOINTMENT_STATUS_LABELS[status];
  }
}
