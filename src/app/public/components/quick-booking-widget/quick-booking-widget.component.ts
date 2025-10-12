// src/app/public/components/quick-booking-widget/quick-booking-widget.component.ts

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GuestBookingService } from '../../../features/guest-booking/services/guest-booking.service';
import {
  ClinicSummary,
  ClinicDoctorSummary
} from '../../../features/guest-booking/models/guest-booking.model';

@Component({
  selector: 'app-quick-booking-widget',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './quick-booking-widget.component.html',
  styleUrl: './quick-booking-widget.component.scss'
})
export class QuickBookingWidgetComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly guestBookingService = inject(GuestBookingService);

  quickBookingForm!: FormGroup;
  clinics = signal<ClinicSummary[]>([]);
  doctors = signal<ClinicDoctorSummary[]>([]);
  loadingClinics = signal(false);
  loadingDoctors = signal(false);

  minDate = new Date();
  maxDate = (() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 3);
    return date;
  })();

  ngOnInit(): void {
    this.initializeForm();
    this.loadClinics();
  }

  private initializeForm(): void {
    this.quickBookingForm = this.fb.group({
      clinicId: ['', Validators.required],
      doctorId: [''],
      appointmentDate: ['']
    });

    this.quickBookingForm.get('clinicId')?.valueChanges.subscribe(clinicId => {
      if (clinicId) {
        this.quickBookingForm.patchValue({ doctorId: '' });
        this.doctors.set([]);
        this.loadDoctors(clinicId);
      } else {
        this.doctors.set([]);
      }
    });
  }

  private loadClinics(): void {
    this.loadingClinics.set(true);
    this.guestBookingService.getClinics().subscribe({
      next: (clinics) => {
        this.clinics.set(clinics);
        this.loadingClinics.set(false);
      },
      error: () => this.loadingClinics.set(false)
    });
  }

  private loadDoctors(clinicId: number): void {
    this.loadingDoctors.set(true);
    this.guestBookingService.getClinicDoctors(clinicId).subscribe({
      next: (doctors) => {
        this.doctors.set(doctors);
        this.loadingDoctors.set(false);
      },
      error: () => this.loadingDoctors.set(false)
    });
  }

  onQuickBook(): void {
    if (this.quickBookingForm.get('clinicId')?.invalid) {
      return;
    }

    const queryParams: any = {
      clinicId: this.quickBookingForm.get('clinicId')?.value
    };

    if (this.quickBookingForm.get('doctorId')?.value) {
      queryParams.doctorId = this.quickBookingForm.get('doctorId')?.value;
    }

    if (this.quickBookingForm.get('appointmentDate')?.value) {
      const date = this.quickBookingForm.get('appointmentDate')?.value;
      queryParams.date = this.formatDate(date);
    }

    this.router.navigate(['/guest/book'], { queryParams });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getSelectedClinic(): ClinicSummary | undefined {
    const clinicId = this.quickBookingForm.get('clinicId')?.value;
    return this.clinics().find(c => c.id === clinicId);
  }
}
