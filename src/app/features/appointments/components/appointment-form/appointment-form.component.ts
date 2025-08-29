// ===================================================================
// 1. APPOINTMENT FORM COMPONENT
// src/app/features/appointments/components/appointment-form/appointment-form.component.ts
// ===================================================================
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatRadioModule } from '@angular/material/radio';
import { Observable, map, startWith, debounceTime, switchMap, of } from 'rxjs';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { TimeSlotsComponent } from '../time-slots/time-slots.component';

// Services & Models
import { AppointmentService } from '../../services/appointment.service';
import { PatientService } from '../../../patients/services/patient.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoadingService } from '../../../../core/services/loading.service';
import {
  Appointment,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  AppointmentType,
  AppointmentStatus,
  TimeSlot
} from '../../models/appointment.model';
import { Patient } from '../../../patients/models/patient.model';

interface Doctor {
  id: number;
  name: string;
  specialization: string;
  clinicId: number;
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
    MatChipsModule,
    MatStepperModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatRadioModule,
    HeaderComponent,
    SidebarComponent,
    TimeSlotsComponent
  ],
  templateUrl: './appointment-form.component.html',
  styleUrl: './appointment-form.component.scss'
})
export class AppointmentFormComponent implements OnInit {
  // Services
  private appointmentService = inject(AppointmentService);
  private patientService = inject(PatientService);
  private notificationService = inject(NotificationService);
  private loadingService = inject(LoadingService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  // Signals
  loading = signal(false);
  isEditMode = signal(false);
  appointmentId = signal<number | null>(null);
  selectedPatient = signal<Patient | null>(null);
  selectedDoctor = signal<Doctor | null>(null);
  selectedDate = signal<Date | null>(null);
  availableTimeSlots = signal<TimeSlot[]>([]);
  selectedTimeSlot = signal<string | null>(null);

  // Form Groups
  appointmentForm!: FormGroup;
  patientFormGroup!: FormGroup;
  scheduleFormGroup!: FormGroup;
  detailsFormGroup!: FormGroup;

  // Observables
  filteredPatients$!: Observable<Patient[]>;
  filteredDoctors$!: Observable<Doctor[]>;

  // Data
  patients: Patient[] = [];
  doctors: Doctor[] = [
    { id: 1, name: 'د. سارة أحمد', specialization: 'طب عام', clinicId: 1 },
    { id: 2, name: 'د. محمد خالد', specialization: 'أطفال', clinicId: 1 },
    { id: 3, name: 'د. فاطمة علي', specialization: 'نساء وولادة', clinicId: 1 },
    { id: 4, name: 'د. أحمد حسن', specialization: 'باطنية', clinicId: 1 },
    { id: 5, name: 'د. ليلى محمود', specialization: 'جلدية', clinicId: 1 }
  ];

  appointmentTypes = [
    { value: AppointmentType.CONSULTATION, label: 'استشارة', icon: 'medical_services' },
    { value: AppointmentType.FOLLOW_UP, label: 'متابعة', icon: 'update' },
    { value: AppointmentType.EMERGENCY, label: 'طوارئ', icon: 'emergency' },
    { value: AppointmentType.ROUTINE_CHECK, label: 'فحص دوري', icon: 'fact_check' },
    { value: AppointmentType.VACCINATION, label: 'تطعيم', icon: 'vaccines' },
    { value: AppointmentType.LAB_TEST, label: 'فحص مخبري', icon: 'biotech' }
  ];

  durations = [
    { value: 15, label: '15 دقيقة' },
    { value: 30, label: '30 دقيقة' },
    { value: 45, label: '45 دقيقة' },
    { value: 60, label: 'ساعة' },
    { value: 90, label: 'ساعة ونصف' },
    { value: 120, label: 'ساعتان' }
  ];

  // Computed
  minDate = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  maxDate = computed(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 3); // 3 months ahead
    return date;
  });

  ngOnInit(): void {
    this.initializeForms();
    this.loadPatients();
    this.checkEditMode();
    this.setupAutocomplete();
    this.checkQueryParams();
  }

  get selectedAppointmentTypeLabel(): string | undefined {
    const typeValue = this.detailsFormGroup.get('type')?.value;
    return this.appointmentTypes.find(t => t.value === typeValue)?.label;
  }

  private initializeForms(): void {
    // Patient selection form
    this.patientFormGroup = this.fb.group({
      patientId: ['', Validators.required],
      patientSearch: ['']
    });

    // Schedule form
    this.scheduleFormGroup = this.fb.group({
      doctorId: ['', Validators.required],
      doctorSearch: [''],
      appointmentDate: ['', [Validators.required, this.futureDateValidator]],
      appointmentTime: ['', Validators.required],
      duration: [30, Validators.required]
    });

    // Details form
    this.detailsFormGroup = this.fb.group({
      type: [AppointmentType.CONSULTATION, Validators.required],
      chiefComplaint: ['', [Validators.required, Validators.minLength(10)]],
      notes: ['']
    });

    // Combined form for easy access
    this.appointmentForm = this.fb.group({
      patient: this.patientFormGroup,
      schedule: this.scheduleFormGroup,
      details: this.detailsFormGroup
    });

    // Listen to date and doctor changes to load available slots
    this.scheduleFormGroup.get('appointmentDate')?.valueChanges
      .pipe(debounceTime(300))
      .subscribe(date => {
        if (date && this.scheduleFormGroup.get('doctorId')?.value) {
          this.loadAvailableTimeSlots();
        }
      });

    this.scheduleFormGroup.get('doctorId')?.valueChanges
      .subscribe(doctorId => {
        if (doctorId && this.scheduleFormGroup.get('appointmentDate')?.value) {
          this.loadAvailableTimeSlots();
        }
      });
  }

  private setupAutocomplete(): void {
    // Patient autocomplete
    this.filteredPatients$ = this.patientFormGroup.get('patientSearch')!.valueChanges
      .pipe(
        startWith(''),
        debounceTime(300),
        map(value => this.filterPatients(value || ''))
      );

    // Doctor autocomplete
    this.filteredDoctors$ = this.scheduleFormGroup.get('doctorSearch')!.valueChanges
      .pipe(
        startWith(''),
        map(value => this.filterDoctors(value || ''))
      );
  }

  private filterPatients(value: string): Patient[] {
    if (typeof value !== 'string') return this.patients;

    const filterValue = value.toLowerCase();
    return this.patients.filter(patient =>
      patient.firstName.toLowerCase().includes(filterValue) ||
      patient.lastName.toLowerCase().includes(filterValue) ||
      patient.patientNumber?.toLowerCase().includes(filterValue) ||
      patient.phone?.includes(filterValue)
    );
  }

  private filterDoctors(value: string): Doctor[] {
    if (typeof value !== 'string') return this.doctors;

    const filterValue = value.toLowerCase();
    return this.doctors.filter(doctor =>
      doctor.name.toLowerCase().includes(filterValue) ||
      doctor.specialization.toLowerCase().includes(filterValue)
    );
  }

  private loadPatients(): void {
    // Mock data - replace with actual service call
    this.patients = [
      {
        id: 1,
        firstName: 'أحمد',
        lastName: 'محمد علي',
        patientNumber: 'P001',
        phone: '0501234567',
        email: 'ahmad@example.com',
        dateOfBirth: '1985-03-15',
        gender: 'MALE',
        bloodType: 'O_POSITIVE',
        address: 'الرياض'
      },
      {
        id: 2,
        firstName: 'فاطمة',
        lastName: 'عبدالله',
        patientNumber: 'P002',
        phone: '0509876543',
        email: 'fatima@example.com',
        dateOfBirth: '1990-07-22',
        gender: 'FEMALE',
        bloodType: 'A_POSITIVE',
        address: 'جدة'
      },
      {
        id: 3,
        firstName: 'محمد',
        lastName: 'سالم',
        patientNumber: 'P003',
        phone: '0555555555',
        email: 'mohammed@example.com',
        dateOfBirth: '1978-11-30',
        gender: 'MALE',
        bloodType: 'B_POSITIVE',
        address: 'الدمام'
      }
    ];
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.appointmentId.set(+id);
      this.loadAppointment(+id);
    }
  }

  private checkQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      if (params['patientId']) {
        const patientId = +params['patientId'];
        const patient = this.patients.find(p => p.id === patientId);
        if (patient) {
          this.selectPatient(patient);
        }
      }
    });
  }

  private loadAppointment(id: number): void {
    this.loading.set(true);
    this.appointmentService.getAppointmentById(id).subscribe({
      next: (appointment) => {
        this.populateForm(appointment);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading appointment:', error);
        this.notificationService.error('حدث خطأ في تحميل بيانات الموعد');
        this.loading.set(false);
        this.router.navigate(['/appointments']);
      }
    });
  }

  private populateForm(appointment: Appointment): void {
    // Find and select patient
    const patient = this.patients.find(p => p.id === appointment.patientId);
    if (patient) {
      this.selectPatient(patient);
    }

    // Find and select doctor
    const doctor = this.doctors.find(d => d.id === appointment.doctorId);
    if (doctor) {
      this.selectDoctor(doctor);
    }

    // Set schedule details
    this.scheduleFormGroup.patchValue({
      appointmentDate: new Date(appointment.appointmentDate),
      appointmentTime: appointment.appointmentTime,
      duration: appointment.duration
    });

    // Set appointment details
    this.detailsFormGroup.patchValue({
      type: appointment.type,
      chiefComplaint: appointment.chiefComplaint,
      notes: appointment.notes
    });
  }

  selectPatient(patient: Patient): void {
    this.selectedPatient.set(patient);
    this.patientFormGroup.patchValue({
      patientId: patient.id,
      patientSearch: `${patient.firstName} ${patient.lastName} - ${patient.patientNumber}`
    });
  }

  selectDoctor(doctor: Doctor): void {
    this.selectedDoctor.set(doctor);
    this.scheduleFormGroup.patchValue({
      doctorId: doctor.id,
      doctorSearch: `${doctor.name} - ${doctor.specialization}`
    });
  }

  displayPatient(patient: Patient): string {
    return patient ? `${patient.firstName} ${patient.lastName} - ${patient.patientNumber}` : '';
  }

  displayDoctor(doctor: Doctor): string {
    return doctor ? `${doctor.name} - ${doctor.specialization}` : '';
  }

  onPatientSelected(event: any): void {
    const patient = event.option.value;
    if (patient) {
      this.selectPatient(patient);
    }
  }

  onDoctorSelected(event: any): void {
    const doctor = event.option.value;
    if (doctor) {
      this.selectDoctor(doctor);
    }
  }

  onDateChange(date: Date | null): void {
    if (date) {
      this.selectedDate.set(date);
      if (this.scheduleFormGroup.get('doctorId')?.value) {
        this.loadAvailableTimeSlots();
      }
    }
  }

  private loadAvailableTimeSlots(): void {
    const doctorId = this.scheduleFormGroup.get('doctorId')?.value;
    const date = this.scheduleFormGroup.get('appointmentDate')?.value;

    if (!doctorId || !date) return;

    const dateStr = this.formatDate(date);

    this.loading.set(true);
    this.appointmentService.getAvailableTimeSlots(doctorId, dateStr).subscribe({
      next: (slots) => {
        this.availableTimeSlots.set(slots);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading time slots:', error);
        this.notificationService.error('حدث خطأ في تحميل الأوقات المتاحة');
        this.loading.set(false);
      }
    });
  }

  onTimeSlotSelected(timeSlot: string): void {
    this.selectedTimeSlot.set(timeSlot);
    this.scheduleFormGroup.patchValue({
      appointmentTime: timeSlot
    });
  }

  async onSubmit(): Promise<void> {
    if (this.appointmentForm.invalid) {
      this.markFormGroupTouched(this.appointmentForm);
      this.notificationService.warning('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    // Check for conflicts
    const doctorId = this.scheduleFormGroup.get('doctorId')?.value;
    const date = this.formatDate(this.scheduleFormGroup.get('appointmentDate')?.value);
    const time = this.scheduleFormGroup.get('appointmentTime')?.value;
    const duration = this.scheduleFormGroup.get('duration')?.value;

    this.loading.set(true);

    // Check for appointment conflict
    const hasConflict = await this.appointmentService.checkAppointmentConflict(
      doctorId,
      date,
      time,
      duration,
      this.isEditMode() ? this.appointmentId()! : undefined
    ).toPromise();

    if (hasConflict) {
      this.loading.set(false);
      this.notificationService.error('يوجد تعارض في هذا الموعد. يرجى اختيار وقت آخر');
      return;
    }

    const appointmentData = this.prepareAppointmentData();

    if (this.isEditMode()) {
      this.updateAppointment(appointmentData);
    } else {
      this.createAppointment(appointmentData);
    }
  }

  private prepareAppointmentData(): CreateAppointmentRequest | UpdateAppointmentRequest {
    const formValue = this.appointmentForm.value;

    return {
      patientId: formValue.patient.patientId,
      doctorId: formValue.schedule.doctorId,
      appointmentDate: this.formatDate(formValue.schedule.appointmentDate),
      appointmentTime: formValue.schedule.appointmentTime,
      duration: formValue.schedule.duration,
      type: formValue.details.type,
      chiefComplaint: formValue.details.chiefComplaint,
      notes: formValue.details.notes
    };
  }

  private createAppointment(data: CreateAppointmentRequest): void {
    this.appointmentService.createAppointment(data).subscribe({
      next: (appointment) => {
        this.notificationService.success('تم حجز الموعد بنجاح');
        this.router.navigate(['/appointments', appointment.id]);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error creating appointment:', error);
        this.notificationService.error('حدث خطأ في حجز الموعد');
        this.loading.set(false);
      }
    });
  }

  private updateAppointment(data: UpdateAppointmentRequest): void {
    this.appointmentService.updateAppointment(this.appointmentId()!, data).subscribe({
      next: (appointment) => {
        this.notificationService.success('تم تحديث الموعد بنجاح');
        this.router.navigate(['/appointments', appointment.id]);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error updating appointment:', error);
        this.notificationService.error('حدث خطأ في تحديث الموعد');
        this.loading.set(false);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/appointments']);
  }

  onReset(): void {
    this.appointmentForm.reset();
    this.selectedPatient.set(null);
    this.selectedDoctor.set(null);
    this.selectedDate.set(null);
    this.selectedTimeSlot.set(null);
    this.availableTimeSlots.set([]);
  }

  // Helper methods
  private formatDate(date: Date | string): string {
    if (!date) return '';

    if (typeof date === 'string') {
      return date;
    }

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Custom Validators
  private futureDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return { pastDate: true };
    }

    return null;
  }

  // Getters for template
  get patientError(): string {
    const control = this.patientFormGroup.get('patientId');
    if (control?.hasError('required') && control?.touched) {
      return 'يجب اختيار المريض';
    }
    return '';
  }

  get doctorError(): string {
    const control = this.scheduleFormGroup.get('doctorId');
    if (control?.hasError('required') && control?.touched) {
      return 'يجب اختيار الطبيب';
    }
    return '';
  }

  get dateError(): string {
    const control = this.scheduleFormGroup.get('appointmentDate');
    if (control?.hasError('required') && control?.touched) {
      return 'يجب اختيار التاريخ';
    }
    if (control?.hasError('pastDate')) {
      return 'لا يمكن اختيار تاريخ في الماضي';
    }
    return '';
  }

  get timeError(): string {
    const control = this.scheduleFormGroup.get('appointmentTime');
    if (control?.hasError('required') && control?.touched) {
      return 'يجب اختيار الوقت';
    }
    return '';
  }

  get chiefComplaintError(): string {
    const control = this.detailsFormGroup.get('chiefComplaint');
    if (control?.hasError('required') && control?.touched) {
      return 'يجب إدخال الشكوى الرئيسية';
    }
    if (control?.hasError('minlength')) {
      return 'الشكوى الرئيسية يجب أن تكون 10 أحرف على الأقل';
    }
    return '';
  }

  isStepValid(step: string): boolean {
    switch (step) {
      case 'patient':
        return this.patientFormGroup.valid;
      case 'schedule':
        return this.scheduleFormGroup.valid;
      case 'details':
        return this.detailsFormGroup.valid;
      default:
        return false;
    }
  }

  getPatientAge(dateOfBirth: string): number {
    if (!dateOfBirth) return 0;

    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }
}
