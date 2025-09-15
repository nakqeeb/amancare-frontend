// ===================================================================
// src/app/features/patients/components/patient-form/patient-form.component.ts
// Updated to use integrated PatientService with Spring Boot APIs
// ===================================================================
import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDividerModule } from '@angular/material/divider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Subject, takeUntil } from 'rxjs';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// Services & Models
import { PatientService } from '../../services/patient.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  Patient,
  CreatePatientRequest,
  UpdatePatientRequest,
  Gender,
  BloodType,
  BLOOD_TYPE_OPTIONS,
  GENDER_OPTIONS,
  PATIENT_CONSTANTS,
  calculateAge
} from '../../models/patient.model';

function phoneValidator(control: AbstractControl): ValidationErrors | null {
  const phone = control.value;
  if (!phone) return null;

  // يقبل:
  // 1. محلي: 7x أو 71 أو 73 أو 70 + 7 أرقام
  // 2. دولي: +967 أو 00967 ثم (7x أو 71 أو 73 أو 70) + 7 أرقام
  const phoneRegex = /^(?:((78|77|71|73|70)\d{7})|((\+967|00967)(78|77|71|73|70)\d{7}))$/;

  return phoneRegex.test(phone) ? null : { invalidPhone: true };
}

@Component({
  selector: 'app-patient-form',
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
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    MatDividerModule,
    MatToolbarModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './patient-form.component.html',
  styleUrl: './patient-form.component.scss'
})
export class PatientFormComponent implements OnInit, OnDestroy {
  // Services
  private patientService = inject(PatientService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  // Destroy subject for unsubscribing
  private destroy$ = new Subject<void>();

  // ===================================================================
  // STATE MANAGEMENT
  // ===================================================================

  // UI State signals
  loading = signal(false);
  saving = signal(false);
  isEditMode = signal(false);
  patientId = signal<number | null>(null);
  currentPatient = signal<Patient | null>(null);

  // Form Groups
  patientForm!: FormGroup;
  basicInfoGroup!: FormGroup;
  contactInfoGroup!: FormGroup;
  medicalInfoGroup!: FormGroup;

  // Dropdown options
  bloodTypes = BLOOD_TYPE_OPTIONS;
  genders = GENDER_OPTIONS;

  // Constants
  readonly maxDate = new Date(); // Can't be born in the future
  readonly minDate = new Date(1900, 0, 1); // Reasonable minimum date

  // ===================================================================
  // LIFECYCLE HOOKS
  // ===================================================================

  ngOnInit(): void {
    this.initializeForms();
    this.checkEditMode();
    this.setupFormValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.patientService.clearSelectedPatient();
  }

  // ===================================================================
  // FORM INITIALIZATION
  // ===================================================================

  private initializeForms(): void {
    // Basic Information Form Group
    this.basicInfoGroup = this.fb.group({
      firstName: ['', [
        Validators.required,
        Validators.maxLength(PATIENT_CONSTANTS.MAX_NAME_LENGTH),
        Validators.pattern(/^[a-zA-Zأ-ي\s]+$/)
      ]],
      lastName: ['', [
        Validators.required,
        Validators.maxLength(PATIENT_CONSTANTS.MAX_NAME_LENGTH),
        Validators.pattern(/^[a-zA-Zأ-ي\s]+$/)
      ]],
      dateOfBirth: ['', Validators.required],
      gender: ['', Validators.required],
      bloodType: ['']
    });

    // Contact Information Form Group
    this.contactInfoGroup = this.fb.group({
      phone: ['', [
        Validators.required,
        /* Validators.pattern(PATIENT_CONSTANTS.PHONE_PATTERN) */ phoneValidator
      ]],
      email: ['', [
        Validators.email,
        Validators.maxLength(PATIENT_CONSTANTS.MAX_EMAIL_LENGTH)
      ]],
      address: ['', [
        Validators.maxLength(PATIENT_CONSTANTS.MAX_ADDRESS_LENGTH)
      ]],
      emergencyContactName: ['', [
        Validators.maxLength(PATIENT_CONSTANTS.MAX_NAME_LENGTH),
      ]],
      emergencyContactPhone: ['', [
        /* Validators.pattern(PATIENT_CONSTANTS.PHONE_PATTERN) */ phoneValidator
      ]]
    });

    // Medical Information Form Group
    this.medicalInfoGroup = this.fb.group({
      allergies: ['', [
        Validators.maxLength(PATIENT_CONSTANTS.MAX_ALLERGIES_LENGTH)
      ]],
      chronicDiseases: ['', [
        Validators.maxLength(PATIENT_CONSTANTS.MAX_CHRONIC_DISEASES_LENGTH)
      ]],
      notes: ['', [
        Validators.maxLength(PATIENT_CONSTANTS.MAX_NOTES_LENGTH)
      ]]
    });

    // Main Patient Form
    this.patientForm = this.fb.group({
      basicInfo: this.basicInfoGroup,
      contactInfo: this.contactInfoGroup,
      medicalInfo: this.medicalInfoGroup
    });
  }

  private setupFormValidation(): void {
    // Custom validators and form logic can be added here
    this.basicInfoGroup.get('dateOfBirth')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(date => {
        if (date) {
          const age = calculateAge(date);
          if (age < 0 || age > PATIENT_CONSTANTS.MAX_AGE) {
            this.basicInfoGroup.get('dateOfBirth')?.setErrors({ 'invalidAge': true });
          }
        }
      });
  }

  // ===================================================================
  // EDIT MODE HANDLING
  // ===================================================================

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.patientId.set(+id);
      this.loadPatient(+id);
    }
  }

  private loadPatient(id: number): void {
    this.loading.set(true);

    this.patientService.getPatientById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.currentPatient.set(response.data!);
            this.populateForm(response.data!);
          }
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          this.notificationService.error('فشل في تحميل بيانات المريض');
          this.router.navigate(['/patients']);
        }
      });
  }

  private populateForm(patient: Patient): void {
    // Populate basic info
    this.basicInfoGroup.patchValue({
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: new Date(patient.dateOfBirth),
      gender: patient.gender,
      bloodType: patient.bloodType || ''
    });

    // Populate contact info
    this.contactInfoGroup.patchValue({
      phone: patient.phone,
      email: patient.email || '',
      address: patient.address || '',
      emergencyContactName: patient.emergencyContactName || '',
      emergencyContactPhone: patient.emergencyContactPhone || ''
    });

    // Populate medical info
    this.medicalInfoGroup.patchValue({
      allergies: patient.allergies || '',
      chronicDiseases: patient.chronicDiseases || '',
      notes: patient.notes || ''
    });
  }

  // ===================================================================
  // FORM SUBMISSION
  // ===================================================================

  onSubmit(): void {
    if (this.patientForm.invalid) {
      console.log(this.patientForm);
      this.markFormGroupTouched(this.patientForm);
      this.notificationService.error('يرجى تصحيح الأخطاء في النموذج');
      return;
    }

    this.saving.set(true);

    if (this.isEditMode()) {
      this.updatePatient();
    } else {
      this.createPatient();
    }
  }

  private createPatient(): void {
    const formData = this.getFormData();
    const createRequest: CreatePatientRequest = {
      firstName: formData.basicInfo.firstName,
      lastName: formData.basicInfo.lastName,
      dateOfBirth: this.formatDateForApi(formData.basicInfo.dateOfBirth),
      gender: formData.basicInfo.gender,
      phone: formData.contactInfo.phone,
      email: formData.contactInfo.email || undefined,
      address: formData.contactInfo.address || undefined,
      emergencyContactName: formData.contactInfo.emergencyContactName || undefined,
      emergencyContactPhone: formData.contactInfo.emergencyContactPhone || undefined,
      bloodType: formData.basicInfo.bloodType || undefined,
      allergies: formData.medicalInfo.allergies || undefined,
      chronicDiseases: formData.medicalInfo.chronicDiseases || undefined,
      notes: formData.medicalInfo.notes || undefined
    };

    this.patientService.createPatient(createRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.notificationService.success('تم إنشاء المريض بنجاح');
            this.router.navigate(['/patients', response.data!.id]);
          }
          this.saving.set(false);
        },
        error: (error) => {
          this.saving.set(false);
          this.notificationService.error('فشل في إنشاء المريض');
        }
      });
  }

  private updatePatient(): void {
    const patientId = this.patientId();
    if (!patientId) return;

    const formData = this.getFormData();
    const updateRequest: UpdatePatientRequest = {
      firstName: formData.basicInfo.firstName,
      lastName: formData.basicInfo.lastName,
      dateOfBirth: this.formatDateForApi(formData.basicInfo.dateOfBirth),
      gender: formData.basicInfo.gender,
      phone: formData.contactInfo.phone,
      email: formData.contactInfo.email || undefined,
      address: formData.contactInfo.address || undefined,
      emergencyContactName: formData.contactInfo.emergencyContactName || undefined,
      emergencyContactPhone: formData.contactInfo.emergencyContactPhone || undefined,
      bloodType: formData.basicInfo.bloodType || undefined,
      allergies: formData.medicalInfo.allergies || undefined,
      chronicDiseases: formData.medicalInfo.chronicDiseases || undefined,
      notes: formData.medicalInfo.notes || undefined
    };

    this.patientService.updatePatient(patientId, updateRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.notificationService.success('تم تحديث بيانات المريض بنجاح');
            this.router.navigate(['/patients', patientId]);
          }
          this.saving.set(false);
        },
        error: (error) => {
          this.saving.set(false);
          this.notificationService.error('فشل في تحديث بيانات المريض');
        }
      });
  }

  getGenderDisplayValue(): string {
    const genderValue = this.basicInfoGroup.get('gender')?.value;
    if (!genderValue) return '-';

    const gender = this.genders.find(g => g.value === genderValue);
    return gender ? gender.arabic : '-';
  }

  getBloodTypeDisplayValue(): string {
    const bloodTypeValue = this.basicInfoGroup.get('bloodType')?.value;
    if (!bloodTypeValue) return 'غير محدد';

    const bloodType = this.bloodTypes.find(bt => bt.value === bloodTypeValue);
    return bloodType ? bloodType.arabic : 'غير محدد';
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================

  private getFormData() {
    return {
      basicInfo: this.basicInfoGroup.value,
      contactInfo: this.contactInfoGroup.value,
      medicalInfo: this.medicalInfoGroup.value
    };
  }

  private formatDateForApi(date: Date): string {
    if (!date) return '';
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }

  // ===================================================================
  // EVENT HANDLERS
  // ===================================================================

  onCancel(): void {
    if (this.isEditMode()) {
      this.router.navigate(['/patients', this.patientId()]);
    } else {
      this.router.navigate(['/patients']);
    }
  }

  onReset(): void {
    if (this.isEditMode() && this.currentPatient()) {
      this.populateForm(this.currentPatient()!);
    } else {
      this.patientForm.reset();
    }
  }

  // ===================================================================
  // VALIDATION HELPERS
  // ===================================================================

  /**
   * Check if a form control has a specific error
   */
  hasError(controlName: string, errorType: string, formGroup?: FormGroup): boolean {
    const group = formGroup || this.patientForm;
    const control = group.get(controlName);
    return !!(control?.hasError(errorType) && (control?.dirty || control?.touched));
  }

  /**
   * Get error message for a form control
   */
  getErrorMessage(controlName: string, formGroup?: FormGroup): string {
    const group = formGroup || this.patientForm;
    const control = group.get(controlName);

    if (control?.hasError('required')) {
      return 'هذا الحقل مطلوب';
    }
    if (control?.hasError('email')) {
      return 'يرجى إدخال بريد إلكتروني صحيح';
    }
    if (control?.hasError('pattern')) {
      if (controlName.includes('phone') || controlName.includes('Phone')) {
        return 'يرجى إدخال رقم هاتف صحيح';
      }
      if (controlName.includes('name') || controlName.includes('Name')) {
        return 'يرجى إدخال اسم صحيح بدون أرقام أو رموز';
      }
      return 'التنسيق غير صحيح';
    }
    if (control?.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength'].requiredLength;
      return `الحد الأقصى ${maxLength} حرف`;
    }
    if (control?.hasError('invalidAge')) {
      return 'العمر غير صحيح';
    }

    return '';
  }

  /**
   * Check if form group is valid
   */
  isFormGroupValid(formGroup: FormGroup): boolean {
    return formGroup.valid;
  }

  /**
   * Get calculated age from date of birth
   */
  getCalculatedAge(): string {
    const dateOfBirth = this.basicInfoGroup.get('dateOfBirth')?.value;
    if (dateOfBirth) {
      const age = calculateAge(dateOfBirth);
      return `${age} سنة`;
    }
    return '';
  }

  /**
   * Get page title
   */
  getPageTitle(): string {
    return this.isEditMode() ? 'تعديل بيانات المريض' : 'إضافة مريض جديد';
  }

  /**
   * Get submit button text
   */
  getSubmitButtonText(): string {
    if (this.saving()) {
      return this.isEditMode() ? 'جاري الحفظ...' : 'جاري الإنشاء...';
    }
    return this.isEditMode() ? 'حفظ التغييرات' : 'إنشاء المريض';
  }
}
