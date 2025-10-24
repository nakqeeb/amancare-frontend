// src/app/features/guest-booking/components/booking-success/booking-success.component.ts

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { TokenBadgeComponent } from "../../../../shared/components/token-badge/token-badge.component";

interface BookingDetails {
  confirmationCode: string;
  clinicName: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  patientName: string;
  tokenNumber?: number;
  patientEmail: string;
  patientPhone: string;
  notes?: string;
}

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
    TokenBadgeComponent
],
  templateUrl: './booking-success.component.html',
  styleUrl: './booking-success.component.scss'
})
export class BookingSuccessComponent implements OnInit {
  bookingDetails = signal<BookingDetails | null>(null);

  constructor(private router: Router) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { bookingDetails?: BookingDetails };

    if (state?.bookingDetails) {
      this.bookingDetails.set(state.bookingDetails);
    }
  }

  ngOnInit(): void {
    if (!this.bookingDetails()) {
      this.router.navigate(['/']);
    }
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
  }

  navigateToManageAppointments(): void {
    this.router.navigate(['/guest/appointments']);
  }

  printConfirmation(): void {
    window.print();
  }
}
