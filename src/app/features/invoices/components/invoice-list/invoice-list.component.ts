// ===================================================================
// src/app/features/invoices/components/invoice-list/invoice-list.component.ts
// ===================================================================
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';

// Services & Models
import { InvoiceService } from '../../services/invoice.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  Invoice,
  InvoiceStatus,
  PaymentStatus,
  InvoicePriority,
  InvoiceSearchCriteria
} from '../../models/invoice.model';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDivider } from "@angular/material/divider";

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatChipsModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    MatBadgeModule,
    MatCheckboxModule,
    HeaderComponent,
    SidebarComponent,
    DataTableComponent,
    MatDivider
],
  templateUrl: './invoice-list.component.html',
  styleUrl: './invoice-list.component.scss'
})
export class InvoiceListComponent implements OnInit {
  // Services
  private invoiceService = inject(InvoiceService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // Signals
  loading = signal(false);
  invoices = this.invoiceService.invoices;
  selectedInvoices = signal<Invoice[]>([]);
  showFilters = signal(false);
  currentPage = signal(0);
  pageSize = signal(10);

  // Computed signals
  totalInvoices = computed(() => this.invoices().length);
  totalAmount = computed(() =>
    this.invoices().reduce((sum, inv) => sum + inv.totalAmount, 0)
  );
  pendingAmount = computed(() =>
    this.invoices()
      .filter(inv => inv.paymentStatus === PaymentStatus.PENDING)
      .reduce((sum, inv) => sum + (inv.remainingAmount || 0), 0)
  );

  // Form
  searchForm!: FormGroup;

  // Table configuration
  displayedColumns = [
    'select',
    'invoiceNumber',
    'patientName',
    'issueDate',
    'dueDate',
    'totalAmount',
    'paidAmount',
    'remainingAmount',
    'status',
    'paymentStatus',
    'priority',
    'actions'
  ];

  // Enums for templates
  InvoiceStatus = InvoiceStatus;
  PaymentStatus = PaymentStatus;
  InvoicePriority = InvoicePriority;

  // Status configurations
  statusConfig = {
    [InvoiceStatus.DRAFT]: { color: 'secondary', icon: 'edit' },
    [InvoiceStatus.PENDING]: { color: 'warn', icon: 'schedule' },
    [InvoiceStatus.SENT]: { color: 'primary', icon: 'send' },
    [InvoiceStatus.VIEWED]: { color: 'accent', icon: 'visibility' },
    [InvoiceStatus.PAID]: { color: 'primary', icon: 'check_circle' },
    [InvoiceStatus.PARTIALLY_PAID]: { color: 'accent', icon: 'payment' },
    [InvoiceStatus.OVERDUE]: { color: 'warn', icon: 'error' },
    [InvoiceStatus.CANCELLED]: { color: 'secondary', icon: 'cancel' },
    [InvoiceStatus.REFUNDED]: { color: 'secondary', icon: 'undo' }
  };

  paymentStatusConfig = {
    [PaymentStatus.PENDING]: { color: 'warn', icon: 'schedule' },
    [PaymentStatus.COMPLETED]: { color: 'primary', icon: 'check_circle' },
    [PaymentStatus.FAILED]: { color: 'warn', icon: 'error' },
    [PaymentStatus.CANCELLED]: { color: 'secondary', icon: 'cancel' },
    [PaymentStatus.REFUNDED]: { color: 'secondary', icon: 'undo' }
  };

  ngOnInit(): void {
    this.initializeSearchForm();
    this.loadInvoices();
    this.checkRouteParams();
  }

  private initializeSearchForm(): void {
    this.searchForm = this.fb.group({
      searchQuery: [''],
      status: [''],
      paymentStatus: [''],
      priority: [''],
      fromDate: [''],
      toDate: [''],
      minAmount: [''],
      maxAmount: ['']
    });

    // Auto-search on form changes
    this.searchForm.valueChanges.subscribe(() => {
      this.searchInvoices();
    });
  }

  private checkRouteParams(): void {
    this.route.params.subscribe(params => {
      if (params['patientId']) {
        // Filter by patient ID
        this.searchForm.patchValue({
          patientId: +params['patientId']
        });
      }
    });
  }

  loadInvoices(): void {
    this.loading.set(true);

    const criteria: InvoiceSearchCriteria = {
      page: this.currentPage(),
      pageSize: this.pageSize()
    };

    this.invoiceService.getInvoices(criteria).subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.notificationService.error('خطأ في تحميل الفواتير: ' + error.message);
      }
    });
  }

  searchInvoices(): void {
    const formValue = this.searchForm.value;
    const criteria: InvoiceSearchCriteria = {
      ...formValue,
      page: 0, // Reset to first page
      pageSize: this.pageSize()
    };

    this.currentPage.set(0);
    this.invoiceService.getInvoices(criteria).subscribe();
  }

  clearFilters(): void {
    this.searchForm.reset();
    this.loadInvoices();
  }

  toggleFilters(): void {
    this.showFilters.update(show => !show);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadInvoices();
  }

  onInvoiceSelectionChange(checked: boolean, invoice: Invoice) {
    this.selectedInvoices.update(s =>
      checked ? [...s, invoice] : s.filter(i => i !== invoice)
    );
  }

  // Navigation methods
  navigateToCreate(): void {
    this.router.navigate(['/invoices/new']);
  }

  navigateToDetails(invoice: Invoice): void {
    this.router.navigate(['/invoices', invoice.id]);
  }

  navigateToEdit(invoice: Invoice): void {
    this.router.navigate(['/invoices', invoice.id, 'edit']);
  }

  navigateToPreview(invoice: Invoice): void {
    this.router.navigate(['/invoices', invoice.id, 'preview']);
  }

  navigateToPayments(invoice: Invoice): void {
    this.router.navigate(['/invoices', invoice.id, 'payments']);
  }

  // Action methods
  updateStatus(invoice: Invoice, status: InvoiceStatus): void {
    this.invoiceService.updateInvoiceStatus(invoice.id!, status).subscribe({
      next: () => {
        this.notificationService.success('تم تحديث حالة الفاتورة بنجاح');
      },
      error: (error) => {
        this.notificationService.error('خطأ في تحديث الحالة: ' + error.message);
      }
    });
  }

  deleteInvoice(invoice: Invoice): void {
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
          },
          error: (error) => {
            this.notificationService.error('خطأ في حذف الفاتورة: ' + error.message);
          }
        });
      }
    });
  }

  duplicateInvoice(invoice: Invoice): void {
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
        this.navigateToEdit(newInvoice);
      },
      error: (error) => {
        this.notificationService.error('خطأ في إنشاء نسخة من الفاتورة: ' + error.message);
      }
    });
  }

  generatePDF(invoice: Invoice): void {
    this.invoiceService.generateInvoicePDF(invoice.id!).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${invoice.invoiceNumber}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        this.notificationService.error('خطأ في تحميل ملف PDF: ' + error.message);
      }
    });
  }

  sendEmail(invoice: Invoice): void {
    this.invoiceService.sendInvoiceEmail(invoice.id!).subscribe({
      next: () => {
        this.notificationService.success('تم إرسال الفاتورة بالبريد الإلكتروني بنجاح');
      },
      error: (error) => {
        this.notificationService.error('خطأ في إرسال البريد الإلكتروني: ' + error.message);
      }
    });
  }

  // Bulk operations
  selectAllInvoices(): void {
    this.selectedInvoices.set([...this.invoices()]);
  }

  clearSelection(): void {
    this.selectedInvoices.set([]);
  }

  bulkDelete(): void {
    const selected = this.selectedInvoices();
    if (selected.length === 0) return;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'تأكيد الحذف المتعدد',
        message: `هل أنت متأكد من حذف ${selected.length} فاتورة؟`,
        confirmText: 'حذف',
        cancelText: 'إلغاء'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Delete selected invoices
        selected.forEach(invoice => {
          this.invoiceService.deleteInvoice(invoice.id!).subscribe();
        });
        this.clearSelection();
        this.notificationService.success(`تم حذف ${selected.length} فاتورة بنجاح`);
      }
    });
  }

  // Utility methods
  getStatusColor(status: InvoiceStatus): string {
    return this.statusConfig[status]?.color || 'primary';
  }

  getStatusIcon(status: InvoiceStatus): string {
    return this.statusConfig[status]?.icon || 'info';
  }

  getPaymentStatusColor(status: PaymentStatus): string {
    return this.paymentStatusConfig[status]?.color || 'primary';
  }

  getPaymentStatusIcon(status: PaymentStatus): string {
    return this.paymentStatusConfig[status]?.icon || 'info';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-SA');
  }

  isOverdue(invoice: Invoice): boolean {
    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    return dueDate < today && invoice.status !== InvoiceStatus.PAID;
  }

  hasPermission(roles: string[]): boolean {
    return this.authService.hasRole(roles);
  }
}
