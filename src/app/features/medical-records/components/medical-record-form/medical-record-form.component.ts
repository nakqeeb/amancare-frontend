// ===================================================================
// src/app/features/medical-records/components/medical-record-form/medical-record-form.component.ts
// Medical Record Form Component with Complete Functionality
// ===================================================================

import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { Observable, Subject, takeUntil, debounceTime, distinctUntilChanged, map, startWith } from 'rxjs';

import { MedicalRecordService } from '../../services/medical-record.service';
import { PatientService } from '../../../patients/services/patient.service';
import { UserService } from '../../../users/services/user.service';
import { AppointmentService } from '../../../appointments/services/appointment.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

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
  RadiologyTest,
  MedicalProcedure,
  Referral,
  SystemicExamination
} from '../../models/medical-record.model';
import { Patient } from '../../../patients/models/patient.model';
import { User } from '../../../users/models/user.model';
import { Appointment, AppointmentResponse } from '../../../appointments/models/appointment.model';

// Import sub-components (these would be created separately)
import { VitalSignsFormComponent } from '../vital-signs-form/vital-signs-form.component';
import { DiagnosisFormComponent } from '../diagnosis-form/diagnosis-form.component';
import { PrescriptionFormComponent } from '../prescription-form/prescription-form.component';
import { LabTestsFormComponent } from '../lab-tests-form/lab-tests-form.component';
import { RadiologyTestsFormComponent } from '../radiology-tests-form/radiology-tests-form.component';
import { MedicalProceduresFormComponent } from '../medical-procedures-form/medical-procedures-form.component';
import { ReferralsFormComponent } from '../referrals-form/referrals-form.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { HeaderComponent } from "../../../../shared/components/header/header.component";
import { SidebarComponent } from "../../../../shared/components/sidebar/sidebar.component";

@Component({
  selector: 'app-medical-record-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatStepperModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    MatDialogModule,
    VitalSignsFormComponent,
    DiagnosisFormComponent,
    PrescriptionFormComponent,
    LabTestsFormComponent,
    RadiologyTestsFormComponent,
    MedicalProceduresFormComponent,
    ReferralsFormComponent,
    HeaderComponent,
    SidebarComponent
],
  templateUrl: './medical-record-form.component.html',
  styleUrl: './medical-record-form.component.scss'
})
export class MedicalRecordFormComponent implements OnInit, OnDestroy {
  // Services
  private fb = inject(FormBuilder);
  private medicalRecordService = inject(MedicalRecordService);
  private patientService = inject(PatientService);
  private userService = inject(UserService);
  private appointmentService = inject(AppointmentService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);

  // State Management
  loading = this.medicalRecordService.loading;
  currentUser = this.authService.currentUser;
  isEditMode = signal(false);
  recordId = signal<number | null>(null);
  currentStep = signal(0);

  // Data
  selectedPatient = signal<Patient | null>(null);
  selectedAppointment = signal<AppointmentResponse | null>(null);
  doctors = signal<User[]>([]);
  patientAppointments = signal<AppointmentResponse[]>([]);

  // Form Data
  vitalSigns: VitalSigns = {};
  diagnoses: Diagnosis[] = [];
  prescriptions: Prescription[] = [];
  labTests: LabTest[] = [];
  radiologyTests: RadiologyTest[] = [];
  procedures: MedicalProcedure[] = [];
  referrals: Referral[] = [];

  // Dates
  today = new Date();
  tomorrow = new Date(new Date().setDate(new Date().getDate() + 1));

  // Autocomplete
  patientControl = new FormControl('');
  filteredPatients$!: Observable<Patient[]>;

  // Form
  medicalRecordForm!: FormGroup;

  // Subscriptions
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initializeForm();
    this.checkEditMode();
    this.loadInitialData();
    this.setupAutocomplete();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===================================================================
  // INITIALIZATION
  // ===================================================================

  private initializeForm(): void {
    this.medicalRecordForm = this.fb.group({
      // Basic Information
      patientId: ['', Validators.required],
      patientSearch: [''],
      doctorId: [this.currentUser()?.id || '', Validators.required],
      appointmentId: [''],
      visitDate: [new Date(), Validators.required],
      visitType: [VisitType.CONSULTATION, Validators.required],
      isConfidential: [false],

      // Clinical Examination
      clinicalExamination: this.fb.group({
        chiefComplaint: ['', Validators.required],
        presentIllness: ['', Validators.required],
        pastMedicalHistory: [''],
        familyHistory: [''],
        socialHistory: [''],
        allergies: [''],
        currentMedications: [''],
        physicalExamination: [''],
        systemicExamination: this.fb.group({
          cardiovascular: [''],
          respiratory: [''],
          gastrointestinal: [''],
          genitourinary: [''],
          musculoskeletal: [''],
          neurological: [''],
          psychiatric: [''],
          skin: ['']
        })
      }),

      // Diagnosis and Treatment
      diagnosisTreatment: this.fb.group({
        treatmentPlan: ['']
      }),

      // Follow-up
      followUp: this.fb.group({
        followUpDate: [''],
        followUpInstructions: [''],
        notes: ['']
      })
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.recordId.set(parseInt(id));
      this.loadMedicalRecord(parseInt(id));
    } else {
      // Check for duplicate mode
      const duplicateFromId = this.route.snapshot.queryParamMap.get('duplicateFrom');
      if (duplicateFromId) {
        this.loadMedicalRecordForDuplicate(parseInt(duplicateFromId));
      }

      // Check for patient pre-selection
      const patientId = this.route.snapshot.queryParamMap.get('patientId');
      if (patientId) {
        this.loadPatientById(parseInt(patientId));
      }

      // Check for appointment pre-selection
      const appointmentId = this.route.snapshot.queryParamMap.get('appointmentId');
      if (appointmentId) {
        this.loadAppointmentById(parseInt(appointmentId));
      }
    }
  }

  private loadInitialData(): void {
    this.loadDoctors();
  }

  private setupAutocomplete(): void {
    this.filteredPatients$ = this.patientControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      map(value => {
        if (typeof value === 'string' && value.length >= 2) {
          return this.searchPatients(value);
        }
        return [];
      })
    );
  }

  private setupFormSubscriptions(): void {
    // Subscribe to patient ID changes
    this.medicalRecordForm.get('patientId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(patientId => {
        if (patientId) {
          this.loadPatientAppointments(patientId);
        }
      });
  }

  // ===================================================================
  // DATA LOADING
  // ===================================================================

  private loadMedicalRecord(id: number): void {
    this.medicalRecordService.getMedicalRecordById(id).subscribe({
      next: (record) => {
        this.populateForm(record);
      },
      error: (error) => {
        this.notificationService.error('خطأ في تحميل السجل الطبي');
        this.router.navigate(['/medical-records']);
      }
    });
  }

  private loadMedicalRecordForDuplicate(id: number): void {
    this.medicalRecordService.getMedicalRecordById(id).subscribe({
      next: (record) => {
        // Populate form but clear ID and status
        this.populateForm(record);
        this.recordId.set(null);
        this.isEditMode.set(false);
        this.medicalRecordForm.patchValue({
          visitDate: new Date()
        });
      }
    });
  }

  private loadDoctors(): void {
    this.userService.getDoctors().subscribe({
      next: (response) => {
        this.doctors.set(response.data!);
      }
    });
  }

  private searchPatients(searchTerm: string): Patient[] {
    // This would typically call the patient service search endpoint
    return [];
  }

  private loadPatientById(patientId: number): void {
    this.patientService.getPatientById(patientId).subscribe({
      next: (response) => {
        this.selectPatient(response.data!);
      }
    });
  }

  private loadAppointmentById(appointmentId: number): void {
    this.appointmentService.getAppointmentById(appointmentId).subscribe({
      next: (appointment) => {
        this.selectedAppointment.set(appointment);
        this.medicalRecordForm.patchValue({
          appointmentId: appointment.id,
          patientId: appointment.patient.id,
          doctorId: appointment.doctor.id,
          visitDate: new Date(appointment.appointmentDate)
        });
        // Load patient data
        this.loadPatientById(appointment.patient.id);
      }
    });
  }

  private loadPatientAppointments(patientId: number): void {
    this.appointmentService.getPatientUpcomingAppointments(patientId).subscribe({
      next: (appointments) => {
        this.patientAppointments.set(appointments);
      }
    });
  }

  // ===================================================================
  // FORM POPULATION
  // ===================================================================

  private populateForm(record: MedicalRecord): void {
    // Basic Information
    this.medicalRecordForm.patchValue({
      patientId: record.patientId,
      doctorId: record.doctorId,
      appointmentId: record.appointmentId,
      visitDate: new Date(record.visitDate),
      visitType: record.visitType,
      isConfidential: record.isConfidential
    });

    // Clinical Examination
    this.medicalRecordForm.get('clinicalExamination')?.patchValue({
      chiefComplaint: record.chiefComplaint,
      presentIllness: record.presentIllness,
      pastMedicalHistory: record.pastMedicalHistory,
      familyHistory: record.familyHistory,
      socialHistory: record.socialHistory,
      allergies: record.allergies?.join(', '),
      currentMedications: record.currentMedications?.join(', '),
      physicalExamination: record.physicalExamination
    });

    // Systemic Examination
    if (record.systemicExamination) {
      this.medicalRecordForm.get('clinicalExamination.systemicExamination')?.patchValue(record.systemicExamination);
    }

    // Treatment
    this.medicalRecordForm.get('diagnosisTreatment')?.patchValue({
      treatmentPlan: record.treatmentPlan
    });

    // Follow-up
    this.medicalRecordForm.get('followUp')?.patchValue({
      followUpDate: record.followUpDate ? new Date(record.followUpDate) : null,
      followUpInstructions: record.followUpInstructions,
      notes: record.notes
    });

    // Complex data
    this.vitalSigns = record.vitalSigns || {};
    this.diagnoses = record.diagnosis || [];
    this.prescriptions = record.prescriptions || [];
    this.labTests = record.labTests || [];
    this.radiologyTests = record.radiologyTests || [];
    this.procedures = record.procedures || [];
    this.referrals = record.referrals || [];

    // Load patient
    if (record.patientId) {
      this.loadPatientById(record.patientId);
    }
  }

  // ===================================================================
  // EVENT HANDLERS
  // ===================================================================

  onPatientSelected(event: any): void {
    const patient = event.option.value;
    this.selectPatient(patient);
  }

  private selectPatient(patient: Patient): void {
    this.selectedPatient.set(patient);
    this.medicalRecordForm.patchValue({
      patientId: patient.id
    });
    this.loadPatientAppointments(patient.id);
  }

  displayPatient(patient: Patient): string {
    return patient ? `${patient.fullName} - ${patient.patientNumber}` : '';
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

  onRadiologyTestsChange(radiologyTests: RadiologyTest[]): void {
    this.radiologyTests = radiologyTests;
  }

  onProceduresChange(procedures: MedicalProcedure[]): void {
    this.procedures = procedures;
  }

  onReferralsChange(referrals: Referral[]): void {
    this.referrals = referrals;
  }

  // ===================================================================
  // FORM SUBMISSION
  // ===================================================================

  onSaveAsDraft(): void {
    this.saveRecord(RecordStatus.DRAFT);
  }

  onSaveAndComplete(): void {
    if (this.medicalRecordForm.invalid) {
      this.markFormGroupTouched(this.medicalRecordForm);
      this.notificationService.warning('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (this.diagnoses.length === 0) {
      this.notificationService.warning('يجب إضافة تشخيص واحد على الأقل');
      return;
    }

    this.saveRecord(RecordStatus.COMPLETED);
  }

  private saveRecord(status: RecordStatus): void {
    const formValue = this.medicalRecordForm.value;
    const clinicalExam = formValue.clinicalExamination;
    const followUp = formValue.followUp;

    // Process allergies and medications
    const allergies = clinicalExam.allergies
      ? clinicalExam.allergies.split(',').map((a: string) => a.trim()).filter((a: string) => a)
      : [];

    const currentMedications = clinicalExam.currentMedications
      ? clinicalExam.currentMedications.split(',').map((m: string) => m.trim()).filter((m: string) => m)
      : [];

    const request: CreateMedicalRecordRequest | UpdateMedicalRecordRequest = {
      patientId: formValue.patientId,
      doctorId: formValue.doctorId,
      appointmentId: formValue.appointmentId || undefined,
      visitDate: this.formatDate(formValue.visitDate),
      visitType: formValue.visitType,
      isConfidential: formValue.isConfidential,

      // Vital Signs
      vitalSigns: this.vitalSigns,

      // Clinical Examination
      chiefComplaint: clinicalExam.chiefComplaint,
      presentIllness: clinicalExam.presentIllness,
      pastMedicalHistory: clinicalExam.pastMedicalHistory,
      familyHistory: clinicalExam.familyHistory,
      socialHistory: clinicalExam.socialHistory,
      allergies,
      currentMedications,
      physicalExamination: clinicalExam.physicalExamination,
      systemicExamination: clinicalExam.systemicExamination,

      // Diagnosis and Treatment
      diagnosis: this.diagnoses,
      treatmentPlan: formValue.diagnosisTreatment.treatmentPlan,
      prescriptions: this.prescriptions,
      labTests: this.labTests,
      radiologyTests: this.radiologyTests,
      procedures: this.procedures,

      // Follow-up
      followUpDate: followUp.followUpDate ? this.formatDate(followUp.followUpDate) : undefined,
      followUpInstructions: followUp.followUpInstructions,
      referrals: this.referrals,
      notes: followUp.notes,

      status
    };

    if (this.isEditMode() && this.recordId()) {
      this.medicalRecordService.updateMedicalRecord(this.recordId()!, request as UpdateMedicalRecordRequest).subscribe({
        next: (record) => {
          this.notificationService.success('تم تحديث السجل الطبي بنجاح');
          this.router.navigate(['/medical-records', record.id]);
        },
        error: (error) => {
          console.error('Error updating medical record:', error);
        }
      });
    } else {
      this.medicalRecordService.createMedicalRecord(request as CreateMedicalRecordRequest).subscribe({
        next: (record) => {
          this.notificationService.success('تم إنشاء السجل الطبي بنجاح');
          this.router.navigate(['/medical-records', record.id]);
        },
        error: (error) => {
          console.error('Error creating medical record:', error);
        }
      });
    }
  }

  onDelete(): void {
    if (!this.recordId()) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'حذف السجل الطبي',
        message: 'هل أنت متأكد من حذف هذا السجل الطبي؟',
        confirmText: 'حذف',
        cancelText: 'إلغاء'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.medicalRecordService.deleteMedicalRecord(this.recordId()!).subscribe({
          next: () => {
            this.notificationService.success('تم حذف السجل الطبي بنجاح');
            this.router.navigate(['/medical-records']);
          }
        });
      }
    });
  }

  // ===================================================================
  // NAVIGATION
  // ===================================================================

  nextStep(): void {
    if (this.currentStep() < 4) {
      this.currentStep.update(step => step + 1);
    }
  }

  previousStep(): void {
    if (this.currentStep() > 0) {
      this.currentStep.update(step => step - 1);
    }
  }

  onBack(): void {
    this.router.navigate(['/medical-records']);
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
    this.radiologyTests = [];
    this.procedures = [];
    this.referrals = [];
    this.selectedPatient.set(null);
    this.selectedAppointment.set(null);
    this.currentStep.set(0);
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================

  private formatDate(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  calculateAge(birthDate: string): number {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
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
}
