// ===================================================================
// src/app/features/auth/components/register/register.component.ts
// مكون تسجيل عيادة جديدة
// ===================================================================
import { Component, inject, signal, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepper } from '@angular/material/stepper';
import { TranslateModule } from '@ngx-translate/core';

import {
  AuthService,
  ClinicRegistrationRequest
} from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

// Custom Validators
/*
  •	771234567 ✅
  •	781234567 ✅
  •	731234567 ✅
  •	701234567 ✅
  •	+967771234567 ✅
  •	00967781234567 ✅
*/
export function phoneValidator(control: AbstractControl): ValidationErrors | null {
  const phone = control.value;
  if (!phone) return null;

  // يقبل:
  // 1. محلي: 7x أو 71 أو 73 أو 70 + 7 أرقام
  // 2. دولي: +967 أو 00967 ثم (7x أو 71 أو 73 أو 70) + 7 أرقام
  const phoneRegex = /^(?:((78|77|71|73|70)\d{7})|((\+967|00967)(78|77|71|73|70)\d{7}))$/;

  return phoneRegex.test(phone) ? null : { invalidPhone: true };
}

function passwordStrengthValidator(control: AbstractControl) {
  const password = control.value;
  if (!password) return null;

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isLongEnough = password.length >= 8;

  if (!hasUpper || !hasLower || !hasNumber || !hasSpecial || !isLongEnough) {
    return { weakPassword: true };
  }

  return null;
}

function passwordMatchValidator(group: AbstractControl) {
  const password = group.get('adminPassword');
  const confirmPassword = group.get('confirmPassword');

  if (!password || !confirmPassword) {
    return null;
  }

  return password.value === confirmPassword.value ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    MatDividerModule,
    MatCheckboxModule,
    TranslateModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  // Stepper reference
  @ViewChild('stepper') stepper!: MatStepper;

  // Signals
  isLoading = signal(false);
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);

  // Form Groups
  clinicForm!: FormGroup;
  adminForm!: FormGroup;
  termsForm!: FormGroup;

  ngOnInit(): void {
    this.initializeForms();
  }

  private initializeForms(): void {
    this.clinicForm = this.fb.group({
      clinicName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      clinicDescription: ['', [Validators.maxLength(500)]],
      clinicAddress: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],
      clinicPhone: ['', [Validators.required, phoneValidator]],
      clinicEmail: ['', [Validators.required, Validators.email]]
    });

    this.adminForm = this.fb.group({
      adminFirstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      adminLastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      adminUsername: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      adminEmail: ['', [Validators.required, Validators.email]],
      adminPhone: ['', [phoneValidator]],
      adminPassword: ['', [Validators.required, passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: passwordMatchValidator });

    this.termsForm = this.fb.group({
      acceptTerms: [false, [Validators.requiredTrue]],
      acceptPrivacy: [false, [Validators.requiredTrue]],
      newsletterSubscribe: [false]
    });
  }

  // Form validation helpers
  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(formGroup: FormGroup, fieldName: string): string {
    const field = formGroup.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return `${fieldName} مطلوب`;
    if (field.errors['email']) return 'البريد الإلكتروني غير صحيح';
    if (field.errors['minlength']) return `يجب أن يكون على الأقل ${field.errors['minlength'].requiredLength} حروف`;
    if (field.errors['maxlength']) return `يجب أن لا يزيد عن ${field.errors['maxlength'].requiredLength} حرف`;
    if (field.errors['invalidPhone']) return 'رقم الهاتف غير صحيح';
    if (field.errors['weakPassword']) return 'كلمة المرور ضعيفة (8+ حروف، أرقام، رموز، أحرف كبيرة وصغيرة)';

    return 'خطأ في الحقل';
  }

  // Password strength checker
  checkPasswordStrength(password: string): {
    score: number;
    label: string;
    color: string;
  } {
    if (!password) return { score: 0, label: '', color: '' };

    let score = 0;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (password.length >= 8) score++;

    const levels = [
      { label: 'ضعيفة جداً', color: 'warn' },
      { label: 'ضعيفة', color: 'warn' },
      { label: 'متوسطة', color: 'accent' },
      { label: 'قوية', color: 'primary' },
      { label: 'قوية جداً', color: 'primary' }
    ];

    // return { score, ...levels[score] || levels[0] };
    // Make sure we don't exceed the array bounds
    const levelIndex = Math.min(score, levels.length - 1);

    return {
      score,
      label: levels[levelIndex].label,
      color: levels[levelIndex].color
    };
  }

  // Step navigation
  nextStep(): void {
    if (this.stepper) {
      this.stepper.next();
    }
  }

  previousStep(): void {
    if (this.stepper) {
      this.stepper.previous();
    }
  }

  canProceedToNextStep(): boolean {
    if (!this.stepper) return false;

    const currentStepIndex = this.stepper.selectedIndex;

    switch (currentStepIndex) {
      case 0: return this.clinicForm.valid;
      case 1: return this.adminForm.valid;
      case 2: return this.termsForm.valid;
      default: return false;
    }
  }

  // Form submission
  async onSubmit(): Promise<void> {
    if (!this.canProceedToNextStep()) {
      this.notificationService.error('يرجى تصحيح الأخطاء في النموذج');
      return;
    }

    this.isLoading.set(true);

    try {
      const request: ClinicRegistrationRequest = {
        // Clinic data
        ...this.clinicForm.value,
        // Admin data
        ...this.adminForm.value
      };

      // Remove confirm password from request
      delete (request as any).confirmPassword;

      const user = await this.authService.registerClinic(request).toPromise();

      this.notificationService.success('تم تسجيل العيادة بنجاح! يمكنك الآن تسجيل الدخول');

      // Navigate to login with success message
      this.router.navigate(['/auth/login'], {
        queryParams: {
          message: 'تم تسجيل العيادة بنجاح',
          username: request.adminUsername
        }
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.error?.message || error.message || 'فشل في تسجيل العيادة';
      this.notificationService.error(errorMessage);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Utility methods
  getPasswordStrength(): { score: number; label: string; color: string } {
    const password = this.adminForm.get('adminPassword')?.value || '';
    return this.checkPasswordStrength(password);
  }

  hasPasswordMismatch(): boolean {
    return this.adminForm.hasError('passwordMismatch') &&
      this.adminForm.get('confirmPassword')?.touched!;
  }
}
