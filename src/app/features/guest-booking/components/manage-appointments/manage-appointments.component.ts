// src/app/features/guest-booking/components/manage-appointments/manage-appointments.component.ts

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GuestBookingService } from '../../services/guest-booking.service';
import { AppointmentResponse, AppointmentStatus } from '../../../appointments/models/appointment.model';
import { MatDividerModule } from '@angular/material/divider';

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
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatDividerModule
  ],
  templateUrl: './manage-appointments.component.html',
  styleUrl: './manage-appointments.component.scss'
})
export class ManageAppointmentsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly guestBookingService = inject(GuestBookingService);

  searchForm: FormGroup;
  appointments = signal<AppointmentResponse[]>([]);
  loading = signal(false);
  searched = signal(false);

  constructor() {
    this.searchForm = this.fb.group({
      patientNumber: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  ngOnInit(): void {
    // Check if patientNumber was passed from query params (e.g., from booking success page)
    this.route.queryParams.subscribe(params => {
      if (params['patientNumber']) {
        this.searchForm.patchValue({ patientNumber: params['patientNumber'] });
        this.onSearch();
      }
    });
  }

  onSearch(): void {
    if (this.searchForm.invalid) {
      this.showError('يرجى إدخال رقم المريض');
      return;
    }

    this.loading.set(true);
    this.searched.set(true);

    const { patientNumber } = this.searchForm.value;

    this.guestBookingService.getGuestAppointments(patientNumber).subscribe({
      next: (appointments) => {
        this.appointments.set(appointments);
        this.loading.set(false);

        if (appointments.length === 0) {
          this.showError('لم يتم العثور على مواعيد لهذا الرقم');
        }
      },
      error: (error) => {
        console.error('Error searching appointments:', error);
        this.loading.set(false);
        this.showError('حدث خطأ في البحث. يرجى التحقق من رقم المريض');
      }
    });
  }

  getStatusLabel(status: AppointmentStatus): string {
    const labels: Record<AppointmentStatus, string> = {
      [AppointmentStatus.SCHEDULED]: 'مجدول',
      [AppointmentStatus.CONFIRMED]: 'مؤكد',
      [AppointmentStatus.IN_PROGRESS]: 'قيد التنفيذ',
      [AppointmentStatus.COMPLETED]: 'مكتمل',
      [AppointmentStatus.CANCELLED]: 'ملغي',
      [AppointmentStatus.NO_SHOW]: 'لم يحضر'
    };
    return labels[status] || status;
  }

  getStatusColor(status: AppointmentStatus): 'primary' | 'accent' | 'warn' | undefined {
    const colors: Record<AppointmentStatus, 'primary' | 'accent' | 'warn' | undefined> = {
      [AppointmentStatus.SCHEDULED]: 'primary',
      [AppointmentStatus.CONFIRMED]: 'accent',
      [AppointmentStatus.IN_PROGRESS]: 'accent',
      [AppointmentStatus.COMPLETED]: undefined,
      [AppointmentStatus.CANCELLED]: 'warn',
      [AppointmentStatus.NO_SHOW]: 'warn'
    };
    return colors[status];
  }

  canCancelAppointment(appointment: AppointmentResponse): boolean {
    // Can cancel if status is SCHEDULED or CONFIRMED and date is in the future
    const canCancelStatuses = [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED];
    const isFutureAppointment = new Date(appointment.appointmentDate) >= new Date();
    return canCancelStatuses.includes(appointment.status) && isFutureAppointment;
  }

  onCancelAppointment(appointment: AppointmentResponse): void {
    if (!confirm('هل أنت متأكد من إلغاء هذا الموعد؟')) {
      return;
    }

    const patientNumber = this.searchForm.get('patientNumber')?.value;

    this.guestBookingService.cancelAppointment(appointment.id, patientNumber).subscribe({
      next: (success) => {
        if (success) {
          this.showSuccess('تم إلغاء الموعد بنجاح');
          // Refresh appointments list
          this.onSearch();
        } else {
          this.showError('فشل إلغاء الموعد');
        }
      },
      error: (error) => {
        console.error('Error canceling appointment:', error);
        this.showError('حدث خطأ في إلغاء الموعد');
      }
    });
  }

  formatDate(date: string): string {
    try {
      return new Date(date).toLocaleDateString('ar-EG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return date;
    }
  }

  formatTime(time: string): string {
    if (!time) return '';
    // If time is in HH:mm:ss format, return only HH:mm
    return time.substring(0, 5);
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'حسناً', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'حسناً', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }
}
