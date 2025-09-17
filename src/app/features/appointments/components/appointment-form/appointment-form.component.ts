// src/app/features/appointments/components/appointment-form/appointment-form.component.ts
import { Component, inject, signal, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// Services & Models
import { AppointmentService } from '../../services/appointment.service';
import { PatientService } from '../../../patients/services/patient.service';
import { UserService } from '../../../users/services/user.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  AppointmentType,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  APPOINTMENT_TYPE_LABELS
} from '../../models/appointment.model';
import { MatDividerModule } from '@angular/material/divider';
import { Patient } from '../../../patients/models/patient.model';

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
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatDividerModule,
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
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  // Component state
  isEditMode = signal(false);
  appointmentId = signal<number | null>(null);
  loading = signal(false);
  patients = signal<any[]>([]);
  patient = signal<Patient | null>(null);
  doctors = signal<any[]>([]);
  availableTimeSlots = signal<string[]>([]);

  // Form
  appointmentForm: FormGroup;

  // Options
  appointmentTypes = Object.values(AppointmentType);
  typeLabels = APPOINTMENT_TYPE_LABELS;
  durationOptions = [15, 30, 45, 60, 90, 120];

  // Filtered patients for autocomplete
  filteredPatients$!: Observable<any[]>;

  // Min date for appointment
  minDate = new Date();


  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger!: MatAutocompleteTrigger;

  constructor() {
    this.appointmentForm = this.fb.group({
      patientId: [null, Validators.required],
      patientSearch: [''],
      doctorId: [null, Validators.required],
      appointmentDate: [null, Validators.required],
      appointmentTime: ['', Validators.required],
      durationMinutes: [30, Validators.required],
      appointmentType: [AppointmentType.CONSULTATION, Validators.required],
      chiefComplaint: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.checkEditMode();
    this.loadPatients();
    this.loadDoctors();
    this.setupPatientAutocomplete();
    this.setupDateChangeListener();
    this.loadPatientById();
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.appointmentId.set(+id);
      this.loadAppointment(+id);
    }
  }

  onFocus() {
    this.autocompleteTrigger.openPanel();
  }

  private loadAppointment(id: number): void {
    this.loading.set(true);
    this.appointmentService.getAppointmentById(id).subscribe({
      next: (appointment) => {
        this.appointmentForm.patchValue({
          patientId: appointment.patient.id,
          doctorId: appointment.doctor.id,
          appointmentDate: new Date(appointment.appointmentDate),
          appointmentTime: appointment.appointmentTime,
          durationMinutes: appointment.durationMinutes,
          appointmentType: appointment.appointmentType,
          chiefComplaint: appointment.chiefComplaint,
          notes: appointment.notes
        });

        // Set patient search field
        const patient = this.patients().find(p => p.id === appointment.patient.id);
        if (patient) {
          this.appointmentForm.patchValue({
            patientSearch: `${patient.firstName} ${patient.lastName} - ${patient.patientNumber}`
          });
        }

        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading appointment:', error);
        this.notificationService.error('فشل في تحميل بيانات الموعد');
        this.loading.set(false);
        this.router.navigate(['/appointments']);
      }
    });
  }

  private loadPatients(): void {
    this.patientService.getAllPatients().subscribe({
      next: (response) => {
        // console.log('loadPatients: ', response.data?.patients);
        this.patients.set(response.data?.patients || []);
      },
      error: (error) => {
        console.error('Error loading patients:', error);
      }
    });
  }

  private loadPatientById(): void {
    const id = this.route.snapshot.queryParamMap.get('patientId');
    if (id) {
      this.patientService.getPatientById(+id).subscribe({
        next: (response) => {
          console.log('loadPatientById: ', response.data);
          this.patient.set(response.data!);
          this.appointmentForm.patchValue({
            patientId: response.data!.id,
            patientSearch: response.data!.fullName
          });

        },
        error: (error) => {
          console.error('Error loading patients:', error);
        }
      });
    }

  }

  private loadDoctors(): void {
    this.userService.getDoctors().subscribe({
      next: (doctors) => {
        this.doctors.set(doctors);
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

  private _filterPatients(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.patients().filter(patient => {
      const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
      const patientNumber = patient.patientNumber?.toLowerCase() || '';
      return fullName.includes(filterValue) || patientNumber.includes(filterValue);
    });
  }

  displayPatient(patient: any): string {
    return patient ? `${patient.fullName} - ${patient.patientNumber}` : '';
  }

  onPatientSelected(event: any): void {
    const patient = event.option.value;
    this.appointmentForm.patchValue({ patientId: patient.id });
  }

  private setupDateChangeListener(): void {
    this.appointmentForm.get('appointmentDate')?.valueChanges.subscribe(date => {
      if (date && this.appointmentForm.get('doctorId')?.value) {
        this.loadAvailableTimeSlots(date);
      }
    });

    this.appointmentForm.get('doctorId')?.valueChanges.subscribe(doctorId => {
      const date = this.appointmentForm.get('appointmentDate')?.value;
      if (date && doctorId) {
        this.loadAvailableTimeSlots(date);
      }
    });
  }

  private loadAvailableTimeSlots(date: Date): void {
    // TODO: Integrate with schedule service to get available time slots
    // For now, generate default time slots
    const slots = [];
    for (let hour = 8; hour < 18; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    this.availableTimeSlots.set(slots);
  }

  onSubmit(): void {
    if (this.appointmentForm.invalid) {
      this.appointmentForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const formValue = this.appointmentForm.value;

    // Format date
    const date = formValue.appointmentDate;
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    if (this.isEditMode()) {
      const updateRequest: UpdateAppointmentRequest = {
        appointmentDate: formattedDate,
        appointmentTime: formValue.appointmentTime,
        durationMinutes: formValue.durationMinutes,
        appointmentType: formValue.appointmentType,
        chiefComplaint: formValue.chiefComplaint,
        notes: formValue.notes
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
        patientId: formValue.patientId,
        doctorId: formValue.doctorId,
        appointmentDate: formattedDate,
        appointmentTime: formValue.appointmentTime,
        durationMinutes: formValue.durationMinutes,
        appointmentType: formValue.appointmentType,
        chiefComplaint: formValue.chiefComplaint,
        notes: formValue.notes
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
