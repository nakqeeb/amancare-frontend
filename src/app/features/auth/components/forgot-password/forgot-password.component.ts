// ===================================================================
// src/app/features/auth/components/forgot-password/forgot-password.component.ts
// ===================================================================
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  // Signals
  isLoading = signal(false);
  emailSent = signal(false);
  sentEmail = signal('');

  forgotForm: FormGroup;

  constructor() {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.forgotForm.invalid) {
      return;
    }

    const email = this.forgotForm.value.email;
    this.isLoading.set(true);

    try {
      await this.authService.forgotPassword(email).toPromise();

      // Success - show confirmation
      this.emailSent.set(true);
      this.sentEmail.set(email);
      this.isLoading.set(false);
    } catch (error: any) {
      console.error('Forgot password error:', error);
      this.isLoading.set(false);
    }
  }

  resendEmail(): void {
    this.emailSent.set(false);
    setTimeout(() => {
      this.onSubmit();
    }, 100);
  }
}
