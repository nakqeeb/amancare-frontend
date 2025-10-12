// src/app/features/guest-booking/components/confirm-appointment/confirm-appointment.component.ts

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GuestBookingService } from '../../services/guest-booking.service';
import { ConfirmAppointmentRequest } from '../../models/guest-booking.model';

@Component({
  selector: 'app-confirm-appointment',
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
    MatSnackBarModule
  ],
  templateUrl: './confirm-appointment.component.html',
  styleUrl: './confirm-appointment.component.scss'
})
export class ConfirmAppointmentComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly guestBookingService = inject(GuestBookingService);

  // confirmForm!: FormGroup;
  submitting = signal(false);
  confirmed = signal(false);
  token = signal<string>('');

  ngOnInit(): void {
    this.checkQueryParams();
    this.guestBookingService.confirmAppointment(this.token()).subscribe({
      next: (success) => {
        this.submitting.set(false);
        if (success) {
          this.confirmed.set(true);
          this.showSuccess('تم تأكيد الموعد بنجاح');
        } else {
          this.showError('فشل تأكيد الموعد. يرجى التحقق من البيانات');
        }
      },
      error: (error) => {
        console.error('Error confirming appointment:', error);
        this.submitting.set(false);
        this.showError('حدث خطأ في تأكيد الموعد. يرجى المحاولة مرة أخرى');
      }
    });
  }


  private checkQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      if (params['token']) {
        // this.confirmForm.patchValue({ confirmationCode: params['token'] });
        this.token.set(params['token'])
      }
    });
  }


  navigateToHome(): void {
    this.router.navigate(['/']);
  }

  navigateToManageAppointments(): void {
    this.router.navigate(['/guest/appointments']);
  }

  navigateToBooking(): void {
    this.router.navigate(['/guest/book']);
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'حسناً', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'حسناً', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }
}
