// ===================================================================
// 3. ACCOUNT NOT VERIFIED COMPONENT
// src/app/features/auth/components/account-not-verified/account-not-verified.component.ts
// ===================================================================

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-account-not-verified',
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
  templateUrl: './account-not-verified.component.html',
  styleUrl: './account-not-verified.component.scss'
})
export class AccountNotVerifiedComponent {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // Signals
  isResending = signal(false);

  // Form
  resendForm: FormGroup;

  constructor() {
    this.resendForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  async onResend(): Promise<void> {
    if (this.resendForm.invalid) {
      return;
    }

    const email = this.resendForm.value.email;
    this.isResending.set(true);

    try {
      await this.authService.resendVerificationEmail(email).toPromise();
      this.notificationService.success('تم إعادة إرسال رابط التأكيد');
      this.resendForm.reset();
    } catch (error: any) {
      console.error('Resend verification error:', error);
    } finally {
      this.isResending.set(false);
    }
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
