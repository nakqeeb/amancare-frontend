// ===================================================================
// src/app/features/invoices/components/invoice-details/invoice-details.component.ts
// ===================================================================
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';

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
  InvoiceStatus,
  PaymentStatus,
  PaymentMethod,
  ServiceCategory
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
    MatTabsModule,
    MatChipsModule,
    MatDividerModule,
    MatMenuModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatListModule,
    MatTableModule,
    MatTooltipModule,
    MatBadgeModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './invoice-details.component.html',
  styleUrl: './invoice-details.component.scss'
})
export class InvoiceDetailsComponent implements OnInit {
  // Services
  private invoiceService = inject(InvoiceService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);

  // Signals
  loading = signal(false);
  invoice = signal<Invoice | null>(null);
  selectedTab = signal(0);

  // Table columns
  itemsColumns = ['serviceName', 'category', 'quantity', 'unitPrice', 'totalPrice'];
  paymentsColumns = ['paymentDate', 'amount', 'paymentMethod', 'referenceNumber', 'status'];

  // Enums for template
  InvoiceStatus = InvoiceStatus;
  PaymentStatus = PaymentStatus;
  PaymentMethod = PaymentMethod;
  ServiceCategory = ServiceCategory;

  // Status configurations
  statusConfig = {
    [InvoiceStatus.DRAFT]: { color: 'accent', icon: 'edit', text: 'مسودة' },
    [InvoiceStatus.PENDING]: { color: 'warn', icon: 'schedule', text: 'معلقة' },
    [InvoiceStatus.SENT]: { color: 'primary', icon: 'send', text: 'مرسلة' },
    [InvoiceStatus.VIEWED]: { color: 'accent', icon: 'visibility', text: 'تمت المشاهدة' },
    [InvoiceStatus.PAID]: { color: 'primary', icon: 'check_circle', text: 'مدفوعة' },
    [InvoiceStatus.PARTIALLY_PAID]: { color: 'accent', icon: 'payment', text: 'مدفوعة جزئياً' },
    [InvoiceStatus.OVERDUE]: { color: 'warn', icon: 'error', text: 'متأخرة' },
    [InvoiceStatus.CANCELLED]: { color: 'basic', icon: 'cancel', text: 'ملغية' },
    [InvoiceStatus.REFUNDED]: { color: 'basic', icon: 'undo', text: 'مسترد' }
  };

  paymentStatusConfig = {
    [PaymentStatus.PENDING]: { color: 'warn', icon: 'schedule', text: 'معلق' },
    [PaymentStatus.COMPLETED]: { color: 'primary', icon: 'check_circle', text: 'مكتمل' },
    [PaymentStatus.FAILED]: { color: 'warn', icon: 'error', text: 'فشل' },
    [PaymentStatus.CANCELLED]: { color: 'basic', icon: 'cancel', text: 'ملغي' },
    [PaymentStatus.REFUNDED]: { color: 'basic', icon: 'undo', text: 'مسترد' }
  };

  paymentMethodConfig = {
    [PaymentMethod.CASH]: { icon: 'money', text: 'نقدي' },
    [PaymentMethod.CREDIT_CARD]: { icon: 'credit_card', text: 'بطاقة ائتمان' },
    [PaymentMethod.DEBIT_CARD]: { icon: 'credit_card', text: 'بطاقة مدين' },
    [PaymentMethod.BANK_TRANSFER]: { icon: 'account_balance', text: 'حوالة بنكية' },
    [PaymentMethod.CHECK]: { icon: 'receipt', text: 'شيك' },
    [PaymentMethod.INSURANCE]: { icon: 'local_hospital', text: 'تأمين' },
    [PaymentMethod.INSTALLMENT]: { icon: 'schedule', text: 'تقسيط' },
    [PaymentMethod.ONLINE]: { icon: 'computer', text: 'دفع إلكتروني' }
  };

  serviceCategoryConfig = {
    [ServiceCategory.CONSULTATION]: { icon: 'medical_services', text: 'استشارة' },
    [ServiceCategory.PROCEDURE]: { icon: 'healing', text: 'إجراء طبي' },
    [ServiceCategory.MEDICATION]: { icon: 'medication', text: 'دواء' },
    [ServiceCategory.LAB_TEST]: { icon: 'biotech', text: 'فحص مختبر' },
    [ServiceCategory.RADIOLOGY]: { icon: 'scanner', text: 'أشعة' },
    [ServiceCategory.SURGERY]: { icon: 'surgical', text: 'عملية جراحية' },
    [ServiceCategory.THERAPY]: { icon: 'spa', text: 'علاج طبيعي' },
    [ServiceCategory.VACCINATION]: { icon: 'vaccines', text: 'تطعيم' },
    [ServiceCategory.EQUIPMENT]: { icon: 'medical_information', text: 'معدات' },
    [ServiceCategory.OTHER]: { icon: 'more_horiz', text: 'أخرى' }
  };

  ngOnInit(): void {
    this.loadInvoice();
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
  navigateToEdit(): void {
    const invoice = this.invoice();
    if (invoice) {
      this.router.navigate(['/invoices', invoice.id, 'edit']);
    }
  }

  navigateToPreview(): void {
    const invoice = this.invoice();
    if (invoice) {
      this.router.navigate(['/invoices', invoice.id, 'preview']);
    }
  }

  navigateToPayments(): void {
    const invoice = this.invoice();
    if (invoice) {
      this.router.navigate(['/invoices', invoice.id, 'payments']);
    }
  }

  navigateToPatient(): void {
    const invoice = this.invoice();
    if (invoice) {
      this.router.navigate(['/patients', invoice.patientId]);
    }
  }

  navigateBack(): void {
    this.router.navigate(['/invoices']);
  }

  // Action methods
  updateStatus(status: InvoiceStatus): void {
    const invoice = this.invoice();
    if (!invoice) return;

    this.invoiceService.updateInvoiceStatus(invoice.id!, status).subscribe({
      next: (updatedInvoice) => {
        this.invoice.set(updatedInvoice);
        this.notificationService.success('تم تحديث حالة الفاتورة بنجاح');
      },
      error: (error) => {
        this.notificationService.error('خطأ في تحديث الحالة: ' + error.message);
      }
    });
  }

  deleteInvoice(): void {
    const invoice = this.invoice();
    if (!invoice) return;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'تأكيد الحذف',
        message: `هل أنت متأكد من حذف الفاتورة ${invoice.invoiceNumber}؟`,
        confirmText: 'حذف',
        cancelText: 'إلغاء'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.invoiceService.deleteInvoice(invoice.id!).subscribe({
          next: () => {
            this.notificationService.success('تم حذف الفاتورة بنجاح');
            this.router.navigate(['/invoices']);
          },
          error: (error) => {
            this.notificationService.error('خطأ في حذف الفاتورة: ' + error.message);
          }
        });
      }
    });
  }

  duplicateInvoice(): void {
    const invoice = this.invoice();
    if (!invoice) return;

    // Create a duplicate invoice
    const duplicateData = {
      patientId: invoice.patientId,
      doctorId: invoice.doctorId,
      clinicId: invoice.clinicId,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      items: invoice.items.map(item => ({
        serviceName: item.serviceName,
        category: item.category,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      })),
      notes: invoice.notes,
      terms: invoice.terms,
      taxPercentage: invoice.taxPercentage
    };

    this.invoiceService.createInvoice(duplicateData).subscribe({
      next: (newInvoice) => {
        this.notificationService.success('تم إنشاء نسخة من الفاتورة بنجاح');
        this.router.navigate(['/invoices', newInvoice.id, 'edit']);
      },
      error: (error) => {
        this.notificationService.error('خطأ في إنشاء نسخة من الفاتورة: ' + error.message);
      }
    });
  }

  generatePDF(): void {
    const invoice = this.invoice();
    if (!invoice) return;

    this.invoiceService.generateInvoicePDF(invoice.id!).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${invoice.invoiceNumber}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.notificationService.success('تم تحميل ملف PDF بنجاح');
      },
      error: (error) => {
        this.notificationService.error('خطأ في تحميل ملف PDF: ' + error.message);
      }
    });
  }

  sendEmail(): void {
    const invoice = this.invoice();
    if (!invoice) return;

    this.invoiceService.sendInvoiceEmail(invoice.id!).subscribe({
      next: () => {
        this.notificationService.success('تم إرسال الفاتورة بالبريد الإلكتروني بنجاح');
      },
      error: (error) => {
        this.notificationService.error('خطأ في إرسال البريد الإلكتروني: ' + error.message);
      }
    });
  }

  printInvoice(): void {
    window.print();
  }

  // Utility methods
  getStatusConfig(status: InvoiceStatus) {
    return this.statusConfig[status] || { color: 'basic', icon: 'info', text: status };
  }

  getPaymentStatusConfig(status: PaymentStatus) {
    return this.paymentStatusConfig[status] || { color: 'basic', icon: 'info', text: status };
  }

  getPaymentMethodConfig(method: PaymentMethod) {
    return this.paymentMethodConfig[method] || { icon: 'payment', text: method };
  }

  getServiceCategoryConfig(category: ServiceCategory) {
    return this.serviceCategoryConfig[category] || { icon: 'category', text: category };
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
      month: 'long',
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

  isOverdue(invoice: Invoice): boolean {
    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    return dueDate < today && invoice.status !== InvoiceStatus.PAID;
  }

  getDaysDue(invoice: Invoice): number {
    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    const diffTime = today.getTime() - dueDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  hasPermission(roles: string[]): boolean {
    return this.authService.hasRole(roles);
  }

  canEdit(): boolean {
    const invoice = this.invoice();
    if (!invoice) return false;

    return this.hasPermission(['ADMIN', 'SYSTEM_ADMIN', 'RECEPTIONIST']) &&
      [InvoiceStatus.DRAFT, InvoiceStatus.PENDING].includes(invoice.status);
  }

  canDelete(): boolean {
    const invoice = this.invoice();
    if (!invoice) return false;

    return this.hasPermission(['ADMIN', 'SYSTEM_ADMIN']) &&
      [InvoiceStatus.DRAFT, InvoiceStatus.PENDING].includes(invoice.status);
  }

  onTabChange(index: number): void {
    this.selectedTab.set(index);
  }
}
