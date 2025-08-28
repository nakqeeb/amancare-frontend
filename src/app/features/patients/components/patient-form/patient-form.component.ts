// ===================================================================
// src/app/features/patients/components/patient-form/patient-form.component.ts
// ===================================================================
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// Services & Models
import { PatientService } from '../../services/patient.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Patient, CreatePatientRequest, UpdatePatientRequest } from '../../models/patient.model';

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
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './patient-form.component.html',
  styleUrl: './patient-form.component.scss'
})

export class PatientFormComponent implements OnInit {
  // Services
  private patientService = inject(PatientService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  // Signals
  loading = signal(false);
  isEditMode = signal(false);
  patientId = signal<number | null>(null);

  // Form
  patientForm!: FormGroup;
  basicInfoGroup!: FormGroup;
  contactInfoGroup!: FormGroup;
  medicalInfoGroup!: FormGroup;

  // Data
  bloodTypes = this.patientService.getBloodTypes();
  genders = this.patientService.getGenders();

  constructor() {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.checkRouteParams();
  }

  private initializeForms(): void {
    // Basic Info Group
    this.basicInfoGroup = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      dateOfBirth: [''],
      gender: ['', Validators.required]
    });

    // Contact Info Group
    this.contactInfoGroup = this.fb.group({
      phone: ['', [Validators.required, Validators.pattern(/^05\d{8}$/)]],
      email: ['', Validators.email],
      address: [''],
      emergencyContactName: [''],
      emergencyContactPhone: ['', Validators.pattern(/^05\d{8}$/)]
    });

    // Medical Info Group
    this.medicalInfoGroup = this.fb.group({
      bloodType: [''],
      allergies: [''],
      chronicDiseases: [''],
      notes: [''],
      isActive: [true]
    });

    // Main Form
    this.patientForm = this.fb.group({
      ...this.basicInfoGroup.controls,
      ...this.contactInfoGroup.controls,
      ...this.medicalInfoGroup.controls
    });
  }

  private checkRouteParams(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.patientId.set(+id);
      this.loadPatient(+id);
    } else {
      this.isEditMode.set(false);
    }
  }

  private loadPatient(id: number): void {
    this.loading.set(true);

    this.patientService.getPatientById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.populateForm(response.data);
        }
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.notificationService.error('حدث خطأ في تحميل بيانات المريض');
        this.router.navigate(['/patients']);
      }
    });
  }

  private populateForm(patient: Patient): void {
    this.patientForm.patchValue({
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth) : null,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email,
      address: patient.address,
      bloodType: patient.bloodType,
      allergies: patient.allergies,
      chronicDiseases: patient.chronicDiseases,
      emergencyContactName: patient.emergencyContactName,
      emergencyContactPhone: patient.emergencyContactPhone,
      notes: patient.notes,
      isActive: patient.isActive
    });

    // Mark form as pristine after loading data
    this.patientForm.markAsPristine();
  }

  calculateAge(): string | null {
    const dateOfBirth = this.patientForm.get('dateOfBirth')?.value;

    if (!dateOfBirth) {
      return null;
    }

    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age >= 0 ? `${age}` : null;
  }

  onSubmit(): void {
    if (this.patientForm.invalid) {
      this.markFormGroupTouched();
      this.notificationService.warning('يرجى تصحيح الأخطاء في النموذج');
      return;
    }

    this.loading.set(true);

    const formData = this.prepareFormData();

    if (this.isEditMode()) {
      this.updatePatient(formData);
    } else {
      this.createPatient(formData as CreatePatientRequest);
    }
  }

  private prepareFormData(): CreatePatientRequest | UpdatePatientRequest {
    const formValue = this.patientForm.value;

    return {
      firstName: formValue.firstName?.trim(),
      lastName: formValue.lastName?.trim(),
      dateOfBirth: formValue.dateOfBirth ?
        new Date(formValue.dateOfBirth).toISOString().split('T')[0] : undefined,
      gender: formValue.gender,
      phone: formValue.phone?.trim(),
      email: formValue.email?.trim() || undefined,
      address: formValue.address?.trim() || undefined,
      bloodType: formValue.bloodType || undefined,
      allergies: formValue.allergies?.trim() || undefined,
      chronicDiseases: formValue.chronicDiseases?.trim() || undefined,
      emergencyContactName: formValue.emergencyContactName?.trim() || undefined,
      emergencyContactPhone: formValue.emergencyContactPhone?.trim() || undefined,
      notes: formValue.notes?.trim() || undefined,
      ...(this.isEditMode() && { isActive: formValue.isActive })
    };
  }

  private createPatient(patientData: CreatePatientRequest): void {
    this.patientService.createPatient(patientData).subscribe({
      next: (response) => {
        this.loading.set(false);
        if (response.success) {
          this.notificationService.success('تم إضافة المريض بنجاح');
          this.router.navigate(['/patients', response.data?.id]);
        }
      },
      error: (error) => {
        this.loading.set(false);
        this.notificationService.error('حدث خطأ في إضافة المريض');
      }
    });
  }

  private updatePatient(patientData: UpdatePatientRequest): void {
    const patientId = this.patientId();
    if (!patientId) return;

    this.patientService.updatePatient(patientId, patientData).subscribe({
      next: (response) => {
        this.loading.set(false);
        if (response.success) {
          this.notificationService.success('تم تحديث بيانات المريض بنجاح');
          this.patientForm.markAsPristine();
        }
      },
      error: (error) => {
        this.loading.set(false);
        this.notificationService.error('حدث خطأ في تحديث بيانات المريض');
      }
    });
  }

  onReset(): void {
    if (this.isEditMode()) {
      const patientId = this.patientId();
      if (patientId) {
        this.loadPatient(patientId);
      }
    } else {
      this.patientForm.reset({
        gender: '',
        isActive: true
      });
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.patientForm.controls).forEach(key => {
      const control = this.patientForm.get(key);
      control?.markAsTouched();
    });
  }

  // Validation helpers
  hasError(controlName: string, errorType: string): boolean {
    const control = this.patientForm.get(controlName);
    return !!(control?.hasError(errorType) && control.touched);
  }

  getErrorMessage(controlName: string): string {
    const control = this.patientForm.get(controlName);
    if (!control?.errors || !control.touched) return '';

    const errors = control.errors;

    if (errors['required']) return 'هذا الحقل مطلوب';
    if (errors['email']) return 'البريد الإلكتروني غير صحيح';
    if (errors['pattern']) return 'التنسيق غير صحيح';
    if (errors['minlength']) return `يجب أن يكون ${errors['minlength'].requiredLength} أحرف على الأقل`;
    if (errors['maxlength']) return `يجب أن يكون ${errors['maxlength'].requiredLength} أحرف كحد أقصى`;

    return 'قيمة غير صحيحة';
  }

  // Form state helpers
  isFormValid(): boolean {
    return this.patientForm.valid;
  }

  hasUnsavedChanges(): boolean {
    return this.patientForm.dirty;
  }

  // Navigation guard for unsaved changes
  canDeactivate(): boolean {
    if (this.hasUnsavedChanges()) {
      return confirm('لديك تغييرات غير محفوظة. هل أنت متأكد من المغادرة؟');
    }
    return true;
  }
}
