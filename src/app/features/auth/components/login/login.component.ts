// ===================================================================
// src/app/features/auth/components/login/login.component.ts
// ===================================================================
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService, LoginRequest } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

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

  // Signals
  hidePassword = signal(true);
  isLoading = signal(false);

  loginForm!: FormGroup;

  ngOnInit(): void {
    this.initializeForm();

    // إعادة توجيه المستخدم إذا كان مسجلاً دخوله بالفعل
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  private initializeForm(): void {
    this.loginForm = this.fb.group({
      usernameOrEmail: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['DOCTOR'], // Default for demo
      rememberMe: [false]
    });
  }

  togglePasswordVisibility(): void {
    this.hidePassword.update(hide => !hide);
  }

  fillDemoCredentials(type: string): void {
    const credentials = {
      admin: {
        usernameOrEmail: 'admin@clinic.com',
        password: 'admin123',
        role: 'ADMIN'
      },
      doctor: {
        usernameOrEmail: 'doctor@clinic.com',
        password: 'doctor123',
        role: 'DOCTOR'
      },
      nurse: {
        usernameOrEmail: 'nurse@clinic.com',
        password: 'nurse123',
        role: 'NURSE'
      }
    };

    const cred = credentials[type as keyof typeof credentials];
    if (cred) {
      this.loginForm.patchValue(cred);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading.set(true);

    const loginData: LoginRequest = {
      usernameOrEmail: this.loginForm.get('usernameOrEmail')?.value,
      password: this.loginForm.get('password')?.value
    };

    // Simulate login for demo
    this.simulateLogin(loginData);
  }

  private simulateLogin(credentials: LoginRequest): void {
    // Simulate API call delay
    setTimeout(() => {
      const mockUser = {
        id: 1,
        username: credentials.usernameOrEmail,
        email: credentials.usernameOrEmail,
        firstName: 'أحمد',
        lastName: 'محمد',
        fullName: 'د. أحمد محمد',
        role: this.loginForm.get('role')?.value || 'DOCTOR',
        clinicId: 1,
        clinicName: 'عيادة الرعاية الصحية',
        specialization: 'طب عام',
        isActive: true
      };

      // Mock successful response
      const response = {
        accessToken: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        tokenType: 'Bearer',
        user: mockUser
      };

      // Handle successful login
      this.authService.setToken(response.accessToken);
      this.authService.setRefreshToken(response.refreshToken);

      this.notificationService.success(`مرحباً ${response.user.fullName}`);
      this.router.navigate(['/dashboard']);

      this.isLoading.set(false);
    }, 2000);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }
}
