// ===================================================================
// 2. EMAIL VERIFICATION COMPONENT
// src/app/features/auth/components/verify-email/verify-email.component.ts
// ===================================================================

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-verify-email',
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
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.scss'
})
export class VerifyEmailComponent implements OnInit {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  // Signals
  isVerifying = signal(true);
  isVerified = signal(false);
  hasError = signal(false);
  isResending = signal(false);
  errorMessage = signal('');
  token = signal<string>('');

  // Form
  resendForm: FormGroup;

  constructor() {
    this.resendForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.verifyToken();
  }

  private verifyToken(): void {
    const token = this.route.snapshot.queryParams['token'];

    if (!token) {
      this.showError('رمز التحقق غير صحيح');
      return;
    }

    this.token.set(token);
    this.isVerifying.set(true);

    this.authService.verifyEmail(token).subscribe({
      next: () => {
        this.isVerified.set(true);
        this.isVerifying.set(false);
        this.hasError.set(false);
      },
      error: (error) => {
        this.showError(error.error?.message || 'فشل في تفعيل الحساب');
      }
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

  private showError(message: string): void {
    this.errorMessage.set(message);
    this.hasError.set(true);
    this.isVerifying.set(false);
    this.isVerified.set(false);
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
