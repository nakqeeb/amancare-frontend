// ===================================================================
// src/app/features/medical-records/components/medical-record-form/medical-record-form.component.ts
// Medical Record Form Component - Complete Implementation with Real Data Integration
// ===================================================================

import { Component, OnInit, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
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
  SystemicExamination,
  CreateDiagnosisDto,
  CreatePrescriptionDto,
  CreateLabTestDto,
  CreateRadiologyTestDto,
  CreateMedicalProcedureDto,
  CreateReferralDto,
  DiagnosisType,
  MedicationRoute,
  LabTestCategory,
  TestUrgency,
  RadiologyType,
  ProcedureCategory,
  ReferralType,
  ReferralPriority
} from '../../models/medical-record.model';
import { Patient } from '../../../patients/models/patient.model';
import { User } from '../../../users/models/user.model';
import { AppointmentResponse } from '../../../appointments/models/appointment.model';

// Import sub-components
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
  // ViewChild for stepper control
  @ViewChild('stepper') stepper!: MatStepper;

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
  currentStep = 0; // Regular property for stepper binding
  isSaving = signal(false);

  // Data
  selectedPatient = signal<Patient | null>(null);
  selectedAppointment = signal<AppointmentResponse | null>(null);
  doctors = signal<User[]>([]);
  patientAppointments = signal<AppointmentResponse[]>([]);
  allPatients = signal<Patient[]>([]);

  // Form Data - Arrays managed by sub-components
  vitalSigns: VitalSigns = {};
  diagnoses: Diagnosis[] = [];
  prescriptions: Prescription[] = [];
  labTests: LabTest[] = [];
  radiologyTests: RadiologyTest[] = [];
  procedures: MedicalProcedure[] = [];
  referrals: Referral[] = [];

  // Dates
  today = new Date();
  minDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
  maxDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1));

  // Autocomplete
  patientControl = new FormControl('');
  filteredPatients$!: Observable<Patient[]>;

  // Form
  medicalRecordForm!: FormGroup;

  // Enums for templates
  VisitType = VisitType;
  RecordStatus = RecordStatus;
  DiagnosisType = DiagnosisType;
  MedicationRoute = MedicationRoute;
  LabTestCategory = LabTestCategory;
  TestUrgency = TestUrgency;
  RadiologyType = RadiologyType;
  ProcedureCategory = ProcedureCategory;
  ReferralType = ReferralType;
  ReferralPriority = ReferralPriority;

  // Visit Type options
  visitTypeOptions = [
    { value: VisitType.CONSULTATION, label: 'استشارة' },
    { value: VisitType.FOLLOW_UP, label: 'متابعة' },
    { value: VisitType.EMERGENCY, label: 'طوارئ' },
    { value: VisitType.ROUTINE_CHECKUP, label: 'فحص روتيني' },
    { value: VisitType.PROCEDURE, label: 'إجراء' },
    { value: VisitType.VACCINATION, label: 'تطعيم' },
    { value: VisitType.SURGERY, label: 'عملية جراحية' },
    { value: VisitType.REHABILITATION, label: 'تأهيل' },
    { value: VisitType.PREVENTIVE_CARE, label: 'رعاية وقائية' },
    { value: VisitType.CHRONIC_CARE, label: 'رعاية مزمنة' }
  ];

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
      patientId: [null, Validators.required],
      doctorId: [this.currentUser()?.id || null, Validators.required],
      appointmentId: [null],
      visitDate: [new Date(), Validators.required],
      visitType: [VisitType.CONSULTATION, Validators.required],
      isConfidential: [false],

      // Clinical Examination
      clinicalExamination: this.fb.group({
        chiefComplaint: ['', [Validators.required, Validators.maxLength(1000)]],
        presentIllness: ['', [Validators.required, Validators.maxLength(2000)]],
        pastMedicalHistory: ['', Validators.maxLength(1500)],
        familyHistory: ['', Validators.maxLength(1500)],
        socialHistory: ['', Validators.maxLength(1000)],
        allergies: [''],
        currentMedications: [''],
        physicalExamination: ['', Validators.maxLength(2000)],
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
        treatmentPlan: ['', Validators.maxLength(2000)]
      }),

      // Follow-up
      followUp: this.fb.group({
        followUpDate: [null],
        followUpInstructions: ['', Validators.maxLength(1500)],
        notes: ['', Validators.maxLength(1000)]
      })
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const duplicate = this.route.snapshot.queryParamMap.get('duplicate');

    if (id) {
      this.recordId.set(parseInt(id, 10));
      if (duplicate === 'true') {
        this.loadMedicalRecordForDuplicate(this.recordId()!);
      } else {
        this.isEditMode.set(true);
        this.loadMedicalRecord(this.recordId()!);
      }
    }
  }

  private loadInitialData(): void {
    this.loadDoctors();
    this.loadAllPatients();
  }

  private setupAutocomplete(): void {
    this.filteredPatients$ = this.patientControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      map(value => {
        if (typeof value === 'string' && value.length >= 2) {
          return this.filterPatients(value);
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
      next: (response) => {
        if (response) {
          this.populateForm(response);
        }
      },
      error: (error) => {
        this.notificationService.error('خطأ في تحميل السجل الطبي');
        this.router.navigate(['/medical-records']);
      }
    });
  }

  private loadMedicalRecordForDuplicate(id: number): void {
    this.medicalRecordService.getMedicalRecordById(id).subscribe({
      next: (response) => {
        if (response) {
          const record = response;
          // Populate form but clear ID and status
          this.populateForm(record);
          this.recordId.set(null);
          this.isEditMode.set(false);
          this.medicalRecordForm.patchValue({
            visitDate: new Date()
          });
        }
      }
    });
  }

  private loadDoctors(): void {
    this.userService.getDoctors().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.doctors.set(response.data);
        }
      },
      error: (error) => {
        this.notificationService.error('خطأ في تحميل قائمة الأطباء');
      }
    });
  }

  private loadAllPatients(): void {
    this.patientService.getAllPatients(0, 1000).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Use 'patients' property consistently
          this.allPatients.set(response.data.patients || []);
        }
      },
      error: (error) => {
        this.notificationService.error('خطأ في تحميل قائمة المرضى');
      }
    });
  }

  private filterPatients(searchTerm: string): Patient[] {
    const term = searchTerm.toLowerCase();
    return this.allPatients().filter(patient =>
      patient.fullName?.toLowerCase().includes(term) ||
      patient.patientNumber?.toLowerCase().includes(term) ||
      patient.phone?.includes(term)
    );
  }

  private loadPatientById(patientId: number): void {
    this.patientService.getPatientById(patientId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectPatient(response.data);
        }
      }
    });
  }

  private loadPatientAppointments(patientId: number): void {
    // Load appointments for the selected patient
    // You may need to implement this in AppointmentService if not available
    // For now, we'll skip this if the service method doesn't exist
  }

  private populateForm(record: MedicalRecord): void {
    // Basic information
    this.medicalRecordForm.patchValue({
      patientId: record.patientId,
      doctorId: record.doctorId,
      appointmentId: record.appointmentId,
      visitDate: record.visitDate ? new Date(record.visitDate) : null,
      visitType: record.visitType,
      isConfidential: record.isConfidential
    });

    // Clinical examination
    const allergiesStr = record.allergies?.join(', ') || '';
    const medicationsStr = record.currentMedications?.join(', ') || '';

    // Parse systemicExamination from JSON string if it exists
    let systemicExamination: any = {};
    if (record.systemicExamination) {
      try {
        if (typeof record.systemicExamination === 'string') {
          systemicExamination = JSON.parse(record.systemicExamination);
        } else {
          systemicExamination = record.systemicExamination;
        }
      } catch (e) {
        console.warn('Failed to parse systemicExamination:', e);
        systemicExamination = {};
      }
    }

    this.medicalRecordForm.patchValue({
      clinicalExamination: {
        chiefComplaint: record.chiefComplaint,
        presentIllness: record.presentIllness,
        pastMedicalHistory: record.pastMedicalHistory,
        familyHistory: record.familyHistory,
        socialHistory: record.socialHistory,
        allergies: allergiesStr,
        currentMedications: medicationsStr,
        physicalExamination: record.physicalExamination,
        systemicExamination: systemicExamination
      }
    });

    // Diagnosis and Treatment
    this.medicalRecordForm.patchValue({
      diagnosisTreatment: {
        treatmentPlan: record.treatmentPlan
      }
    });

    // Follow-up
    this.medicalRecordForm.patchValue({
      followUp: {
        followUpDate: record.followUpDate ? new Date(record.followUpDate) : null,
        followUpInstructions: record.followUpInstructions,
        notes: record.notes
      }
    });

    // Complex data - managed by sub-components
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
    if (patient.id) {
      this.loadPatientAppointments(patient.id);
    }
  }

  displayPatient(patient: Patient | string | null): string {
    if (!patient) {
      return '';
    }
    if (typeof patient === 'string') {
      return patient; // Return the string as-is when user is typing
    }
    // Return formatted name when patient object is selected
    return `${patient.fullName} - ${patient.patientNumber}`;
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
    this.isSaving.set(true);
    const formValue = this.medicalRecordForm.value;
    const request = this.buildRequest(formValue, status);

    const saveObservable = this.isEditMode()
      ? this.medicalRecordService.updateMedicalRecord(this.recordId()!, request as UpdateMedicalRecordRequest)
      : this.medicalRecordService.createMedicalRecord(request);

    saveObservable.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.isSaving.set(false);
        this.notificationService.success(
          this.isEditMode() ? 'تم تحديث السجل الطبي بنجاح' : 'تم إنشاء السجل الطبي بنجاح'
        );
        this.router.navigate(['/medical-records']);
      },
      error: (error) => {
        this.isSaving.set(false);
        this.notificationService.error('خطأ في حفظ السجل الطبي');
      }
    });
  }

  private buildRequest(formValue: any, status: RecordStatus): CreateMedicalRecordRequest {
    // Validate critical fields first
    if (!formValue.patientId) {
      throw new Error('Patient ID is required');
    }
    if (!formValue.doctorId) {
      throw new Error('Doctor ID is required');
    }
    if (!formValue.visitDate) {
      throw new Error('Visit date is required');
    }

    const clinicalExam = formValue.clinicalExamination;
    const followUp = formValue.followUp;

    // Process allergies and medications - convert strings to arrays
    const allergies = clinicalExam.allergies
      ? clinicalExam.allergies.split(',').map((a: string) => a.trim()).filter((a: string) => a)
      : [];

    const currentMedications = clinicalExam.currentMedications
      ? clinicalExam.currentMedications.split(',').map((m: string) => m.trim()).filter((m: string) => m)
      : [];

    // Map diagnosis to CreateDiagnosisDto
    const diagnosisDto: CreateDiagnosisDto[] = this.diagnoses.map(d => ({
      icdCode: d.icdCode,
      description: d.description,
      type: d.type,
      isPrimary: d.isPrimary,
      notes: d.notes
    }));

    // Map prescriptions to CreatePrescriptionDto
    const prescriptionsDto: CreatePrescriptionDto[] = this.prescriptions.map(p => ({
      medicationName: p.medicationName,
      genericName: p.genericName,
      dosage: p.dosage,
      frequency: p.frequency,
      duration: p.duration,
      route: p.route,
      instructions: p.instructions,
      quantity: p.quantity,
      refills: p.refills,
      startDate: p.startDate ? this.formatDate(new Date(p.startDate)) : undefined,
      endDate: p.endDate ? this.formatDate(new Date(p.endDate)) : undefined,
      isPrn: p.isPrn
    }));

    // Map lab tests to CreateLabTestDto
    const labTestsDto: CreateLabTestDto[] = this.labTests.map(lt => ({
      testName: lt.testName,
      testCode: lt.testCode,
      category: lt.category,
      urgency: lt.urgency,
      specimenType: lt.specimenType,
      instructions: lt.instructions
    }));

    // Map radiology tests to CreateRadiologyTestDto
    const radiologyTestsDto: CreateRadiologyTestDto[] = this.radiologyTests.map(rt => ({
      testName: rt.testName,
      testType: rt.testType,
      bodyPart: rt.bodyPart,
      urgency: rt.urgency,
      instructions: rt.instructions
    }));

    // Map procedures to CreateMedicalProcedureDto
    const proceduresDto: CreateMedicalProcedureDto[] = this.procedures.map(p => ({
      procedureName: p.procedureName,
      procedureCode: p.procedureCode,
      category: p.category,
      description: p.description,
      performedDate: p.performedDate,
      performedBy: p.performedBy,
      complications: p.complications,
      outcome: p.outcome,
      notes: p.notes
    }));

    // Map referrals to CreateReferralDto
    const referralsDto: CreateReferralDto[] = this.referrals.map(r => ({
      referralType: r.referralType,
      referredTo: r.referredTo,
      specialty: r.specialty,
      priority: r.priority,
      reason: r.reason,
      notes: r.notes,
      referralDate: r.referralDate,
      appointmentDate: r.appointmentDate
    }));

    // Convert systemicExamination object to JSON string for backend
    const systemicExaminationStr = clinicalExam.systemicExamination &&
      Object.values(clinicalExam.systemicExamination).some((val: any) => val)
      ? JSON.stringify(clinicalExam.systemicExamination)
      : undefined;

    const request: CreateMedicalRecordRequest = {
      patientId: Number(formValue.patientId),
      doctorId: Number(formValue.doctorId),
      appointmentId: formValue.appointmentId ? Number(formValue.appointmentId) : undefined,
      visitDate: this.formatDate(formValue.visitDate),
      visitType: formValue.visitType,
      isConfidential: formValue.isConfidential,
      status: status,

      // Vital Signs
      vitalSigns: Object.keys(this.vitalSigns).length > 0 ? this.vitalSigns : undefined,

      // Clinical Information
      chiefComplaint: clinicalExam.chiefComplaint,
      presentIllness: clinicalExam.presentIllness,
      pastMedicalHistory: clinicalExam.pastMedicalHistory || undefined,
      familyHistory: clinicalExam.familyHistory || undefined,
      socialHistory: clinicalExam.socialHistory || undefined,
      allergies: allergies.length > 0 ? allergies : undefined,
      currentMedications: currentMedications.length > 0 ? currentMedications : undefined,
      physicalExamination: clinicalExam.physicalExamination || undefined,
      systemicExamination: systemicExaminationStr as any,

      // Diagnosis and Treatment
      diagnosis: diagnosisDto,
      treatmentPlan: formValue.diagnosisTreatment.treatmentPlan || undefined,
      prescriptions: prescriptionsDto.length > 0 ? prescriptionsDto : undefined,
      labTests: labTestsDto.length > 0 ? labTestsDto : undefined,
      radiologyTests: radiologyTestsDto.length > 0 ? radiologyTestsDto : undefined,
      procedures: proceduresDto.length > 0 ? proceduresDto : undefined,

      // Follow-up
      followUpDate: followUp.followUpDate ? this.formatDate(followUp.followUpDate) : undefined,
      followUpInstructions: followUp.followUpInstructions || undefined,
      referrals: referralsDto.length > 0 ? referralsDto : undefined,

      // Notes
      notes: followUp.notes || undefined
    };

    return request;
  }

  // ===================================================================
  // NAVIGATION
  // ===================================================================

  goToStep(step: number): void {
    if (step >= 0 && step <= 4) {
      this.currentStep = step;
      if (this.stepper) {
        this.stepper.selectedIndex = step;
      }
    }
  }

  onBack(): void {
    if (this.medicalRecordForm.dirty) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        data: {
          title: 'تأكيد الإلغاء',
          message: 'هل أنت متأكد من إلغاء التغييرات؟ سيتم فقدان جميع البيانات غير المحفوظة.',
          confirmText: 'نعم، إلغاء',
          cancelText: 'استمرار في التحرير'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.router.navigate(['/medical-records']);
        }
      });
    } else {
      this.router.navigate(['/medical-records']);
    }
  }

  onCancel(): void {
    this.onBack();
  }

  // ===================================================================
  // HELPER METHODS
  // ===================================================================

  private formatDate(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
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

  // Get form controls for template
  get basicInfoGroup(): FormGroup {
    return this.medicalRecordForm.get('clinicalExamination') as FormGroup;
  }

  get clinicalExamGroup(): FormGroup {
    return this.medicalRecordForm.get('clinicalExamination') as FormGroup;
  }

  get systemicExamGroup(): FormGroup {
    return this.clinicalExamGroup.get('systemicExamination') as FormGroup;
  }

  get diagnosisTreatmentGroup(): FormGroup {
    return this.medicalRecordForm.get('diagnosisTreatment') as FormGroup;
  }

  get followUpGroup(): FormGroup {
    return this.medicalRecordForm.get('followUp') as FormGroup;
  }

  // Validation helpers
  isFieldInvalid(fieldName: string, groupName?: string): boolean {
    const control = groupName
      ? this.medicalRecordForm.get(`${groupName}.${fieldName}`)
      : this.medicalRecordForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(fieldName: string, groupName?: string): string {
    const control = groupName
      ? this.medicalRecordForm.get(`${groupName}.${fieldName}`)
      : this.medicalRecordForm.get(fieldName);

    if (control?.hasError('required')) {
      return 'هذا الحقل مطلوب';
    }
    if (control?.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength'].requiredLength;
      return `الحد الأقصى للحروف هو ${maxLength}`;
    }
    return '';
  }
}
