// ===================================================================
// src/app/features/invoices/components/payment-tracker/payment-tracker.component.ts
// ===================================================================
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

// Services & Models
import { InvoiceService } from '../../services/invoice.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  Invoice,
  Payment,
  PaymentMethod,
  PaymentStatus,
  CreatePaymentRequest
} from '../../models/invoice.model';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuModule } from "@angular/material/menu";

@Component({
  selector: 'app-payment-tracker',
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
    MatTableModule,
    MatChipsModule,
    MatDialogModule,
    MatProgressBarModule,
    MatStepperModule,
    MatRadioModule,
    MatCheckboxModule,
    HeaderComponent,
    SidebarComponent,
    MatMenuModule
],
  templateUrl: './payment-tracker.component.html',
  styleUrl: './payment-tracker.component.scss'
})
export class PaymentTrackerComponent implements OnInit {
  // Services
  private invoiceService = inject(InvoiceService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  // Signals
  loading = signal(false);
  submitting = signal(false);
  invoice = signal<Invoice | null>(null);
  showAddPayment = signal(false);
  selectedPayment = signal<Payment | null>(null);

  // Forms
  paymentForm!: FormGroup;

  // Table columns
  paymentsColumns = ['paymentDate', 'amount', 'paymentMethod', 'referenceNumber', 'status', 'actions'];

  // Enums for template
  PaymentMethod = PaymentMethod;
  PaymentStatus = PaymentStatus;

  // Payment methods configuration
  paymentMethods = [
    { value: PaymentMethod.CASH, label: 'نقدي', icon: 'money' },
    { value: PaymentMethod.CREDIT_CARD, label: 'بطاقة ائتمان', icon: 'credit_card' },
    { value: PaymentMethod.DEBIT_CARD, label: 'بطاقة مدين', icon: 'credit_card' },
    { value: PaymentMethod.BANK_TRANSFER, label: 'حوالة بنكية', icon: 'account_balance' },
    { value: PaymentMethod.CHECK, label: 'شيك', icon: 'receipt' },
    { value: PaymentMethod.INSURANCE, label: 'تأمين', icon: 'local_hospital' },
    { value: PaymentMethod.INSTALLMENT, label: 'تقسيط', icon: 'schedule' },
    { value: PaymentMethod.ONLINE, label: 'دفع إلكتروني', icon: 'computer' }
  ];

  // Status configurations
  paymentStatusConfig = {
    [PaymentStatus.PENDING]: { color: 'warn', icon: 'schedule', text: 'معلق' },
    [PaymentStatus.COMPLETED]: { color: 'primary', icon: 'check_circle', text: 'مكتمل' },
    [PaymentStatus.FAILED]: { color: 'warn', icon: 'error', text: 'فشل' },
    [PaymentStatus.CANCELLED]: { color: 'basic', icon: 'cancel', text: 'ملغي' },
    [PaymentStatus.REFUNDED]: { color: 'basic', icon: 'undo', text: 'مسترد' }
  };

  ngOnInit(): void {
    this.initializeForm();
    this.loadInvoice();
  }

  private initializeForm(): void {
    this.paymentForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      paymentMethod: ['', Validators.required],
      paymentDate: [new Date().toISOString().split('T')[0], Validators.required],
      referenceNumber: [''],
      notes: [''],

      // Card specific fields
      cardLastFourDigits: [''],

      // Check specific fields
      checkNumber: [''],
      bankName: [''],

      // Bank transfer specific fields
      transactionId: ['']
    });

    // Watch payment method changes to show/hide specific fields
    this.paymentForm.get('paymentMethod')?.valueChanges.subscribe(method => {
      this.updateFormValidators(method);
    });
  }

  private updateFormValidators(paymentMethod: PaymentMethod): void {
    // Reset all conditional validators
    this.paymentForm.get('cardLastFourDigits')?.clearValidators();
    this.paymentForm.get('checkNumber')?.clearValidators();
    this.paymentForm.get('bankName')?.clearValidators();
    this.paymentForm.get('transactionId')?.clearValidators();

    // Add specific validators based on payment method
    switch (paymentMethod) {
      case PaymentMethod.CREDIT_CARD:
      case PaymentMethod.DEBIT_CARD:
        this.paymentForm.get('cardLastFourDigits')?.setValidators([
          Validators.required,
          Validators.pattern(/^\d{4}$/)
        ]);
        break;

      case PaymentMethod.CHECK:
        this.paymentForm.get('checkNumber')?.setValidators([Validators.required]);
        this.paymentForm.get('bankName')?.setValidators([Validators.required]);
        break;

      case PaymentMethod.BANK_TRANSFER:
        this.paymentForm.get('transactionId')?.setValidators([Validators.required]);
        break;
    }

    // Update form validation
    this.paymentForm.get('cardLastFourDigits')?.updateValueAndValidity();
    this.paymentForm.get('checkNumber')?.updateValueAndValidity();
    this.paymentForm.get('bankName')?.updateValueAndValidity();
    this.paymentForm.get('transactionId')?.updateValueAndValidity();
  }

  private loadInvoice(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id) {
        this.loading.set(true);

        this.invoiceService.getInvoiceById(id).subscribe({
          next: (invoice) => {
            this.invoice.set(invoice);
            this.loading.set(false);

            // Set default payment amount to remaining amount
            this.paymentForm.patchValue({
              amount: invoice.remainingAmount
            });
          },
          error: (error) => {
            this.loading.set(false);
            this.notificationService.error('خطأ في تحميل الفاتورة: ' + error.message);
            this.router.navigate(['/invoices']);
          }
        });
      }
    });
  }

  // Navigation methods
  navigateBack(): void {
    const invoice = this.invoice();
    if (invoice) {
      this.router.navigate(['/invoices', invoice.id]);
    } else {
      this.router.navigate(['/invoices']);
    }
  }

  // Payment management methods
  toggleAddPayment(): void {
    this.showAddPayment.update(show => !show);
    if (!this.showAddPayment()) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.paymentForm.reset({
      paymentDate: new Date().toISOString().split('T')[0],
      amount: this.invoice()?.remainingAmount || 0
    });
    this.selectedPayment.set(null);
  }

  addPayment(): void {
    if (this.paymentForm.valid) {
      const invoice = this.invoice();
      if (!invoice) return;

      this.submitting.set(true);
      const formValue = this.paymentForm.value;

      const paymentRequest: CreatePaymentRequest = {
        invoiceId: invoice.id!,
        amount: formValue.amount,
        paymentMethod: formValue.paymentMethod,
        referenceNumber: formValue.referenceNumber,
        notes: formValue.notes
      };

      // Add method-specific fields
      if (formValue.cardLastFourDigits) {
        paymentRequest.cardLastFourDigits = formValue.cardLastFourDigits;
      }
      if (formValue.checkNumber) {
        paymentRequest.checkNumber = formValue.checkNumber;
      }
      if (formValue.bankName) {
        paymentRequest.bankName = formValue.bankName;
      }
      if (formValue.transactionId) {
        paymentRequest.invoiceId = formValue.transactionId;
      }

      this.invoiceService.addPayment(paymentRequest).subscribe({
        next: () => {
          this.submitting.set(false);
          this.notificationService.success('تم إضافة الدفعة بنجاح');
          this.loadInvoice(); // Reload to get updated data
          this.toggleAddPayment();
        },
        error: (error) => {
          this.submitting.set(false);
          this.notificationService.error('خطأ في إضافة الدفعة: ' + error.message);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  setPaymentAmount(percentage: number): void {
    const invoice = this.invoice();
    if (!invoice) return;

    const amount = (invoice.remainingAmount! * percentage) / 100;
    this.paymentForm.patchValue({ amount: amount.toFixed(2) });
  }

  setFullPayment(): void {
    const invoice = this.invoice();
    if (!invoice) return;

    this.paymentForm.patchValue({ amount: invoice.remainingAmount });
  }

  // Utility methods
  getPaymentMethodConfig(method: PaymentMethod) {
    return this.paymentMethods.find(pm => pm.value === method) ||
      { label: method, icon: 'payment' };
  }

  getPaymentStatusConfig(status: PaymentStatus) {
    return this.paymentStatusConfig[status] ||
      { color: 'basic', icon: 'info', text: status };
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateTime(date: string): string {
    return new Date(date).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  calculatePaymentProgress(): number {
    const invoice = this.invoice();
    if (!invoice || invoice.totalAmount === 0) return 0;

    return ((invoice.paidAmount || 0) / invoice.totalAmount) * 100;
  }

  getPaymentProgressColor(): string {
    const progress = this.calculatePaymentProgress();
    if (progress === 100) return 'primary';
    if (progress > 50) return 'accent';
    return 'warn';
  }

  isPaymentMethodValid(): boolean {
    const method = this.paymentForm.get('paymentMethod')?.value;
    if (!method) return false;

    switch (method) {
      case PaymentMethod.CREDIT_CARD:
      case PaymentMethod.DEBIT_CARD:
        return this.paymentForm.get('cardLastFourDigits')?.valid || false;

      case PaymentMethod.CHECK:
        return (this.paymentForm.get('checkNumber')?.valid &&
          this.paymentForm.get('bankName')?.valid) || false;

      case PaymentMethod.BANK_TRANSFER:
        return this.paymentForm.get('transactionId')?.valid || false;

      default:
        return true;
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.paymentForm.controls).forEach(key => {
      const control = this.paymentForm.get(key);
      control?.markAsTouched();
    });
  }

  hasPermission(roles: string[]): boolean {
    return this.authService.hasRole(roles);
  }

  // Actions on existing payments
  viewPaymentDetails(payment: Payment): void {
    this.selectedPayment.set(payment);
    // Could open a dialog or expand a section
  }

  refundPayment(payment: Payment): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'تأكيد الاسترداد',
        message: `هل أنت متأكد من استرداد الدفعة بمبلغ ${this.formatCurrency(payment.amount)}؟`,
        confirmText: 'استرداد',
        cancelText: 'إلغاء'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // This would be implemented in the service
        this.notificationService.info('وظيفة الاسترداد قيد التطوير');
      }
    });
  }

  generatePaymentReceipt(payment: Payment): void {
    // Generate and download payment receipt
    this.notificationService.info('سيتم تحميل إيصال الدفع قريباً');
  }
}
