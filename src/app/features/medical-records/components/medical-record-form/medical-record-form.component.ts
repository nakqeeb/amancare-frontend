// ===================================================================
// 1. MEDICAL RECORD FORM COMPONENT
// src/app/features/medical-records/components/medical-record-form/medical-record-form.component.ts
// ===================================================================
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Observable, map, startWith } from 'rxjs';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// Medical Record Components
import { VitalSignsFormComponent } from '../vital-signs-form/vital-signs-form.component';
import { DiagnosisFormComponent } from '../diagnosis-form/diagnosis-form.component';
import { PrescriptionFormComponent } from '../prescription-form/prescription-form.component';
import { LabTestsFormComponent } from '../lab-tests-form/lab-tests-form.component';

// Services & Models
import { MedicalRecordService } from '../../services/medical-record.service';
import { PatientService } from '../../../patients/services/patient.service';
import { AppointmentService } from '../../../appointments/services/appointment.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  MedicalRecord,
  CreateMedicalRecordRequest,
  UpdateMedicalRecordRequest,
  VisitType,
  RecordStatus,
  VitalSigns,
  Diagnosis,
  Prescription,
  LabTest,
  SystemicExamination
} from '../../models/medical-record.model';
import { Patient } from '../../../patients/models/patient.model';
import { Appointment, AppointmentStatus } from '../../../appointments/models/appointment.model';

@Component({
  selector: 'app-medical-record-form',
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
    MatDividerModule,
    MatTabsModule,
    MatAutocompleteModule,
    HeaderComponent,
    SidebarComponent,
    VitalSignsFormComponent,
    DiagnosisFormComponent,
    PrescriptionFormComponent,
    LabTestsFormComponent
  ],
  templateUrl: './medical-record-form.component.html',
  styleUrl: './medical-record-form.component.scss'
})
export class MedicalRecordFormComponent implements OnInit {
  // Services
  private medicalRecordService = inject(MedicalRecordService);
  private patientService = inject(PatientService);
  private appointmentService = inject(AppointmentService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  // Signals
  loading = signal(false);
  isEditMode = signal(false);
  recordId = signal<number | null>(null);
  selectedPatient = signal<Patient | null>(null);
  selectedAppointment = signal<Appointment | null>(null);
  currentStep = signal(0);

  // Form Groups
  medicalRecordForm!: FormGroup;
  basicInfoForm!: FormGroup;
  vitalSignsForm!: FormGroup;
  examinationForm!: FormGroup;
  diagnosisForm!: FormGroup;
  treatmentForm!: FormGroup;

  // Data
  patients: Patient[] = [];
  appointments: Appointment[] = [];
  filteredPatients$!: Observable<Patient[]>;

  visitTypes = [
    { value: VisitType.FIRST_VISIT, label: 'زيارة أولى', icon: 'person_add' },
    { value: VisitType.FOLLOW_UP, label: 'متابعة', icon: 'update' },
    { value: VisitType.EMERGENCY, label: 'طوارئ', icon: 'emergency' },
    { value: VisitType.ROUTINE_CHECK, label: 'فحص دوري', icon: 'fact_check' },
    { value: VisitType.VACCINATION, label: 'تطعيم', icon: 'vaccines' },
    { value: VisitType.CONSULTATION, label: 'استشارة', icon: 'medical_services' }
  ];

  // Sub-form data
  vitalSigns: VitalSigns = {};
  diagnoses: Diagnosis[] = [];
  prescriptions: Prescription[] = [];
  labTests: LabTest[] = [];

  ngOnInit(): void {
    this.initializeForms();
    this.loadPatients();
    this.checkEditMode();
    this.checkQueryParams();
    this.setupAutocomplete();
  }

  private initializeForms(): void {
    // Basic Information Form
    this.basicInfoForm = this.fb.group({
      patientId: ['', Validators.required],
      patientSearch: [''],
      appointmentId: [''],
      visitDate: [new Date(), Validators.required],
      visitType: [VisitType.CONSULTATION, Validators.required]
    });

    // Examination Form
    this.examinationForm = this.fb.group({
      chiefComplaint: ['', [Validators.required, Validators.minLength(10)]],
      presentIllness: ['', [Validators.required, Validators.minLength(20)]],
      pastMedicalHistory: [''],
      familyHistory: [''],
      socialHistory: [''],
      allergies: [''],
      currentMedications: [''],
      physicalExamination: ['', [Validators.required, Validators.minLength(20)]],
      // Systemic Examination
      cardiovascular: [''],
      respiratory: [''],
      gastrointestinal: [''],
      genitourinary: [''],
      musculoskeletal: [''],
      neurological: [''],
      psychiatric: [''],
      skin: ['']
    });

    // Treatment Plan Form
    this.treatmentForm = this.fb.group({
      treatmentPlan: ['', [Validators.required, Validators.minLength(20)]],
      followUpDate: [''],
      followUpInstructions: [''],
      notes: ['']
    });

    // Combined form
    this.medicalRecordForm = this.fb.group({
      basicInfo: this.basicInfoForm,
      examination: this.examinationForm,
      treatment: this.treatmentForm
    });
  }

  private setupAutocomplete(): void {
    this.filteredPatients$ = this.basicInfoForm.get('patientSearch')!.valueChanges
      .pipe(
        startWith(''),
        map(value => this.filterPatients(value || ''))
      );
  }

  private filterPatients(value: string): Patient[] {
    if (typeof value !== 'string') return this.patients;

    const filterValue = value.toLowerCase();
    return this.patients.filter(patient =>
      patient.firstName.toLowerCase().includes(filterValue) ||
      patient.lastName.toLowerCase().includes(filterValue) ||
      patient.patientNumber?.toLowerCase().includes(filterValue)
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
        dateOfBirth: '1990-07-22',
        gender: 'FEMALE',
        bloodType: 'A_POSITIVE',
        address: 'جدة'
      }
    ];
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.recordId.set(+id);
      this.loadMedicalRecord(+id);
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

      if (params['appointmentId']) {
        const appointmentId = +params['appointmentId'];
        this.basicInfoForm.patchValue({ appointmentId });
        // Load appointment details
        this.loadAppointment(appointmentId);
      }
    });
  }

  private loadMedicalRecord(id: number): void {
    this.loading.set(true);
    this.medicalRecordService.getMedicalRecordById(id).subscribe({
      next: (record) => {
        this.populateForm(record);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading medical record:', error);
        this.notificationService.error('حدث خطأ في تحميل السجل الطبي');
        this.loading.set(false);
        this.router.navigate(['/medical-records']);
      }
    });
  }

  private loadAppointment(id: number): void {
    this.appointmentService.getAppointmentById(id).subscribe({
      next: (appointment) => {
        this.selectedAppointment.set(appointment);

        // Auto-fill patient and visit date
        const patient = this.patients.find(p => p.id === appointment.patientId);
        if (patient) {
          this.selectPatient(patient);
        }

        this.basicInfoForm.patchValue({
          visitDate: new Date(appointment.appointmentDate),
          appointmentId: appointment.id
        });

        // Set chief complaint if available
        if (appointment.chiefComplaint) {
          this.examinationForm.patchValue({
            chiefComplaint: appointment.chiefComplaint
          });
        }
      },
      error: (error) => {
        console.error('Error loading appointment:', error);
      }
    });
  }

  private populateForm(record: MedicalRecord): void {
    // Basic Info
    this.basicInfoForm.patchValue({
      patientId: record.patientId,
      appointmentId: record.appointmentId,
      visitDate: new Date(record.visitDate),
      visitType: record.visitType
    });

    // Find and select patient
    const patient = this.patients.find(p => p.id === record.patientId);
    if (patient) {
      this.selectPatient(patient);
    }

    // Vital Signs
    this.vitalSigns = record.vitalSigns;

    // Examination
    this.examinationForm.patchValue({
      chiefComplaint: record.chiefComplaint,
      presentIllness: record.presentIllness,
      pastMedicalHistory: record.pastMedicalHistory,
      familyHistory: record.familyHistory,
      socialHistory: record.socialHistory,
      allergies: record.allergies?.join(', '),
      currentMedications: record.currentMedications?.join(', '),
      physicalExamination: record.physicalExamination,
      ...record.systemicExamination
    });

    // Diagnosis & Treatment
    this.diagnoses = record.diagnosis;
    this.prescriptions = record.prescriptions || [];
    this.labTests = record.labTests || [];

    this.treatmentForm.patchValue({
      treatmentPlan: record.treatmentPlan,
      followUpDate: record.followUpDate ? new Date(record.followUpDate) : null,
      followUpInstructions: record.followUpInstructions,
      notes: record.notes
    });
  }

  selectPatient(patient: Patient): void {
    this.selectedPatient.set(patient);
    this.basicInfoForm.patchValue({
      patientId: patient.id,
      patientSearch: `${patient.firstName} ${patient.lastName} - ${patient.patientNumber}`
    });

    // Load patient's appointments
    this.loadPatientAppointments(patient.id!);
  }

  private loadPatientAppointments(patientId: number): void {
    // Load today's appointments for this patient
    this.appointmentService.getAppointments({ patientId }).subscribe({
      next: (appointments) => {
        this.appointments = appointments;
      }
    });
  }

  displayPatient(patient: Patient): string {
    return patient ? `${patient.firstName} ${patient.lastName} - ${patient.patientNumber}` : '';
  }

  onPatientSelected(event: any): void {
    const patient = event.option.value;
    if (patient) {
      this.selectPatient(patient);
    }
  }

  onVitalSignsChange(vitalSigns: VitalSigns): void {
    this.vitalSigns = vitalSigns;
  }

  onDiagnosesChange(diagnoses: Diagnosis[]): void {
    this.diagnoses = diagnoses;
  }

  onPrescriptionsChange(prescriptions: Prescription[]): void {
    this.prescriptions = prescriptions;
  }

  onLabTestsChange(labTests: LabTest[]): void {
    this.labTests = labTests;
  }

  onPrintPrescription(): void {
    if (this.recordId()) {
      this.loading.set(true);
      // Print prescription logic
      this.notificationService.success('تم طباعة الوصفة الطبية');
      this.loading.set(false);
    }
  }

  nextStep(): void {
    const currentStep = this.currentStep();
    if (currentStep < 4) {
      this.currentStep.set(currentStep + 1);
    }
  }

  previousStep(): void {
    const currentStep = this.currentStep();
    if (currentStep > 0) {
      this.currentStep.set(currentStep - 1);
    }
  }

  async onSubmit(status: RecordStatus = RecordStatus.DRAFT): Promise<void> {
    if (this.medicalRecordForm.invalid) {
      this.markFormGroupTouched(this.medicalRecordForm);
      this.notificationService.warning('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (this.diagnoses.length === 0) {
      this.notificationService.warning('يجب إضافة تشخيص واحد على الأقل');
      return;
    }

    const recordData = this.prepareMedicalRecordData();
    recordData.status = status;

    this.loading.set(true);

    if (this.isEditMode()) {
      this.updateMedicalRecord(recordData);
    } else {
      this.createMedicalRecord(recordData);
    }
  }

  private prepareMedicalRecordData(): any {
    const formValue = this.medicalRecordForm.value;

    // Process allergies and medications
    const allergies = formValue.examination.allergies
      ? formValue.examination.allergies.split(',').map((a: string) => a.trim()).filter((a: string) => a)
      : [];

    const currentMedications = formValue.examination.currentMedications
      ? formValue.examination.currentMedications.split(',').map((m: string) => m.trim()).filter((m: string) => m)
      : [];

    // Build systemic examination
    const systemicExamination: SystemicExamination = {};
    if (formValue.examination.cardiovascular) systemicExamination.cardiovascular = formValue.examination.cardiovascular;
    if (formValue.examination.respiratory) systemicExamination.respiratory = formValue.examination.respiratory;
    if (formValue.examination.gastrointestinal) systemicExamination.gastrointestinal = formValue.examination.gastrointestinal;
    if (formValue.examination.genitourinary) systemicExamination.genitourinary = formValue.examination.genitourinary;
    if (formValue.examination.musculoskeletal) systemicExamination.musculoskeletal = formValue.examination.musculoskeletal;
    if (formValue.examination.neurological) systemicExamination.neurological = formValue.examination.neurological;
    if (formValue.examination.psychiatric) systemicExamination.psychiatric = formValue.examination.psychiatric;
    if (formValue.examination.skin) systemicExamination.skin = formValue.examination.skin;

    return {
      patientId: formValue.basicInfo.patientId,
      appointmentId: formValue.basicInfo.appointmentId || null,
      visitDate: this.formatDate(formValue.basicInfo.visitDate),
      visitType: formValue.basicInfo.visitType,
      vitalSigns: this.vitalSigns,
      chiefComplaint: formValue.examination.chiefComplaint,
      presentIllness: formValue.examination.presentIllness,
      pastMedicalHistory: formValue.examination.pastMedicalHistory,
      familyHistory: formValue.examination.familyHistory,
      socialHistory: formValue.examination.socialHistory,
      allergies,
      currentMedications,
      physicalExamination: formValue.examination.physicalExamination,
      systemicExamination: Object.keys(systemicExamination).length > 0 ? systemicExamination : undefined,
      diagnosis: this.diagnoses,
      treatmentPlan: formValue.treatment.treatmentPlan,
      prescriptions: this.prescriptions.length > 0 ? this.prescriptions : undefined,
      labTests: this.labTests.length > 0 ? this.labTests : undefined,
      followUpDate: formValue.treatment.followUpDate ? this.formatDate(formValue.treatment.followUpDate) : undefined,
      followUpInstructions: formValue.treatment.followUpInstructions,
      notes: formValue.treatment.notes
    };
  }

  private createMedicalRecord(data: CreateMedicalRecordRequest): void {
    this.medicalRecordService.createMedicalRecord(data).subscribe({
      next: (record) => {
        this.notificationService.success('تم حفظ السجل الطبي بنجاح');

        // Update appointment status if linked
        if (data.appointmentId) {
          this.appointmentService.updateAppointmentStatus(
            data.appointmentId,
            AppointmentStatus.COMPLETED
          ).subscribe();
        }

        this.router.navigate(['/medical-records', record.id]);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error creating medical record:', error);
        this.notificationService.error('حدث خطأ في حفظ السجل الطبي');
        this.loading.set(false);
      }
    });
  }

  private updateMedicalRecord(data: UpdateMedicalRecordRequest): void {
    this.medicalRecordService.updateMedicalRecord(this.recordId()!, data).subscribe({
      next: (record) => {
        this.notificationService.success('تم تحديث السجل الطبي بنجاح');
        this.router.navigate(['/medical-records', record.id]);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error updating medical record:', error);
        this.notificationService.error('حدث خطأ في تحديث السجل الطبي');
        this.loading.set(false);
      }
    });
  }

  onSaveAsDraft(): void {
    this.onSubmit(RecordStatus.DRAFT);
  }

  onSaveAndComplete(): void {
    this.onSubmit(RecordStatus.COMPLETED);
  }

  onCancel(): void {
    this.router.navigate(['/medical-records']);
  }

  onReset(): void {
    this.medicalRecordForm.reset();
    this.vitalSigns = {};
    this.diagnoses = [];
    this.prescriptions = [];
    this.labTests = [];
    this.selectedPatient.set(null);
    this.selectedAppointment.set(null);
    this.currentStep.set(0);
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

  isStepValid(step: number): boolean {
    switch (step) {
      case 0:
        return this.basicInfoForm.valid;
      case 1:
        return true; // Vital signs are optional
      case 2:
        return this.examinationForm.valid;
      case 3:
        return this.diagnoses.length > 0;
      case 4:
        return this.treatmentForm.valid;
      default:
        return false;
    }
  }

  canProceed(): boolean {
    return this.isStepValid(this.currentStep());
  }

  getPatientAge(): number {
    if (!this.selectedPatient()?.dateOfBirth) return 0;

    const today = new Date();
    const birthDate = new Date(this.selectedPatient()!.dateOfBirth!);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }
}
