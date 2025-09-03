// ===================================================================
// src/app/features/auth/components/login/login.component.ts
// ===================================================================
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService, LoginRequest } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { environment } from '../../../../../environments/environment';

// Demo user data interface
interface DemoUser {
  usernameOrEmail: string;
  password: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    TranslateModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Signals
  hidePassword = signal(true);
  isLoading = signal(false);

  // Environment flag for demo features
  isProduction = environment.production;

  // Form
  loginForm!: FormGroup;

  // Demo users for development testing
  private demoUsers: Record<string, DemoUser> = {
    admin: {
      usernameOrEmail: 'admin@clinic.com',
      password: 'Admin123!'
    },
    doctor: {
      usernameOrEmail: 'doctor@clinic.com',
      password: 'Doctor123!'
    },
    nurse: {
      usernameOrEmail: 'nurse@clinic.com',
      password: 'Nurse123!'
    }
  };

  ngOnInit(): void {
    this.initializeForm();
    this.checkQueryParams();
  }

  private initializeForm(): void {
    this.loginForm = this.fb.group({
      usernameOrEmail: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  private checkQueryParams(): void {
    // Check for success message from registration
    this.route.queryParams.subscribe(params => {
      if (params['message']) {
        this.notificationService.success(params['message']);
      }
      if (params['username']) {
        this.loginForm.patchValue({
          usernameOrEmail: params['username']
        });
      }
    });
  }

  // Toggle password visibility
  togglePasswordVisibility(): void {
    this.hidePassword.set(!this.hidePassword());
  }

  // Navigate to register page
  navigateToRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  // Fill demo data for testing (only in development)
  fillDemoData(userType: 'admin' | 'doctor' | 'nurse'): void {
    if (environment.production) return;

    const demoUser = this.demoUsers[userType];
    if (demoUser) {
      this.loginForm.patchValue({
        usernameOrEmail: demoUser.usernameOrEmail,
        password: demoUser.password,
        rememberMe: false
      });
      this.notificationService.info(`تم تعبئة بيانات ${this.getUserTypeLabel(userType)} التجريبية`);
    }
  }

  private getUserTypeLabel(userType: string): string {
    const labels: Record<string, string> = {
      admin: 'مدير العيادة',
      doctor: 'الطبيب',
      nurse: 'الممرض/ة'
    };
    return labels[userType] || userType;
  }

  // Form submission
  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading.set(true);

    try {
      const credentials: LoginRequest = {
        usernameOrEmail: this.loginForm.value.usernameOrEmail,
        password: this.loginForm.value.password
      };

      const response = await this.authService.login(credentials).toPromise();

      if (response) {
        this.notificationService.success('تم تسجيل الدخول بنجاح');

        // Navigate to dashboard or intended route
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigate([returnUrl]);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.error?.message || error.message || 'فشل في تسجيل الدخول';
      this.notificationService.error(errorMessage);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Mark all form fields as touched to show validation errors
  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  // Utility method to check if field has error
  hasFieldError(fieldName: string, errorType: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.hasError(errorType) && (field.dirty || field.touched));
  }

  // Get field error message
  getFieldErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (!field || !field.errors) return '';

    const errors = field.errors;
    if (errors['required']) return `${this.getFieldLabel(fieldName)} مطلوب`;
    if (errors['email']) return 'البريد الإلكتروني غير صحيح';
    if (errors['minlength']) return `يجب أن يكون على الأقل ${errors['minlength'].requiredLength} حروف`;

    return 'خطأ في الحقل';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      usernameOrEmail: 'اسم المستخدم أو البريد الإلكتروني',
      password: 'كلمة المرور'
    };
    return labels[fieldName] || fieldName;
  }
}
