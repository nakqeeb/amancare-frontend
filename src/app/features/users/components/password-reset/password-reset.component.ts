// ===================================================================
// Password Reset Component
// src/app/features/users/components/password-reset/password-reset.component.ts
// ===================================================================
import { Component, inject, signal, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';

// Services & Models
import { UserService } from '../../services/user.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { User } from '../../models/user.model';

// Dialog data interface
export interface PasswordResetDialogData {
  user: User;
  mode: 'reset' | 'change';
}

// Custom validators
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
  const password = group.get('newPassword');
  const confirmPassword = group.get('confirmPassword');

  if (!password || !confirmPassword) {
    return null;
  }

  return password.value === confirmPassword.value ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-password-reset',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './password-reset.component.html',
  styleUrl: './password-reset.component.scss'
})
export class PasswordResetComponent {
  // Services
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);
  private dialogRef = inject(MatDialogRef<PasswordResetComponent>);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  // Injected data
  data: PasswordResetDialogData = inject(MAT_DIALOG_DATA);

  // Signals
  loading = signal(false);
  passwordVisible = signal(false);
  confirmPasswordVisible = signal(false);

  // Form
  passwordForm: FormGroup;

  constructor() {
    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: passwordMatchValidator });
  }

  // Form getters
  get newPassword() { return this.passwordForm.get('newPassword'); }
  get confirmPassword() { return this.passwordForm.get('confirmPassword'); }

  // Toggle password visibility
  togglePasswordVisibility(): void {
    this.passwordVisible.set(!this.passwordVisible());
  }

  toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordVisible.set(!this.confirmPasswordVisible());
  }

  // Generate random password
  generatePassword(): void {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';

    // Ensure at least one character from each category
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)];

    // Fill remaining characters
    for (let i = 4; i < 12; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }

    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');

    this.passwordForm.patchValue({
      newPassword: password,
      confirmPassword: password
    });

    // Show password temporarily
    this.passwordVisible.set(true);
    this.confirmPasswordVisible.set(true);

    // Copy to clipboard
    navigator.clipboard.writeText(password).then(() => {
      this.snackBar.open('تم نسخ كلمة المرور إلى الحافظة', 'إغلاق', {
        duration: 3000
      });
    });
  }

  // Copy password to clipboard
  copyPassword(): void {
    const password = this.newPassword?.value;
    if (password) {
      navigator.clipboard.writeText(password).then(() => {
        this.snackBar.open('تم نسخ كلمة المرور إلى الحافظة', 'إغلاق', {
          duration: 3000
        });
      });
    }
  }

  // Check password strength
  getPasswordStrength(): { level: string; color: string; width: string } {
    const password = this.newPassword?.value || '';
    if (!password) {
      return { level: '', color: '', width: '0%' };
    }

    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score < 2) {
      return { level: 'ضعيف جداً', color: '#f44336', width: '20%' };
    } else if (score < 3) {
      return { level: 'ضعيف', color: '#ff9800', width: '40%' };
    } else if (score < 4) {
      return { level: 'متوسط', color: '#ffeb3b', width: '60%' };
    } else if (score < 5) {
      return { level: 'قوي', color: '#8bc34a', width: '80%' };
    } else {
      return { level: 'قوي جداً', color: '#4caf50', width: '100%' };
    }
  }

  // Submit form
  onSubmit(): void {
    if (!this.passwordForm.valid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const newPassword = this.newPassword?.value;

    if (this.data.mode === 'reset') {
      // Reset password (admin action)
      this.userService.resetUserPassword(this.data.user.id!).subscribe({
        next: (response) => {
          this.loading.set(false);
          this.dialogRef.close({
            success: true,
            temporaryPassword: response.temporaryPassword
          });
        },
        error: (error) => {
          this.loading.set(false);
          console.error('Error resetting password:', error);
        }
      });
    } else {
      // Change password
      this.userService.changeUserPassword(this.data.user.id!, newPassword).subscribe({
        next: () => {
          this.loading.set(false);
          this.dialogRef.close({
            success: true,
            newPassword: newPassword
          });
        },
        error: (error) => {
          this.loading.set(false);
          console.error('Error changing password:', error);
        }
      });
    }
  }

  // Cancel dialog
  onCancel(): void {
    this.dialogRef.close({ success: false });
  }

  // Get form error messages
  getErrorMessage(fieldName: string): string {
    const field = this.passwordForm.get(fieldName);
    if (!field || !field.errors || !field.touched) {
      return '';
    }

    const errors = field.errors;
    if (errors['required']) {
      return fieldName === 'newPassword' ? 'كلمة المرور مطلوبة' : 'تأكيد كلمة المرور مطلوب';
    }
    if (errors['weakPassword']) {
      return 'كلمة المرور ضعيفة (8 أحرف على الأقل، أحرف كبيرة وصغيرة، أرقام ورموز)';
    }

    // Check form-level errors
    if (fieldName === 'confirmPassword' && this.passwordForm.errors?.['passwordMismatch']) {
      return 'كلمات المرور غير متطابقة';
    }

    return 'قيمة غير صحيحة';
  }

  // Get dialog title
  getDialogTitle(): string {
    return this.data.mode === 'reset' ? 'إعادة تعيين كلمة المرور' : 'تغيير كلمة المرور';
  }

  // Get dialog description
  getDialogDescription(): string {
    if (this.data.mode === 'reset') {
      return `إعادة تعيين كلمة المرور للمستخدم: ${this.data.user.firstName} ${this.data.user.lastName}`;
    } else {
      return `تعيين كلمة مرور جديدة للمستخدم: ${this.data.user.firstName} ${this.data.user.lastName}`;
    }
  }

  // Get submit button text
  getSubmitButtonText(): string {
    if (this.loading()) {
      return this.data.mode === 'reset' ? 'جاري إعادة التعيين...' : 'جاري التغيير...';
    }
    return this.data.mode === 'reset' ? 'إعادة تعيين' : 'تغيير كلمة المرور';
  }

  // Add these methods to the component class
  meetsMinLength(): boolean {
    return this.newPassword?.value && this.newPassword.value.length >= 8;
  }

  meetsLowerCase(): boolean {
    return this.newPassword?.value && /[a-z]/.test(this.newPassword.value);
  }

  meetsUpperCase(): boolean {
    return this.newPassword?.value && /[A-Z]/.test(this.newPassword.value);
  }

  meetsNumber(): boolean {
    return this.newPassword?.value && /[0-9]/.test(this.newPassword.value);
  }

  meetsSpecialChar(): boolean {
    return this.newPassword?.value && /[^A-Za-z0-9]/.test(this.newPassword.value);
  }
}
