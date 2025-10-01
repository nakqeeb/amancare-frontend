// ===================================================================
// src/app/features/invoices/components/invoice-details/invoice-details.component.ts
// Invoice Details Component - View Invoice
// ===================================================================
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// Services & Models
import { InvoiceService } from '../../services/invoice.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  Invoice,
  Payment,
  InvoiceStatus,
  INVOICE_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  SERVICE_CATEGORY_LABELS,
  InvoiceResponse,
  PaymentResponse
} from '../../models/invoice.model';

@Component({
  selector: 'app-invoice-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatTooltipModule,
    MatChipsModule,
    MatDividerModule,
    MatTableModule,
    MatExpansionModule,
    MatDialogModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './invoice-details.component.html',
  styleUrl: './invoice-details.component.scss'
})
export class InvoiceDetailsComponent implements OnInit {
  // Services
  private invoiceService = inject(InvoiceService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);

  // ===================================================================
  // STATE MANAGEMENT
  // ===================================================================

  invoice = signal<InvoiceResponse | null>(null);
  payments = signal<PaymentResponse[]>([]);
  loading = signal(true);
  currentUser = this.authService.currentUser;

  // Labels
  statusLabels = INVOICE_STATUS_LABELS;
  paymentStatusLabels = PAYMENT_STATUS_LABELS;
  paymentMethodLabels = PAYMENT_METHOD_LABELS;
  categoryLabels = SERVICE_CATEGORY_LABELS;

  // Table columns
  itemColumns: string[] = ['service', 'category', 'quantity', 'unitPrice', 'taxable', 'total'];
  paymentColumns: string[] = ['date', 'amount', 'method', 'reference', 'notes', 'user'];

  // ===================================================================
  // LIFECYCLE HOOKS
  // ===================================================================

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadInvoice(Number(id));
      this.loadPayments(Number(id));
    } else {
      this.router.navigate(['/invoices']);
    }
  }

  // ===================================================================
  // DATA LOADING
  // ===================================================================

  private loadInvoice(id: number): void {
    this.loading.set(true);

    this.invoiceService.getInvoiceById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.invoice.set(response.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/invoices']);
      }
    });
  }

  private loadPayments(id: number): void {
    this.invoiceService.getInvoicePayments(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.payments.set(response.data);
        }
      }
    });
  }

  // ===================================================================
  // INVOICE ACTIONS
  // ===================================================================

  onEdit(): void {
    const invoice = this.invoice();
    if (!invoice) return;

    if (!this.invoiceService.isInvoiceEditable(invoice)) {
      this.notificationService.warning('لا يمكن تعديل الفواتير المدفوعة أو الملغية');
      return;
    }

    this.router.navigate(['/invoices', invoice.id, 'edit']);
  }

  onCancel(): void {
    const invoice = this.invoice();
    if (!invoice) return;

    if (!this.invoiceService.canCancelInvoice(invoice)) {
      this.notificationService.warning('لا يمكن إلغاء هذه الفاتورة');
      return;
    }

    const confirmed = confirm(`هل تريد إلغاء الفاتورة رقم ${invoice.invoiceNumber}؟`);
    if (confirmed) {
      const reason = prompt('الرجاء إدخال سبب الإلغاء:');
      if (reason) {
        this.invoiceService.cancelInvoice(invoice.id, reason).subscribe({
          next: () => {
            this.loadInvoice(invoice.id);
          }
        });
      }
    }
  }

  onAddPayment(): void {
    const invoice = this.invoice();
    if (!invoice) return;

    if (invoice.balanceDue <= 0) {
      this.notificationService.info('الفاتورة مدفوعة بالكامل');
      return;
    }

    this.router.navigate(['/invoices', invoice.id, 'payment']);
  }

  onSendInvoice(): void {
    const invoice = this.invoice();
    if (!invoice) return;

    const confirmed = confirm(`هل تريد إرسال الفاتورة رقم ${invoice.invoiceNumber} للمريض؟`);
    if (confirmed) {
      this.invoiceService.sendInvoice(invoice.id).subscribe();
    }
  }

  onPrintInvoice(): void {
    const invoice = this.invoice();
    if (!invoice) return;

    this.notificationService.info('جاري تحضير الفاتورة للطباعة...');
    // TODO: Implement PDF generation when backend endpoint is ready
    // window.open(`/invoices/${invoice.id}/pdf`, '_blank');
  }

  onViewPatient(): void {
    const invoice = this.invoice();
    if (invoice) {
      this.router.navigate(['/patients', invoice.patientId]);
    }
  }

  onBack(): void {
    this.router.navigate(['/invoices']);
  }

  // ===================================================================
  // PERMISSION CHECKS
  // ===================================================================

  canEditInvoice(): boolean {
    const invoice = this.invoice();
    if (!invoice) return false;

    const user = this.currentUser();
    return ['SYSTEM_ADMIN', 'ADMIN', 'RECEPTIONIST'].includes(user?.role || '') &&
      this.invoiceService.isInvoiceEditable(invoice);
  }

  canCancelInvoice(): boolean {
    const invoice = this.invoice();
    if (!invoice) return false;

    const user = this.currentUser();
    return ['SYSTEM_ADMIN', 'ADMIN'].includes(user?.role || '') &&
      this.invoiceService.canCancelInvoice(invoice);
  }

  canAddPayment(): boolean {
    const invoice = this.invoice();
    if (!invoice) return false;

    const user = this.currentUser();
    return ['SYSTEM_ADMIN', 'ADMIN', 'RECEPTIONIST'].includes(user?.role || '') &&
      invoice.balanceDue > 0;
  }

  // ===================================================================
  // UI HELPERS
  // ===================================================================

  getStatusColor(status: InvoiceStatus): string {
    switch (status) {
      case InvoiceStatus.PENDING:
      case InvoiceStatus.PARTIALLY_PAID:
        return 'accent';
      case InvoiceStatus.PAID:
        return 'primary';
      case InvoiceStatus.CANCELLED:
      case InvoiceStatus.OVERDUE:
        return 'warn';
      default:
        return '';
    }
  }

  getStatusIcon(status: InvoiceStatus): string {
    switch (status) {
      case InvoiceStatus.PENDING:
        return 'schedule';
      case InvoiceStatus.PAID:
        return 'check_circle';
      case InvoiceStatus.PARTIALLY_PAID:
        return 'donut_small';
      case InvoiceStatus.CANCELLED:
        return 'cancel';
      case InvoiceStatus.OVERDUE:
        return 'warning';
      default:
        return 'help';
    }
  }

  formatCurrency(amount: number): string {
    return this.invoiceService.formatCurrency(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getPaymentProgress(): number {
    const invoice = this.invoice();
    if (!invoice || invoice.totalAmount === 0) return 0;
    return (invoice.paidAmount / invoice.totalAmount) * 100;
  }

  getCategoryLabel(category: string): string {
    return this.categoryLabels[category as keyof typeof this.categoryLabels] || category;
  }

  getPaymentMethodLabel(method: string): string {
    return this.paymentMethodLabels[method as keyof typeof this.paymentMethodLabels] || method;
  }
}
