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
  private notificationService = inject(NotificationService);

  // Signals
  isLoading = signal(false);
  emailSent = signal(false);

  forgotForm: FormGroup;

  constructor() {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotForm.invalid) {
      return;
    }

    this.isLoading.set(true);

    // Simulate API call
    setTimeout(() => {
      this.emailSent.set(true);
      this.isLoading.set(false);
      this.notificationService.success('تم إرسال رابط إعادة تعيين كلمة المرور');
    }, 2000);
  }

  resendEmail(): void {
    this.emailSent.set(false);
    setTimeout(() => {
      this.onSubmit();
    }, 100);
  }
}
