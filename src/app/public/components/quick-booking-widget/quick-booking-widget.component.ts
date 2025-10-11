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
import { ClinicService } from '../../../features/clinics/services/clinic.service';
import { GuestBookingService } from '../../../features/guest-booking/services/guest-booking.service';
import { Clinic } from '../../../features/clinics/models/clinic.model';
import { ClinicDoctorSummary } from '../../../features/guest-booking/models/guest-booking.model';

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
  private readonly clinicService = inject(ClinicService);
  private readonly guestBookingService = inject(GuestBookingService);

  // Signals
  clinics = signal<Clinic[]>([]);
  doctors = signal<ClinicDoctorSummary[]>([]);
  loading = signal(false);

  // Form
  quickBookingForm!: FormGroup;
  minDate = new Date();

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

    // Watch for clinic changes
    this.quickBookingForm.get('clinicId')?.valueChanges.subscribe(clinicId => {
      if (clinicId) {
        this.loadDoctors(clinicId);
      }
    });
  }

  private loadClinics(): void {
    this.clinicService.getClinics().subscribe({
      next: (response) => {
        this.clinics.set(response.data!);
      },
      error: (error) => console.error('Error loading clinics:', error)
    });
  }

  private loadDoctors(clinicId: number): void {
    this.loading.set(true);
    this.guestBookingService.getClinicDoctors(clinicId).subscribe({
      next: (doctors) => {
        this.doctors.set(doctors);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading doctors:', error);
        this.loading.set(false);
      }
    });
  }

  onQuickBook(): void {
    if (this.quickBookingForm.get('clinicId')?.value) {
      const queryParams: any = {
        clinicId: this.quickBookingForm.get('clinicId')?.value
      };

      if (this.quickBookingForm.get('doctorId')?.value) {
        queryParams.doctorId = this.quickBookingForm.get('doctorId')?.value;
      }

      if (this.quickBookingForm.get('appointmentDate')?.value) {
        const date = this.quickBookingForm.get('appointmentDate')?.value;
        queryParams.date = date.toISOString().split('T')[0];
      }

      this.router.navigate(['/guest/book'], { queryParams });
    }
  }
}
