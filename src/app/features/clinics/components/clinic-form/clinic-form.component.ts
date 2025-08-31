// ===================================================================
// Clinic Form Component
// src/app/features/clinics/components/clinic-form/clinic-form.component.ts
// ===================================================================

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// Services & Models
import { ClinicService } from '../../services/clinic.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  Clinic,
  CreateClinicRequest,
  UpdateClinicRequest,
  SubscriptionPlan,
  WorkingDay,
  SUBSCRIPTION_FEATURES,
  WORKING_DAYS_CONFIG
} from '../../models/clinic.model';

@Component({
  selector: 'app-clinic-form',
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
    MatCheckboxModule,
    MatStepperModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    MatChipsModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './clinic-form.component.html',
  styleUrl: './clinic-form.component.scss'
})
export class ClinicFormComponent implements OnInit {
  // Services
  private clinicService = inject(ClinicService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  // Signals
  loading = signal(false);
  saving = signal(false);
  isEditMode = signal(false);
  clinicId = signal<number | null>(null);
  selectedClinic = signal<Clinic | null>(null);

  // Forms
  basicInfoForm!: FormGroup;
  contactInfoForm!: FormGroup;
  workingHoursForm!: FormGroup;
  subscriptionForm!: FormGroup;

  // Enums for template
  SubscriptionPlan = SubscriptionPlan;
  WorkingDay = WorkingDay;
  SUBSCRIPTION_FEATURES = SUBSCRIPTION_FEATURES;
  WORKING_DAYS_CONFIG = WORKING_DAYS_CONFIG;

  // Working days options
  workingDaysOptions = Object.values(WorkingDay);

  ngOnInit(): void {
    this.initializeForms();
    this.checkEditMode();
  }

  private initializeForms(): void {
    // Basic Information Form
    this.basicInfoForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      timezone: ['Asia/Riyadh'],
      language: ['ar', Validators.required],
      currency: ['SAR', Validators.required]
    });

    // Contact Information Form
    this.contactInfoForm = this.fb.group({
      address: ['', [Validators.required, Validators.minLength(10)]],
      phone: ['', [Validators.required, Validators.pattern(/^(\+966|0)?[0-9]{9}$/)]],
      email: ['', [Validators.required, Validators.email]],
      website: ['', [Validators.pattern(/^https?:\/\/.+\..+/)]]
    });

    // Working Hours Form
    this.workingHoursForm = this.fb.group({
      workingHoursStart: ['09:00', Validators.required],
      workingHoursEnd: ['17:00', Validators.required],
      workingDays: [
        [WorkingDay.SUNDAY, WorkingDay.MONDAY, WorkingDay.TUESDAY, WorkingDay.WEDNESDAY, WorkingDay.THURSDAY],
        [Validators.required, this.minWorkingDaysValidator]
      ]
    });

    // Subscription Form
    this.subscriptionForm = this.fb.group({
      subscriptionPlan: [SubscriptionPlan.BASIC, Validators.required]
    });

    // Add custom validators
    this.addCustomValidators();
  }

  private addCustomValidators(): void {
    // Async validator for clinic name uniqueness
    this.basicInfoForm.get('name')?.addAsyncValidators(
      this.clinicNameValidator.bind(this)
    );

    // Working hours validation
    this.workingHoursForm.addValidators(this.workingHoursRangeValidator);
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.clinicId.set(+id);
      this.loadClinic(+id);
    }
  }

  private loadClinic(id: number): void {
    this.loading.set(true);
    this.clinicService.getClinicById(id).subscribe({
      next: (clinic) => {
        this.selectedClinic.set(clinic);
        this.populateForm(clinic);
        this.loading.set(false);
      },
      error: (error) => {
        this.notificationService.error('فشل في تحميل بيانات العيادة');
        console.error('Error loading clinic:', error);
        this.router.navigate(['/clinics']);
      }
    });
  }

  private populateForm(clinic: Clinic): void {
    // Basic Information
    this.basicInfoForm.patchValue({
      name: clinic.name,
      description: clinic.description,
      timezone: clinic.timezone,
      language: clinic.language,
      currency: clinic.currency
    });

    // Contact Information
    this.contactInfoForm.patchValue({
      address: clinic.address,
      phone: clinic.phone,
      email: clinic.email,
      website: clinic.website
    });

    // Working Hours
    this.workingHoursForm.patchValue({
      workingHoursStart: clinic.workingHoursStart,
      workingHoursEnd: clinic.workingHoursEnd,
      workingDays: clinic.workingDays
    });

    // Subscription
    this.subscriptionForm.patchValue({
      subscriptionPlan: clinic.subscriptionPlan
    });
  }

  // ===================================================================
  // FORM VALIDATION
  // ===================================================================

  // Custom validator for minimum working days
  private minWorkingDaysValidator(control: any): { [key: string]: any } | null {
    const workingDays = control.value;
    return workingDays && workingDays.length >= 1 ? null : { minWorkingDays: true };
  }

  // Working hours range validator
  private workingHoursRangeValidator(form: AbstractControl): { [key: string]: any } | null {
    const start = form.get('workingHoursStart')?.value;
    const end = form.get('workingHoursEnd')?.value;

    if (!start || !end) return null;

    const startTime = new Date(`2000-01-01T${start}:00`);
    const endTime = new Date(`2000-01-01T${end}:00`);

    if (startTime >= endTime) {
      return { invalidTimeRange: true };
    }

    // Minimum 2 hours difference
    const diffHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (diffHours < 2) {
      return { minimumHours: true };
    }

    return null;
  }

  // Async validator for clinic name uniqueness
  private clinicNameValidator = (control: any) => {
    if (!control.value || control.value.length < 2) {
      return Promise.resolve(null);
    }

    const excludeId = this.isEditMode() ? this.clinicId() : undefined;

    return this.clinicService.validateClinicName(control.value, excludeId!)
      .toPromise()
      .then(isUnique => {
        return isUnique ? null : { clinicNameExists: true };
      });
  };

  // ===================================================================
  // EVENT HANDLERS
  // ===================================================================

  onWorkingDayToggle(day: WorkingDay, event: any): void {
    const workingDays = this.workingHoursForm.get('workingDays')?.value || [];

    if (event.checked) {
      if (!workingDays.includes(day)) {
        workingDays.push(day);
      }
    } else {
      const index = workingDays.indexOf(day);
      if (index > -1) {
        workingDays.splice(index, 1);
      }
    }

    this.workingHoursForm.patchValue({ workingDays });
  }

  onSubscriptionPlanChange(plan: SubscriptionPlan): void {
    this.subscriptionForm.patchValue({ subscriptionPlan: plan });
  }

  onCancel(): void {
    if (this.isEditMode()) {
      this.router.navigate(['/clinics', this.clinicId()]);
    } else {
      this.router.navigate(['/clinics']);
    }
  }

  onSave(): void {
    if (!this.isFormValid()) {
      this.notificationService.error('يرجى التحقق من صحة البيانات المدخلة');
      return;
    }

    this.saving.set(true);

    if (this.isEditMode()) {
      this.updateClinic();
    } else {
      this.createClinic();
    }
  }

  private createClinic(): void {
    const request: CreateClinicRequest = this.buildCreateRequest();

    this.clinicService.createClinic(request).subscribe({
      next: (clinic) => {
        this.notificationService.success('تم إنشاء العيادة بنجاح');
        this.router.navigate(['/clinics', clinic.id]);
      },
      error: (error) => {
        this.notificationService.error('فشل في إنشاء العيادة');
        console.error('Error creating clinic:', error);
        this.saving.set(false);
      }
    });
  }

  private updateClinic(): void {
    const request: UpdateClinicRequest = this.buildUpdateRequest();

    this.clinicService.updateClinic(this.clinicId()!, request).subscribe({
      next: (clinic) => {
        this.notificationService.success('تم تحديث العيادة بنجاح');
        this.router.navigate(['/clinics', clinic.id]);
      },
      error: (error) => {
        this.notificationService.error('فشل في تحديث العيادة');
        console.error('Error updating clinic:', error);
        this.saving.set(false);
      }
    });
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================

  private buildCreateRequest(): CreateClinicRequest {
    return {
      ...this.basicInfoForm.value,
      ...this.contactInfoForm.value,
      ...this.workingHoursForm.value,
      ...this.subscriptionForm.value
    };
  }

  private buildUpdateRequest(): UpdateClinicRequest {
    return {
      ...this.basicInfoForm.value,
      ...this.contactInfoForm.value,
      ...this.workingHoursForm.value
    };
  }

  private isFormValid(): boolean {
    const forms = [
      this.basicInfoForm,
      this.contactInfoForm,
      this.workingHoursForm,
      this.subscriptionForm
    ];

    let isValid = true;

    forms.forEach(form => {
      if (form.invalid) {
        Object.keys(form.controls).forEach(key => {
          form.controls[key].markAsTouched();
        });
        isValid = false;
      }
    });

    return isValid;
  }

  isWorkingDaySelected(day: WorkingDay): boolean {
    const workingDays = this.workingHoursForm.get('workingDays')?.value || [];
    return workingDays.includes(day);
  }

  getWorkingDayName(day: WorkingDay): string {
    return WORKING_DAYS_CONFIG[day].name;
  }

  getSubscriptionFeatures(plan: SubscriptionPlan): string[] {
    return SUBSCRIPTION_FEATURES[plan].features;
  }

  getFormErrorMessage(formName: string, fieldName: string): string {
    const form = (this as any)[`${formName}Form`] as FormGroup;
    const field = form.get(fieldName);

    if (!field?.errors || !field.touched) return '';

    const errors = field.errors;

    if (errors['required']) return 'هذا الحقل مطلوب';
    if (errors['email']) return 'البريد الإلكتروني غير صحيح';
    if (errors['pattern']) return 'تنسيق البيانات غير صحيح';
    if (errors['minLength']) return `الحد الأدنى ${errors['minLength'].requiredLength} أحرف`;
    if (errors['maxLength']) return `الحد الأقصى ${errors['maxLength'].requiredLength} حرف`;
    if (errors['clinicNameExists']) return 'اسم العيادة موجود بالفعل';
    if (errors['minWorkingDays']) return 'يجب اختيار يوم عمل واحد على الأقل';

    return 'البيانات غير صحيحة';
  }

  hasFormError(formName: string, fieldName: string): boolean {
    const form = (this as any)[`${formName}Form`] as FormGroup;
    const field = form.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  getWorkingHoursError(): string {
    const form = this.workingHoursForm;
    if (!form.errors) return '';

    if (form.errors['invalidTimeRange']) return 'وقت الانتهاء يجب أن يكون بعد وقت البداية';
    if (form.errors['minimumHours']) return 'يجب أن يكون الفرق ساعتين على الأقل';

    return '';
  }

  hasWorkingHoursError(): boolean {
    return !!(this.workingHoursForm.errors && this.workingHoursForm.touched);
  }

  getSubscriptionFeature(property: keyof typeof SUBSCRIPTION_FEATURES[SubscriptionPlan]): any {
    const plan = this.subscriptionForm.get('subscriptionPlan')?.value;
    if (plan && plan in SUBSCRIPTION_FEATURES) {
      return SUBSCRIPTION_FEATURES[plan as SubscriptionPlan][property];
    }
    return null;
  }

}
