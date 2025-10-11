// src/app/features/guest-booking/components/booking-success/booking-success.component.ts

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { GuestBookingResponse } from '../../models/guest-booking.model';

@Component({
  selector: 'app-booking-success',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule
  ],
  templateUrl: './booking-success.component.html',
  styleUrl: './booking-success.component.scss'
})
export class BookingSuccessComponent implements OnInit {
  private readonly router = inject(Router);

  bookingData = signal<GuestBookingResponse | null>(null);
  patientNumberCopied = signal(false);

  ngOnInit(): void {
    // Get booking data from router state
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;

    if (state?.['bookingData']) {
      this.bookingData.set(state['bookingData']);
    } else {
      // If no data, redirect to booking page
      this.router.navigate(['/guest/book']);
    }
  }

  copyPatientNumber(): void {
    const patientNumber = this.bookingData()?.patientNumber;
    if (patientNumber) {
      navigator.clipboard.writeText(patientNumber).then(() => {
        this.patientNumberCopied.set(true);
        setTimeout(() => this.patientNumberCopied.set(false), 3000);
      });
    }
  }

  goToManageAppointments(): void {
    const patientNumber = this.bookingData()?.patientNumber;
    if (patientNumber) {
      this.router.navigate(['/guest/appointments'], {
        queryParams: { patientNumber }
      });
    }
  }

  bookAnotherAppointment(): void {
    this.router.navigate(['/guest/book']);
  }
}
