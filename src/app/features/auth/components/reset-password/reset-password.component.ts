// ===================================================================
// 2. RESET PASSWORD COMPONENT
// src/app/features/auth/components/reset-password/reset-password.component.ts
// ===================================================================

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

// Password strength validator
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

// Password match validator
function passwordMatchValidator(group: AbstractControl) {
  const password = group.get('newPassword');
  const confirmPassword = group.get('confirmPassword');

  if (!password || !confirmPassword) return null;
  return password.value === confirmPassword.value ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-reset-password',
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
    MatDividerModule
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Signals
  isLoading = signal(false);
  isValidating = signal(true);
  isValidToken = signal(false);
  hideNewPassword = signal(true);
  hideConfirmPassword = signal(true);
  token = signal<string>('');

  // Form
  resetForm!: FormGroup;

  ngOnInit(): void {
    this.initializeForm();
    this.validateToken();
  }

  private initializeForm(): void {
    this.resetForm = this.fb.group({
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        passwordStrengthValidator
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: passwordMatchValidator });
  }

  private validateToken(): void {
    const token = this.route.snapshot.queryParams['token'];

    if (!token) {
      this.notificationService.error('رمز إعادة التعيين غير صحيح');
      this.router.navigate(['/auth/forgot-password']);
      return;
    }

    this.token.set(token);
    this.isValidating.set(true);

    this.authService.validateResetToken(token).subscribe({
      next: (isValid) => {
        this.isValidToken.set(isValid);
        this.isValidating.set(false);

        if (!isValid) {
          this.notificationService.error('انتهت صلاحية الرمز أو أنه غير صحيح');
        }
      },
      error: () => {
        this.isValidToken.set(false);
        this.isValidating.set(false);
      }
    });
  }

  // Password strength checker
  getPasswordStrength(): { score: number; label: string; color: string } {
    const password = this.resetForm.get('newPassword')?.value || '';
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

  hasPasswordMismatch(): boolean {
    return this.resetForm.hasError('passwordMismatch') &&
      this.resetForm.get('confirmPassword')?.touched!;
  }

  async onSubmit(): Promise<void> {
    if (this.resetForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading.set(true);

    try {
      await this.authService.resetPassword(
        this.token(),
        this.resetForm.value.newPassword
      ).toPromise();

      this.notificationService.success('تم تغيير كلمة المرور بنجاح');

      // Navigate to login with success message
      this.router.navigate(['/auth/login'], {
        queryParams: { message: 'تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول' }
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.resetForm.controls).forEach(key => {
      const control = this.resetForm.get(key);
      control?.markAsTouched();
    });
  }

  // Navigate back to forgot password
  goToForgotPassword(): void {
    this.router.navigate(['/auth/forgot-password']);
  }

  // Navigate to login
  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  hasUpperCase(): boolean {
    const password = this.resetForm.get('newPassword')?.value || '';
    return /[A-Z]/.test(password);
  }

  hasLowerCase(): boolean {
    const password = this.resetForm.get('newPassword')?.value || '';
    return /[a-z]/.test(password);
  }

  hasNumber(): boolean {
    const password = this.resetForm.get('newPassword')?.value || '';
    return /[0-9]/.test(password);
  }

  hasSpecialChar(): boolean {
    const password = this.resetForm.get('newPassword')?.value || '';
    return /[!@#$%^&*(),.?":{}|<>]/.test(password);
  }

  hasMinLength(): boolean {
    const password = this.resetForm.get('newPassword')?.value || '';
    return password.length >= 8;
  }
}
