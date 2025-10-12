// ===================================================================
// src/app/features/invoices/components/payment-form/payment-form.component.ts
// Payment Form Component - Add Payment to Invoice
// ===================================================================
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// Services & Models
import { InvoiceService } from '../../services/invoice.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  InvoiceResponse,
  CreatePaymentRequest,
  PaymentMethod,
  PAYMENT_METHOD_OPTIONS
} from '../../models/invoice.model';

@Component({
  selector: 'app-payment-form',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    MatChipsModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './payment-form.component.html',
  styleUrl: './payment-form.component.scss'
})
export class PaymentFormComponent implements OnInit {
  // Services
  private invoiceService = inject(InvoiceService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  // ===================================================================
  // STATE MANAGEMENT
  // ===================================================================

  paymentForm!: FormGroup;
  invoice = signal<InvoiceResponse | null>(null);
  loading = signal(false);
  submitting = signal(false);

  paymentMethodOptions = PAYMENT_METHOD_OPTIONS;

  // ===================================================================
  // LIFECYCLE HOOKS
  // ===================================================================

  ngOnInit(): void {
    this.initializeForm();
    this.loadInvoice();
  }

  // ===================================================================
  // FORM INITIALIZATION
  // ===================================================================

  private initializeForm(): void {
    this.paymentForm = this.fb.group({
      amount: [0, [Validators.required, Validators.min(0.01)]],
      paymentMethod: [PaymentMethod.CASH, Validators.required],
      referenceNumber: [''],
      notes: ['']
    });
  }

  private loadInvoice(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/invoices']);
      return;
    }

    this.loading.set(true);

    this.invoiceService.getInvoiceById(Number(id)).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.invoice.set(response.data);

          // Set default amount to balance due
          this.paymentForm.patchValue({
            amount: response.data.balanceDue
          });

          // Check if invoice is payable
          if (response.data.balanceDue <= 0) {
            this.notificationService.info('الفاتورة مدفوعة بالكامل');
            this.router.navigate(['/invoices', id]);
          }
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/invoices']);
      }
    });
  }

  // ===================================================================
  // FORM SUBMISSION
  // ===================================================================

  onSubmit(): void {
    if (this.paymentForm.invalid) {
      this.notificationService.error('الرجاء تعبئة جميع الحقول المطلوبة');
      this.markFormGroupTouched(this.paymentForm);
      return;
    }

    const invoice = this.invoice();
    if (!invoice) return;

    const formValue = this.paymentForm.value;

    // Validate amount
    if (formValue.amount > invoice.balanceDue) {
      this.notificationService.error('المبلغ المدخل أكبر من المبلغ المتبقي');
      return;
    }

    this.submitting.set(true);

    const request: CreatePaymentRequest = {
      invoiceId: invoice.id,
      amount: formValue.amount,
      paymentMethod: formValue.paymentMethod,
      referenceNumber: formValue.referenceNumber || undefined,
      notes: formValue.notes || undefined
    };

    this.invoiceService.addPayment(invoice.id, request).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success('تم إضافة الدفعة بنجاح');
          this.router.navigate(['/invoices', invoice.id]);
        }
        this.submitting.set(false);
      },
      error: () => {
        this.submitting.set(false);
      }
    });
  }

  onCancel(): void {
    const invoice = this.invoice();
    if (invoice) {
      this.router.navigate(['/invoices', invoice.id]);
    } else {
      this.router.navigate(['/invoices']);
    }
  }

  // ===================================================================
  // QUICK AMOUNT BUTTONS
  // ===================================================================

  setFullAmount(): void {
    const invoice = this.invoice();
    if (invoice) {
      this.paymentForm.patchValue({
        amount: invoice.balanceDue
      });
    }
  }

  setHalfAmount(): void {
    const invoice = this.invoice();
    if (invoice) {
      this.paymentForm.patchValue({
        amount: invoice.balanceDue / 2
      });
    }
  }

  setCustomAmount(percentage: number): void {
    const invoice = this.invoice();
    if (invoice) {
      this.paymentForm.patchValue({
        amount: (invoice.balanceDue * percentage) / 100
      });
    }
  }

  // ===================================================================
  // UI HELPERS
  // ===================================================================

  formatCurrency(amount: number): string {
    return this.invoiceService.formatCurrency(amount);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.paymentForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.paymentForm.get(fieldName);
    if (field?.hasError('required')) return 'هذا الحقل مطلوب';
    if (field?.hasError('min')) return 'المبلغ يجب أن يكون أكبر من صفر';
    return '';
  }

  getRemainingAmount(): number {
    const invoice = this.invoice();
    const paymentAmount = this.paymentForm.get('amount')?.value || 0;
    return invoice ? invoice.balanceDue - paymentAmount : 0;
  }
}
