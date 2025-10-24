import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { Observable, startWith, map } from 'rxjs';

import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { AppointmentService } from '../../services/appointment.service';
import { PatientService } from '../../../patients/services/patient.service';
import { ScheduleService } from '../../../schedules/services/schedule.service';
import { AppointmentTokenService } from '../../services/appointment-token.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  AppointmentType
} from '../../models/appointment.model';
import { Patient } from '../../../patients/models/patient.model';
import { MatChipsModule } from '@angular/material/chips';
import { UserService } from '../../../users/services/user.service';

interface TimeSlotWithToken {
  time: string;
  tokenNumber: number;
  display: string;
}

@Component({
  selector: 'app-appointment-form',
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
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatExpansionModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './appointment-form.component.html',
  styleUrl: './appointment-form.component.scss'
})
export class AppointmentFormComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly patientService = inject(PatientService);
  private readonly userService = inject(UserService);
  private readonly scheduleService = inject(ScheduleService);
  private readonly tokenService = inject(AppointmentTokenService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  // Component state
  public readonly isEditMode = signal(false);
  public readonly appointmentId = signal<number | null>(null);
  public readonly loading = signal(false);

  // Data signals
  public readonly patients = signal<Patient[]>([]);
  public readonly doctors = signal<any[]>([]);
  public readonly availableTimeSlots = signal<TimeSlotWithToken[]>([]);

  // **NEW: Schedule duration information**
  public readonly scheduleDuration = signal<number | null>(null);
  public readonly scheduleInfo = signal<{
    durationMinutes: number;
    durationConfigType: string;
    expectedTokens: number;
    availableWorkingMinutes: number;
  } | null>(null);
  public readonly loadingScheduleInfo = signal(false);

  // **NEW: Override configuration**
  public readonly showOverrideSection = signal(false);
  public readonly overrideEnabled = signal(false);

  // Autocomplete
  public filteredPatients$!: Observable<Patient[]>;

  // Form
  public appointmentForm = this.fb.group({
    patientId: [null as number | null, Validators.required],
    patientSearch: [''],
    doctorId: [null as number | null, Validators.required],
    appointmentDate: [null as Date | null, Validators.required],
    appointmentTime: ['', Validators.required],
    appointmentType: ['CONSULTATION' as AppointmentType, Validators.required],
    chiefComplaint: [''],
    notes: [''],

    // **NEW: Override fields**
    enableOverride: [false],
    overrideDurationMinutes: [{ value: null as number | null, disabled: true }, [
      Validators.min(5),
      Validators.max(240)
    ]],
    overrideReason: [{ value: '', disabled: true }]
  });

  // Appointment types
  public appointmentTypes = [
    { value: 'CONSULTATION', label: 'استشارة' },
    { value: 'FOLLOW_UP', label: 'متابعة' },
    { value: 'EMERGENCY', label: 'طوارئ' },
    { value: 'ROUTINE_CHECKUP', label: 'فحص دوري' }
  ];

  ngOnInit(): void {
    this.loadPatients();
    this.loadDoctors();
    this.setupPatientAutocomplete();
    this.setupFormListeners();
    this.checkEditMode();
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.appointmentId.set(parseInt(id, 10));
      this.loadAppointment(parseInt(id, 10));
    }
  }

  private loadAppointment(id: number): void {
    this.loading.set(true);
    this.appointmentService.getAppointmentById(id).subscribe({
      next: (appointment) => {
        // Populate form
        this.appointmentForm.patchValue({
          patientId: appointment.patient.id,
          patientSearch: appointment.patient.fullName,
          doctorId: appointment.doctor.id,
          appointmentDate: new Date(appointment.appointmentDate),
          appointmentTime: appointment.appointmentTime,
          appointmentType: appointment.appointmentType,
          chiefComplaint: appointment.chiefComplaint,
          notes: appointment.notes
        });

        // **NEW: Set override information if present**
        if (appointment.isDurationOverridden) {
          this.overrideEnabled.set(true);
          this.showOverrideSection.set(true);
          this.appointmentForm.patchValue({
            enableOverride: true,
            overrideDurationMinutes: appointment.durationMinutes,
            overrideReason: appointment.overrideReason
          });
          this.appointmentForm.get('overrideDurationMinutes')?.enable();
          this.appointmentForm.get('overrideReason')?.enable();
        }

        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading appointment:', error);
        this.loading.set(false);
        this.notificationService.error('فشل في تحميل بيانات الموعد');
      }
    });
  }

  private loadPatients(): void {
    this.patientService.getAllPatients().subscribe({
      next: (response) => {
        this.patients.set(response.data?.patients || []);
      },
      error: (error) => {
        console.error('Error loading patients:', error);
      }
    });
  }

  private loadDoctors(): void {
    this.userService.getDoctors().subscribe({
      next: (res) => {
        this.doctors.set(res.data || []);
      },
      error: (error) => {
        console.error('Error loading doctors:', error);
      }
    });
  }

  private setupPatientAutocomplete(): void {
    this.filteredPatients$ = this.appointmentForm.get('patientSearch')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterPatients(value || ''))
    );
  }

  private _filterPatients(value: string): Patient[] {
    const filterValue = value.toLowerCase();
    return this.patients().filter(patient => {
      const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
      const patientNumber = patient.patientNumber?.toLowerCase() || '';
      return fullName.includes(filterValue) || patientNumber.includes(filterValue);
    });
  }

  displayPatient(patient: Patient): string {
    return patient ? `${patient.fullName} - ${patient.patientNumber}` : '';
  }

  onPatientSelected(event: any): void {
    const patient = event.option.value;
    this.appointmentForm.patchValue({ patientId: patient.id });
  }

  private setupFormListeners(): void {
    // Listen for doctor selection to load schedule info
    this.appointmentForm.get('doctorId')?.valueChanges.subscribe(doctorId => {
      if (doctorId) {
        const date = this.appointmentForm.get('appointmentDate')?.value;
        if (date) {
          this.loadScheduleInfoForDoctor(doctorId, date);
          this.loadAvailableTimeSlots(doctorId, date);
        }
      } else {
        this.scheduleInfo.set(null);
        this.scheduleDuration.set(null);
        this.availableTimeSlots.set([]);
      }
    });

    // Listen for date changes
    this.appointmentForm.get('appointmentDate')?.valueChanges.subscribe(date => {
      if (date) {
        const doctorId = this.appointmentForm.get('doctorId')?.value;
        if (doctorId) {
          this.loadScheduleInfoForDoctor(doctorId, date);
          this.loadAvailableTimeSlots(doctorId, date);
        }
      } else {
        this.availableTimeSlots.set([]);
      }
    });

    // **NEW: Listen for override toggle**
    this.appointmentForm.get('enableOverride')?.valueChanges.subscribe(enabled => {
      this.overrideEnabled.set(enabled!);
      if (enabled) {
        this.appointmentForm.get('overrideDurationMinutes')?.enable();
        this.appointmentForm.get('overrideDurationMinutes')?.setValidators([
          Validators.required,
          Validators.min(5),
          Validators.max(240)
        ]);
        this.appointmentForm.get('overrideReason')?.enable();
        this.appointmentForm.get('overrideReason')?.setValidators(Validators.required);

        // Set default value to current schedule duration
        if (this.scheduleDuration()) {
          this.appointmentForm.patchValue({
            overrideDurationMinutes: this.scheduleDuration()
          });
        }
      } else {
        this.appointmentForm.get('overrideDurationMinutes')?.disable();
        this.appointmentForm.get('overrideDurationMinutes')?.clearValidators();
        this.appointmentForm.get('overrideReason')?.disable();
        this.appointmentForm.get('overrideReason')?.clearValidators();
      }
      this.appointmentForm.get('overrideDurationMinutes')?.updateValueAndValidity();
      this.appointmentForm.get('overrideReason')?.updateValueAndValidity();
    });
  }

  // **NEW: Load schedule information for selected doctor and date**
  private loadScheduleInfoForDoctor(doctorId: number, date: Date): void {
    this.loadingScheduleInfo.set(true);
    const dateStr = this.formatDate(date);

    // Get doctor's schedule for this date to extract duration info
    this.scheduleService.getAvailableTimeSlots(doctorId, dateStr).subscribe({
      next: () => {
        // After getting time slots, we need to get the schedule details
        // This would require a new endpoint or we extract from existing data
        // For now, we'll use the token service which has schedule info
        this.loadScheduleDurationInfo(doctorId, date);
      },
      error: (error) => {
        console.error('Error loading schedule info:', error);
        this.loadingScheduleInfo.set(false);
      }
    });
  }

  // **NEW: Load detailed schedule duration information**
  private loadScheduleDurationInfo(doctorId: number, date: Date): void {
    const dateStr = this.formatDate(date);

    // We'll make a call to get schedule info through the schedule service
    // You may need to add a specific endpoint for this, but for now we'll approximate
    // by getting available slots with tokens and extracting duration info

    this.tokenService.getAllTimeSlotsWithTokens(doctorId, dateStr).subscribe({
      next: (slotsWithTokens) => {
        // Extract duration by looking at time differences
        const times = Object.keys(slotsWithTokens).sort();
        if (times.length >= 2) {
          const time1 = this.parseTime(times[0]);
          const time2 = this.parseTime(times[1]);
          const durationMinutes = (time2.hours * 60 + time2.minutes) -
                                 (time1.hours * 60 + time1.minutes);

          this.scheduleDuration.set(durationMinutes);
          this.scheduleInfo.set({
            durationMinutes: durationMinutes,
            durationConfigType: 'من الجدول', // We don't have this info from current API
            expectedTokens: Object.keys(slotsWithTokens).length,
            availableWorkingMinutes: durationMinutes * Object.keys(slotsWithTokens).length
          });
        }
        this.loadingScheduleInfo.set(false);
      },
      error: (error) => {
        console.error('Error loading schedule duration info:', error);
        this.loadingScheduleInfo.set(false);
      }
    });
  }

  // **UPDATED: Load available time slots with tokens**
  private loadAvailableTimeSlots(doctorId: number, date: Date): void {
    const dateStr = this.formatDate(date);

    this.tokenService.getAvailableTimeSlotsWithTokens(doctorId, dateStr).subscribe({
      next: (slotsWithTokens) => {
        // Convert object to array with display format
        const slots: TimeSlotWithToken[] = Object.entries(slotsWithTokens).map(([time, tokenNumber]) => ({
          time,
          tokenNumber,
          display: `${time} - رمز #${tokenNumber}`
        }));
        this.availableTimeSlots.set(slots);
      },
      error: (error) => {
        console.error('Error loading time slots:', error);
        this.availableTimeSlots.set([]);
      }
    });
  }

  // Parse time string (HH:mm) to hours and minutes
  private parseTime(timeStr: string): { hours: number; minutes: number } {
    const parts = timeStr.split(':');
    return {
      hours: parseInt(parts[0], 10),
      minutes: parseInt(parts[1], 10)
    };
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // **NEW: Toggle override section visibility**
  toggleOverrideSection(): void {
    this.showOverrideSection.update(v => !v);
  }

  onSubmit(): void {
    if (this.appointmentForm.invalid) {
      this.appointmentForm.markAllAsTouched();
      this.notificationService.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    this.loading.set(true);
    const formValue = this.appointmentForm.value;

    // Format date
    const date = formValue.appointmentDate!;
    const formattedDate = this.formatDate(date);

    if (this.isEditMode()) {
      const updateRequest: UpdateAppointmentRequest = {
        appointmentDate: formattedDate,
        appointmentTime: formValue.appointmentTime!,
        appointmentType: formValue.appointmentType as AppointmentType,
        chiefComplaint: formValue.chiefComplaint || undefined,
        notes: formValue.notes || undefined
      };

      this.appointmentService.updateAppointment(this.appointmentId()!, updateRequest).subscribe({
        next: () => {
          this.notificationService.success('تم تحديث الموعد بنجاح');
          this.router.navigate(['/appointments']);
        },
        error: (error) => {
          console.error('Error updating appointment:', error);
          this.loading.set(false);
        }
      });
    } else {
      const createRequest: CreateAppointmentRequest = {
        patientId: formValue.patientId!,
        doctorId: formValue.doctorId!,
        appointmentDate: formattedDate,
        appointmentTime: formValue.appointmentTime!,
        appointmentType: formValue.appointmentType as AppointmentType,
        chiefComplaint: formValue.chiefComplaint || undefined,
        notes: formValue.notes || undefined,

        // **NEW: Include override information if enabled**
        overrideDurationMinutes: formValue.enableOverride ?
          formValue.overrideDurationMinutes! : undefined,
        overrideReason: formValue.enableOverride ?
          formValue.overrideReason! : undefined
      };

      this.appointmentService.createAppointment(createRequest).subscribe({
        next: () => {
          this.notificationService.success('تم إنشاء الموعد بنجاح');
          this.router.navigate(['/appointments']);
        },
        error: (error) => {
          console.error('Error creating appointment:', error);
          this.loading.set(false);
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/appointments']);
  }
}
