// src/app/features/guest-booking/components/book-appointment/book-appointment.component.ts

import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

import { GuestBookingService } from '../../services/guest-booking.service';
import { ClinicService } from '../../../clinics/services/clinic.service';
import { ClinicDoctorSummary, GuestBookingRequest } from '../../models/guest-booking.model';
import { Clinic } from '../../../clinics/models/clinic.model';

// GENDER
const GENDER = {
  MALE: 'MALE',
  FEMALE: 'FEMALE'
} as const;

type Gender = (typeof GENDER)[keyof typeof GENDER];

// BLOOD TYPE
const BLOOD_TYPE = {
  O_POSITIVE: 'O+',
  O_NEGATIVE: 'O-',
  A_POSITIVE: 'A+',
  A_NEGATIVE: 'A-',
  B_POSITIVE: 'B+',
  B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+',
  AB_NEGATIVE: 'AB-'
} as const;

type BloodType = (typeof BLOOD_TYPE)[keyof typeof BLOOD_TYPE];

@Component({
  selector: 'app-book-appointment',
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
    MatStepperModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './book-appointment.component.html',
  styleUrl: './book-appointment.component.scss'
})
export class BookAppointmentComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly guestBookingService = inject(GuestBookingService);
  private readonly clinicService = inject(ClinicService);

  // Signals
  clinics = signal<Clinic[]>([]);
  doctors = signal<ClinicDoctorSummary[]>([]);
  availableSlots = signal<string[]>([]);
  selectedClinic = signal<Clinic | null>(null);
  selectedDoctor = signal<ClinicDoctorSummary | null>(null);
  loading = computed(() => this.guestBookingService.loading());

  // Forms
  clinicForm!: FormGroup;
  patientForm!: FormGroup;
  appointmentForm!: FormGroup;

  // Enums for template
  Gender = GENDER;
  BloodType = BLOOD_TYPE;
  genderOptions = Object.values(GENDER);
  bloodTypeOptions = Object.values(BLOOD_TYPE);

  // Today's date for date picker min
  minDate = new Date();

  ngOnInit(): void {
    this.initializeForms();
    this.loadClinics();
  }

  private initializeForms(): void {
    // Step 1: Select Clinic & Doctor
    this.clinicForm = this.fb.group({
      clinicId: ['', Validators.required],
      doctorId: ['', Validators.required]
    });

    // Step 2: Patient Information
    this.patientForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      dateOfBirth: [''],
      gender: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^(\+967|00967|0)?[0-9]{9}$/)]],
      email: ['', [Validators.required, Validators.email]],
      address: [''],
      emergencyContactName: [''],
      emergencyContactPhone: ['', Validators.pattern(/^(\+967|00967|0)?[0-9]{9}$/)],
      bloodType: [''],
      allergies: [''],
      chronicDiseases: [''],
      notes: ['']
    });

    // Step 3: Appointment Details
    this.appointmentForm = this.fb.group({
      appointmentDate: ['', Validators.required],
      appointmentTime: ['', Validators.required],
      chiefComplaint: ['']
    });

    // Watch for clinic changes
    this.clinicForm.get('clinicId')?.valueChanges.subscribe(clinicId => {
      if (clinicId) {
        this.onClinicSelected(clinicId);
      }
    });

    // Watch for doctor changes
    this.clinicForm.get('doctorId')?.valueChanges.subscribe(doctorId => {
      if (doctorId) {
        const doctor = this.doctors().find(d => d.doctorId === doctorId);
        this.selectedDoctor.set(doctor || null);
      }
    });

    // Watch for date changes
    this.appointmentForm.get('appointmentDate')?.valueChanges.subscribe(date => {
      if (date && this.clinicForm.get('doctorId')?.value && this.clinicForm.get('clinicId')?.value) {
        this.loadAvailableSlots(date);
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

  private onClinicSelected(clinicId: number): void {
    const clinic = this.clinics().find(c => c.id === clinicId);
    this.selectedClinic.set(clinic || null);

    // Load doctors for selected clinic
    this.guestBookingService.getClinicDoctors(clinicId).subscribe({
      next: (doctors) => {
        this.doctors.set(doctors);
      },
      error: (error) => console.error('Error loading doctors:', error)
    });

    // Reset doctor selection
    this.clinicForm.patchValue({ doctorId: '' });
    this.availableSlots.set([]);
  }

  private loadAvailableSlots(date: Date): void {
    const clinicId = this.clinicForm.get('clinicId')?.value;
    const doctorId = this.clinicForm.get('doctorId')?.value;
    const dateStr = this.formatDate(date);

    this.guestBookingService.getAvailableTimeSlots(clinicId, doctorId, dateStr).subscribe({
      next: (slots) => {
        this.availableSlots.set(slots);
      },
      error: (error) => console.error('Error loading slots:', error)
    });
  }

  onSubmit(): void {
    if (this.clinicForm.invalid || this.patientForm.invalid || this.appointmentForm.invalid) {
      return;
    }

    const request: GuestBookingRequest = {
      ...this.patientForm.value,
      ...this.appointmentForm.value,
      clinicId: this.clinicForm.get('clinicId')?.value,
      doctorId: this.clinicForm.get('doctorId')?.value,
      appointmentDate: this.formatDate(this.appointmentForm.get('appointmentDate')?.value),
      dateOfBirth: this.patientForm.get('dateOfBirth')?.value
        ? this.formatDate(this.patientForm.get('dateOfBirth')?.value)
        : undefined
    };

    this.guestBookingService.bookAppointment(request).subscribe({
      next: (response) => {
        this.router.navigate(['/guest/booking-success'], {
          state: { bookingData: response }
        });
      },
      error: (error) => console.error('Booking error:', error)
    });
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Helper methods for template
  getDayName(day: string): string {
    // Convert day to Arabic
    return day; // Implement proper conversion
  }
}
