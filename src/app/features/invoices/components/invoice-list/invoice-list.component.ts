// ===================================================================
// src/app/features/invoices/components/invoice-list/invoice-list.component.ts
// Invoice List Component - Complete Implementation
// ===================================================================
import { Component, inject, signal, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// Services & Models
import { InvoiceService } from '../../services/invoice.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  InvoiceResponse,
  InvoiceStatus,
  InvoiceSearchCriteria,
  INVOICE_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  Invoice,
  PaymentStatus
} from '../../models/invoice.model';

@Component({
  selector: 'app-invoice-list',
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
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatTooltipModule,
    MatChipsModule,
    MatBadgeModule,
    MatDividerModule,
    MatDialogModule,
    MatSlideToggleModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './invoice-list.component.html',
  styleUrl: './invoice-list.component.scss'
})
export class InvoiceListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Services
  private invoiceService = inject(InvoiceService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  // ===================================================================
  // STATE MANAGEMENT
  // ===================================================================

  // Data signals
  invoices = this.invoiceService.invoices;
  loading = this.invoiceService.loading;
  statistics = this.invoiceService.statistics;
  currentUser = this.authService.currentUser;

  // UI State signals
  viewMode = signal<'table' | 'cards'>('table');
  currentPage = signal(0);
  pageSize = signal(10);
  totalInvoices = signal(0);
  totalPages = signal(0);
  showAdvancedSearch = signal(false);
  selectedInvoices = signal<Invoice[]>([]);

  // Search Form
  searchForm: FormGroup;

  // ===================================================================
  // TABLE CONFIGURATION
  // ===================================================================

  displayedColumns: string[] = [
    'invoiceNumber',
    'invoiceDate',
    'patient',
    'totalAmount',
    'amountPaid',
    'balanceDue',
    'status',
    'paymentStatus',
    'actions'
  ];

  // Status labels
  statusLabels = INVOICE_STATUS_LABELS;
  paymentStatusLabels = PAYMENT_STATUS_LABELS;

  getInvoiceStatusLabel(status: string | InvoiceStatus): string {
    return INVOICE_STATUS_LABELS[status as InvoiceStatus] || '';
  }

  getPaymentStatusLabel(status: string | PaymentStatus): string {
    return PAYMENT_STATUS_LABELS[status as PaymentStatus] || '';
  }

  // ===================================================================
  // LIFECYCLE HOOKS
  // ===================================================================

  constructor() {
    this.searchForm = this.fb.group({
      searchTerm: [''],
      status: [''],
      fromDate: [null],
      toDate: [null],
      minAmount: [''],
      maxAmount: ['']
    });
  }

  ngOnInit(): void {
    this.loadInvoices();
    this.loadStatistics();
  }

  // ===================================================================
  // DATA LOADING
  // ===================================================================

  private loadInvoices(): void {
    const criteria = this.buildSearchCriteria();

    this.invoiceService.getAllInvoices(criteria).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.totalInvoices.set(response.data.totalElements);
          this.totalPages.set(response.data.totalPages);
        }
      },
      error: (error) => {
        console.error('Error loading invoices:', error);
      }
    });
  }

  private loadStatistics(): void {
    this.invoiceService.getInvoiceStatistics().subscribe();
  }

  private buildSearchCriteria(): InvoiceSearchCriteria {
    const formValue = this.searchForm.value;

    return {
      status: formValue.status || undefined,
      fromDate: formValue.fromDate ? this.formatDate(formValue.fromDate) : undefined,
      toDate: formValue.toDate ? this.formatDate(formValue.toDate) : undefined,
      minAmount: formValue.minAmount || undefined,
      maxAmount: formValue.maxAmount || undefined,
      sortBy: 'invoiceDate',
      sortDirection: 'DESC'
    };
  }

  // ===================================================================
  // EVENT HANDLERS
  // ===================================================================

  onSearch(): void {
    this.currentPage.set(0);
    this.loadInvoices();
  }

  onClearSearch(): void {
    this.searchForm.reset({
      searchTerm: '',
      status: '',
      fromDate: null,
      toDate: null,
      minAmount: '',
      maxAmount: ''
    });
    this.currentPage.set(0);
    this.loadInvoices();
  }

  onToggleAdvancedSearch(): void {
    this.showAdvancedSearch.set(!this.showAdvancedSearch());
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadInvoices();
  }

  onToggleViewMode(): void {
    this.viewMode.set(this.viewMode() === 'table' ? 'cards' : 'table');
  }

  onRefresh(): void {
    this.loadInvoices();
    this.loadStatistics();
  }

  // ===================================================================
  // INVOICE ACTIONS
  // ===================================================================

  onCreateInvoice(): void {
    this.router.navigate(['/invoices/create']);
  }

  onViewInvoice(invoice: InvoiceResponse): void {
    this.router.navigate(['/invoices', invoice.id]);
  }

  onEditInvoice(invoice: InvoiceResponse): void {
    if (!this.invoiceService.isInvoiceEditable(invoice)) {
      this.notificationService.warning('لا يمكن تعديل الفواتير المدفوعة أو الملغية');
      return;
    }
    this.router.navigate(['/invoices', invoice.id, 'edit']);
  }

  onDeleteInvoice(invoice: InvoiceResponse): void {
    if (!this.canCancelInvoice(invoice)) {
      this.notificationService.warning('لا يمكن إلغاء هذه الفاتورة');
      return;
    }

    const confirmed = confirm(`هل تريد إلغاء الفاتورة رقم ${invoice.invoiceNumber}؟`);
    if (confirmed) {
      const reason = prompt('الرجاء إدخال سبب الإلغاء:');
      if (reason) {
        this.invoiceService.cancelInvoice(invoice.id, reason).subscribe({
          next: () => {
            this.loadInvoices();
          }
        });
      }
    }
  }

  onAddPayment(invoice: InvoiceResponse): void {
    if (invoice.balanceDue <= 0) {
      this.notificationService.info('الفاتورة مدفوعة بالكامل');
      return;
    }
    this.router.navigate(['/invoices', invoice.id, 'payment']);
  }

  onSendInvoice(invoice: InvoiceResponse): void {
    const confirmed = confirm(`هل تريد إرسال الفاتورة رقم ${invoice.invoiceNumber} للمريض؟`);
    if (confirmed) {
      this.invoiceService.sendInvoice(invoice.id).subscribe();
    }
  }

  onPrintInvoice(invoice: InvoiceResponse): void {
    this.notificationService.info('جاري تحضير الفاتورة للطباعة...');
    // TODO: Implement PDF generation when backend endpoint is ready
    // window.open(`/invoices/${invoice.id}/pdf`, '_blank');
  }

  // ===================================================================
  // PERMISSION CHECKS
  // ===================================================================

  canCreateInvoice(): boolean {
    const user = this.currentUser();
    return ['SYSTEM_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST'].includes(user?.role || '');
  }

  canEditInvoice(invoice: InvoiceResponse): boolean {
    const user = this.currentUser();
    return ['SYSTEM_ADMIN', 'ADMIN', 'RECEPTIONIST'].includes(user?.role || '') &&
      this.invoiceService.isInvoiceEditable(invoice);
  }

  canCancelInvoice(invoice: InvoiceResponse): boolean {
    const user = this.currentUser();
    return ['SYSTEM_ADMIN', 'ADMIN'].includes(user?.role || '') &&
      this.invoiceService.canCancelInvoice(invoice);
  }

  canAddPayment(invoice: InvoiceResponse): boolean {
    const user = this.currentUser();
    return ['SYSTEM_ADMIN', 'ADMIN', 'RECEPTIONIST'].includes(user?.role || '') &&
      invoice.balanceDue > 0;
  }

  // ===================================================================
  // UI HELPERS
  // ===================================================================

  getStatusColor(status: InvoiceStatus): string {
    const colors: Record<InvoiceStatus, string> = {
      [InvoiceStatus.DRAFT]: 'default',
      [InvoiceStatus.PENDING]: 'accent',
      [InvoiceStatus.SENT]: 'primary',
      [InvoiceStatus.VIEWED]: 'primary',
      [InvoiceStatus.PAID]: 'primary',
      [InvoiceStatus.PARTIALLY_PAID]: 'accent',
      [InvoiceStatus.OVERDUE]: 'warn',
      [InvoiceStatus.CANCELLED]: 'warn',
      [InvoiceStatus.REFUNDED]: 'accent'
    };
    return colors[status] || '';
  }

  getStatusIcon(status: InvoiceStatus): string {
    const icons: Record<InvoiceStatus, string> = {
      [InvoiceStatus.DRAFT]: 'edit',
      [InvoiceStatus.PENDING]: 'schedule',
      [InvoiceStatus.SENT]: 'send',
      [InvoiceStatus.VIEWED]: 'visibility',
      [InvoiceStatus.PAID]: 'check_circle',
      [InvoiceStatus.PARTIALLY_PAID]: 'donut_small',
      [InvoiceStatus.OVERDUE]: 'warning',
      [InvoiceStatus.CANCELLED]: 'cancel',
      [InvoiceStatus.REFUNDED]: 'undo'
    };
    return icons[status] || 'help';
  }

  formatCurrency(amount: number): string {
    return this.invoiceService.formatCurrency(amount);
  }

  formatDate(date: Date | string): string {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return date.toISOString().split('T')[0];
  }

  getInvoiceStatusOptions(): { value: string; label: string }[] {
    return Object.entries(INVOICE_STATUS_LABELS).map(([value, label]) => ({
      value,
      label
    }));
  }

  getSearchSummary(): string {
    const total = this.totalInvoices();
    const showing = this.invoices().length;
    return `عرض ${showing} من ${total} فاتورة`;
  }
}
