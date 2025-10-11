// src/app/features/guest-booking/components/confirm-appointment/confirm-appointment.component.ts

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GuestBookingService } from '../../services/guest-booking.service';

@Component({
  selector: 'app-confirm-appointment',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './confirm-appointment.component.html',
  styleUrl: './confirm-appointment.component.scss'
})
export class ConfirmAppointmentComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly guestBookingService = inject(GuestBookingService);

  confirming = signal(true);
  confirmed = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.error.set('رابط التأكيد غير صحيح');
      this.confirming.set(false);
      return;
    }

    this.confirmAppointment(token);
  }

  private confirmAppointment(token: string): void {
    this.guestBookingService.confirmAppointment(token).subscribe({
      next: () => {
        this.confirmed.set(true);
        this.confirming.set(false);
      },
      error: (error) => {
        this.error.set(error.error?.message || 'فشل في تأكيد الموعد');
        this.confirming.set(false);
      }
    });
  }

  goToHomePage(): void {
    this.router.navigate(['/']);
  }

  bookAnotherAppointment(): void {
    this.router.navigate(['/guest/book']);
  }
}
