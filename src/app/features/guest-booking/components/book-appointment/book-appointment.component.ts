// src/app/features/guest-booking/components/book-appointment/book-appointment.component.ts

import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GuestBookingService } from '../../services/guest-booking.service';
import {
  ClinicSummary,
  ClinicDoctorSummary,
  DoctorScheduleSummary,
  TimeSlot,
  GuestBookingRequest,
  GuestBookingResponse,
  getDayOfWeekLabel,
  Gender,
  DayOfWeek
} from '../../models/guest-booking.model';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './book-appointment.component.html',
  styleUrl: './book-appointment.component.scss'
})
export class BookAppointmentComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly guestBookingService = inject(GuestBookingService);
  private readonly notificationService = inject(NotificationService);

  clinicForm!: FormGroup;
  dateTimeForm!: FormGroup;
  patientForm!: FormGroup;

  clinics = signal<ClinicSummary[]>([]);
  doctors = signal<ClinicDoctorSummary[]>([]);
  schedules = signal<DoctorScheduleSummary[]>([]);
  timeSlots = signal<TimeSlot[]>([]);

  loadingClinics = signal(false);
  loadingDoctors = signal(false);
  loadingSchedules = signal(false);
  loadingTimeSlots = signal(false);
  submitting = signal(false);

  minDate = new Date();
  maxDate = computed(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 3);
    return date;
  });

  selectedClinic = computed(() => {
    const clinicId = this.clinicForm?.get('clinicId')?.value;
    return this.clinics().find(c => c.id === clinicId);
  });

  selectedDoctor = computed(() => {
    const doctorId = this.clinicForm?.get('doctorId')?.value;
    return this.doctors().find(d => d.doctorId === doctorId);
  });

  ngOnInit(): void {
    this.initializeForms();
    this.loadClinics();
    this.checkQueryParams();
  }

  private initializeForms(): void {
    this.clinicForm = this.fb.group({
      clinicId: ['', Validators.required],
      doctorId: ['', Validators.required]
    });

    this.dateTimeForm = this.fb.group({
      appointmentDate: ['', Validators.required],
      appointmentTime: ['', Validators.required]
    });

    this.patientForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^(77|78|73|71|70)[0-9]{7}$/)]],
      gender: ['', Validators.required],
      dateOfBirth: [''],
      address: [''],
      emergencyContactName: [''],
      emergencyContactPhone: ['', Validators.pattern(/^(77|78|73|71|70)[0-9]{7}$/)],
      bloodType: [''],
      allergies: [''],
      chronicDiseases: [''],
      chiefComplaint: [''],
      notes: ['']
    });

    this.clinicForm.get('clinicId')?.valueChanges.subscribe(clinicId => {
      if (clinicId) {
        this.clinicForm.patchValue({ doctorId: '' });
        this.doctors.set([]);
        this.schedules.set([]);
        this.timeSlots.set([]);
        this.dateTimeForm.reset();
        this.loadDoctors(clinicId);
      }
    });

    this.clinicForm.get('doctorId')?.valueChanges.subscribe(doctorId => {
      if (doctorId) {
        this.schedules.set([]);
        this.timeSlots.set([]);
        this.dateTimeForm.reset();
        this.loadDoctorSchedules(doctorId);
      }
    });

    this.dateTimeForm.get('appointmentDate')?.valueChanges.subscribe(date => {
      if (date) {
        const doctorId = this.clinicForm.get('doctorId')?.value;
        if (doctorId) {
          this.dateTimeForm.patchValue({ appointmentTime: '' });
          this.loadAvailableTimes(doctorId, date);
        }
      }
    });
  }

  private checkQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      if (params['clinicId']) {
        this.clinicForm.patchValue({ clinicId: Number(params['clinicId']) });
      }
      if (params['doctorId']) {
        this.clinicForm.patchValue({ doctorId: Number(params['doctorId']) });
      }
      if (params['date']) {
        this.dateTimeForm.patchValue({ appointmentDate: new Date(params['date']) });
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
      error: (error) => {
        console.error('Error loading clinics:', error);
        this.loadingClinics.set(false);
        this.showError('فشل تحميل العيادات');
      }
    });
  }

  private loadDoctors(clinicId: number): void {
    this.loadingDoctors.set(true);
    this.guestBookingService.getClinicDoctors(clinicId).subscribe({
      next: (doctors) => {
        this.doctors.set(doctors);
        this.loadingDoctors.set(false);
      },
      error: (error) => {
        console.error('Error loading doctors:', error);
        this.loadingDoctors.set(false);
        this.showError('فشل تحميل الأطباء');
      }
    });
  }

  private loadDoctorSchedules(doctorId: number): void {
    this.loadingSchedules.set(true);
    this.guestBookingService.getDoctorSchedules(this.clinicForm.get('clinicId')?.value, doctorId).subscribe({
      next: (schedules) => {
        this.schedules.set(schedules);
        this.loadingSchedules.set(false);
      },
      error: (error) => {
        console.error('Error loading schedules:', error);
        this.loadingSchedules.set(false);
        this.showError('فشل تحميل جدول الطبيب');
      }
    });
  }

  private loadAvailableTimes(doctorId: number, date: Date): void {
    this.loadingTimeSlots.set(true);
    const dateStr = this.formatDate(date);
    const clinicId = this.clinicForm.get('clinicId')?.value;

    /* this.guestBookingService.getAvailableTimes(clinicId, doctorId, dateStr).subscribe({
      next: (timeStrings: string[]) => {
        // Transform string[] to TimeSlot[] - all returned slots are available
        const slots: TimeSlot[] = timeStrings.map(time => ({
          time,
          available: true
        }));
        this.timeSlots.set(slots);
        this.loadingTimeSlots.set(false);
      },
      error: (error) => {
        console.error('Error loading time slots:', error);
        this.timeSlots.set([]);
        this.loadingTimeSlots.set(false);
        this.showError('فشل تحميل الأوقات المتاحة');
      }
    }); */
    // Use the new method that includes tokens
  this.guestBookingService.getAvailableTimesWithTokens(clinicId, doctorId, dateStr).subscribe({
    next: (slots: TimeSlot[]) => {
      this.timeSlots.set(slots);
      this.loadingTimeSlots.set(false);
    },
    error: (error) => {
      console.error('Error loading time slots:', error);
      this.timeSlots.set([]);
      this.loadingTimeSlots.set(false);
      this.showError('فشل تحميل الأوقات المتاحة');
    }
  });
  }

  selectTimeSlot(time: string): void {
    this.dateTimeForm.patchValue({ appointmentTime: time });
  }

  isTimeSlotSelected(time: string): boolean {
    return this.dateTimeForm.get('appointmentTime')?.value === time;
  }

  getAvailableTimeSlots(): TimeSlot[] {
    return this.timeSlots().filter(slot => slot.available);
  }

  getDayLabel(dayOfWeek: DayOfWeek): string {
    return getDayOfWeekLabel(dayOfWeek);
  }

  dateFilter = (date: Date | null): boolean => {
    if (!date) return false;
    const schedules = this.schedules();
    if (schedules.length === 0) return true;

    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase() as DayOfWeek;
    return schedules.some(schedule => schedule.dayOfWeek === dayOfWeek);
  };

  onSubmit(): void {
    if (this.clinicForm.invalid || this.dateTimeForm.invalid || this.patientForm.invalid) {
      this.showError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    this.submitting.set(true);

    const request: GuestBookingRequest = {
      // Appointment Information
      clinicId: this.clinicForm.get('clinicId')?.value,
      doctorId: this.clinicForm.get('doctorId')?.value,
      appointmentDate: this.formatDate(this.dateTimeForm.get('appointmentDate')?.value),
      appointmentTime: this.dateTimeForm.get('appointmentTime')?.value,
      // Patient Information
      firstName: this.patientForm.get('firstName')?.value,
      lastName: this.patientForm.get('lastName')?.value,
      email: this.patientForm.get('email')?.value,
      phone: this.patientForm.get('phone')?.value,
      gender: this.patientForm.get('gender')?.value,
      dateOfBirth: this.patientForm.get('dateOfBirth')?.value ?
        this.formatDate(this.patientForm.get('dateOfBirth')?.value) : undefined,
      address: this.patientForm.get('address')?.value || undefined,
      emergencyContactName: this.patientForm.get('emergencyContactName')?.value || undefined,
      emergencyContactPhone: this.patientForm.get('emergencyContactPhone')?.value || undefined,
      bloodType: this.patientForm.get('bloodType')?.value || undefined,
      allergies: this.patientForm.get('allergies')?.value || undefined,
      chronicDiseases: this.patientForm.get('chronicDiseases')?.value || undefined,
      chiefComplaint: this.patientForm.get('chiefComplaint')?.value || undefined,
      notes: this.patientForm.get('notes')?.value || undefined
    };

    this.guestBookingService.createAppointment(request).subscribe({
      next: (response: GuestBookingResponse) => {
        this.submitting.set(false);
        this.notificationService.success('تم حجز موعدك بنجاح! تحقق من بريدك الإلكتروني');
        this.router.navigate(['/guest/booking-success'], {
          state: {
            bookingData: response
          }
        });
      },
      error: (error) => {
        console.error('Error creating appointment:', error);
        this.submitting.set(false);
        const errorMessage = error?.error?.message || 'فشل حجز الموعد. يرجى المحاولة مرة أخرى';
        this.showError(errorMessage);
      }
    });
  }

  formatDate(date: Date): string {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDateForDisplay(date: Date): string {
    if (!date) return '';
    try {
      return date.toLocaleDateString('ar-EG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return this.formatDate(date);
    }
  }

  hasAppointmentDate(): boolean {
    const dateValue = this.dateTimeForm?.get('appointmentDate')?.value;
    return dateValue != null && dateValue !== '';
  }

  getAppointmentDateDisplay(): string {
    const date = this.dateTimeForm?.get('appointmentDate')?.value;
    return date ? this.formatDateForDisplay(date) : '';
  }

  getAppointmentTime(): string {
    return this.dateTimeForm?.get('appointmentTime')?.value || '';
  }

  getPatientFullName(): string {
    const firstName = this.patientForm?.get('firstName')?.value || '';
    const lastName = this.patientForm?.get('lastName')?.value || '';
    return `${firstName} ${lastName}`.trim();
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'حسناً', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }
}
