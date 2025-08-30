// ===================================================================
// src/app/features/invoices/components/invoice-summary/invoice-summary.component.ts
// ===================================================================
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
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
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatGridListModule } from '@angular/material/grid-list';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// Services & Models
import { InvoiceService } from '../../services/invoice.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  Invoice,
  InvoiceSummary,
  InvoiceStatus,
  PaymentStatus,
  InvoiceSearchCriteria
} from '../../models/invoice.model';
import { MatNativeDateModule } from '@angular/material/core';

interface MonthlyData {
  month: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  invoiceCount: number;
}

interface StatusData {
  status: InvoiceStatus | PaymentStatus;
  count: number;
  percentage: number;
  amount: number;
}

@Component({
  selector: 'app-invoice-summary',
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
    MatProgressBarModule,
    MatTabsModule,
    MatGridListModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './invoice-summary.component.html',
  styleUrl: './invoice-summary.component.scss'
})
export class InvoiceSummaryComponent implements OnInit {
  // Services
  private invoiceService = inject(InvoiceService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // Signals
  loading = signal(false);
  invoiceSummary = signal<InvoiceSummary | null>(null);
  invoices = signal<Invoice[]>([]);
  selectedTab = signal(0);

  // Forms
  filterForm!: FormGroup;

  // Computed data
  monthlyData = computed(() => this.calculateMonthlyData());
  statusData = computed(() => this.calculateStatusData());
  paymentStatusData = computed(() => this.calculatePaymentStatusData());
  topPatients = computed(() => this.calculateTopPatients());
  recentInvoices = computed(() => this.getRecentInvoices());

  // Chart data
  chartData = computed(() => this.prepareChartData());

  // Table columns
  recentInvoicesColumns = ['invoiceNumber', 'patientName', 'issueDate', 'totalAmount', 'status'];
  topPatientsColumns = ['patientName', 'invoiceCount', 'totalAmount', 'lastInvoice'];

  // Enums for template
  InvoiceStatus = InvoiceStatus;
  PaymentStatus = PaymentStatus;

  ngOnInit(): void {
    this.initializeFilterForm();
    this.loadData();
  }

  private initializeFilterForm(): void {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1).toISOString().split('T')[0];
    const endOfYear = new Date(currentYear, 11, 31).toISOString().split('T')[0];

    this.filterForm = this.fb.group({
      fromDate: [startOfYear],
      toDate: [endOfYear],
      status: [''],
      paymentStatus: ['']
    });

    // Auto-refresh on form changes
    this.filterForm.valueChanges.subscribe(() => {
      this.loadData();
    });
  }

  loadData(): void {
    this.loading.set(true);

    const criteria: InvoiceSearchCriteria = {
      ...this.filterForm.value,
      page: 0,
      pageSize: 1000 // Get all for summary
    };

    // Load invoices for detailed analysis
    this.invoiceService.getInvoices(criteria).subscribe({
      next: (invoices) => {
        this.invoices.set(invoices);
        this.loadSummary();
      },
      error: (error) => {
        this.loading.set(false);
        this.notificationService.error('خطأ في تحميل البيانات: ' + error.message);
      }
    });
  }

  private loadSummary(): void {
    this.invoiceService.getInvoiceSummary().subscribe({
      next: (summary) => {
        this.invoiceSummary.set(summary);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.notificationService.error('خطأ في تحميل الملخص: ' + error.message);
      }
    });
  }

  // Data calculation methods
  private calculateMonthlyData(): MonthlyData[] {
    const invoices = this.invoices();
    const monthlyMap = new Map<string, MonthlyData>();

    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short' });

      monthlyMap.set(key, {
        month: monthName,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        invoiceCount: 0
      });
    }

    // Aggregate invoice data by month
    invoices.forEach(invoice => {
      const date = new Date(invoice.issueDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (monthlyMap.has(key)) {
        const data = monthlyMap.get(key)!;
        data.totalAmount += invoice.totalAmount;
        data.paidAmount += invoice.paidAmount || 0;
        data.pendingAmount += invoice.remainingAmount || 0;
        data.invoiceCount += 1;
      }
    });

    return Array.from(monthlyMap.values());
  }

  private calculateStatusData(): StatusData[] {
    const invoices = this.invoices();
    const statusMap = new Map<InvoiceStatus, { count: number; amount: number }>();

    // Initialize all statuses
    Object.values(InvoiceStatus).forEach(status => {
      statusMap.set(status, { count: 0, amount: 0 });
    });

    // Count invoices by status
    invoices.forEach(invoice => {
      const data = statusMap.get(invoice.status)!;
      data.count += 1;
      data.amount += invoice.totalAmount;
    });

    const totalInvoices = invoices.length;

    return Array.from(statusMap.entries()).map(([status, data]) => ({
      status,
      count: data.count,
      percentage: totalInvoices > 0 ? (data.count / totalInvoices) * 100 : 0,
      amount: data.amount
    })).filter(item => item.count > 0);
  }

  private calculatePaymentStatusData(): StatusData[] {
    const invoices = this.invoices();
    const statusMap = new Map<PaymentStatus, { count: number; amount: number }>();

    // Initialize all payment statuses
    Object.values(PaymentStatus).forEach(status => {
      statusMap.set(status, { count: 0, amount: 0 });
    });

    // Count invoices by payment status
    invoices.forEach(invoice => {
      const data = statusMap.get(invoice.paymentStatus)!;
      data.count += 1;
      data.amount += invoice.remainingAmount || 0;
    });

    const totalInvoices = invoices.length;

    return Array.from(statusMap.entries()).map(([status, data]) => ({
      status,
      count: data.count,
      percentage: totalInvoices > 0 ? (data.count / totalInvoices) * 100 : 0,
      amount: data.amount
    })).filter(item => item.count > 0);
  }

  private calculateTopPatients(): any[] {
    const invoices = this.invoices();
    const patientMap = new Map<number, {
      name: string;
      invoiceCount: number;
      totalAmount: number;
      lastInvoiceDate: string;
    }>();

    // Aggregate by patient
    invoices.forEach(invoice => {
      if (!patientMap.has(invoice.patientId)) {
        patientMap.set(invoice.patientId, {
          name: invoice.patientName || 'غير محدد',
          invoiceCount: 0,
          totalAmount: 0,
          lastInvoiceDate: invoice.issueDate
        });
      }

      const data = patientMap.get(invoice.patientId)!;
      data.invoiceCount += 1;
      data.totalAmount += invoice.totalAmount;

      if (new Date(invoice.issueDate) > new Date(data.lastInvoiceDate)) {
        data.lastInvoiceDate = invoice.issueDate;
      }
    });

    // Sort by total amount and return top 10
    return Array.from(patientMap.entries())
      .map(([patientId, data]) => ({ patientId, ...data }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);
  }

  private getRecentInvoices(): Invoice[] {
    return this.invoices()
      .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
      .slice(0, 10);
  }

  private prepareChartData(): any {
    const monthlyData = this.monthlyData();

    return {
      monthly: {
        labels: monthlyData.map(d => d.month),
        datasets: [
          {
            label: 'إجمالي الفواتير',
            data: monthlyData.map(d => d.totalAmount),
            borderColor: '#1976d2',
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            fill: true
          },
          {
            label: 'المبلغ المدفوع',
            data: monthlyData.map(d => d.paidAmount),
            borderColor: '#4caf50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            fill: true
          }
        ]
      },
      status: {
        labels: this.statusData().map(d => this.getStatusText(d.status as InvoiceStatus)),
        data: this.statusData().map(d => d.count)
      }
    };
  }

  // Navigation methods
  navigateToInvoices(): void {
    this.router.navigate(['/invoices']);
  }

  navigateToInvoice(invoice: Invoice): void {
    this.router.navigate(['/invoices', invoice.id]);
  }

  navigateToPatientInvoices(patientId: number): void {
    this.router.navigate(['/invoices/patient', patientId]);
  }

  // Export methods
  exportSummary(): void {
    this.notificationService.info('سيتم تصدير الملخص قريباً');
  }

  printSummary(): void {
    window.print();
  }

  // Utility methods
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

  formatPercentage(percentage: number): string {
    return `${percentage.toFixed(1)}%`;
  }

  // getStatusText(status: InvoiceStatus): string {
  //   const statusMap = {
  //     [InvoiceStatus.DRAFT]: 'مسودة',
  //     [InvoiceStatus.PENDING]: 'معلقة',
  //     [InvoiceStatus.SENT]: 'مرسلة',
  //     [InvoiceStatus.VIEWED]: 'تمت المشاهدة',
  //     [InvoiceStatus.PAID]: 'مدفوعة',
  //     [InvoiceStatus.PARTIALLY_PAID]: 'مدفوعة جزئياً',
  //     [InvoiceStatus.OVERDUE]: 'متأخرة',
  //     [InvoiceStatus.CANCELLED]: 'ملغية',
  //     [InvoiceStatus.REFUNDED]: 'مسترد'
  //   };
  //   return statusMap[status] || status;
  // }

  getStatusText(status: string): string {
    const s = status as InvoiceStatus;
    switch (s) {
      case 'PAID': return 'مدفوعة';
      case 'PENDING': return 'معلقة';
      case 'OVERDUE': return 'متأخرة';
      default: return 'غير معروف';
    }
  }

  // getPaymentStatusText(status: PaymentStatus): string {
  //   const statusMap = {
  //     [PaymentStatus.PENDING]: 'معلق',
  //     [PaymentStatus.COMPLETED]: 'مكتمل',
  //     [PaymentStatus.FAILED]: 'فشل',
  //     [PaymentStatus.CANCELLED]: 'ملغي',
  //     [PaymentStatus.REFUNDED]: 'مسترد'
  //   };
  //   return statusMap[status] || status;
  // }

  getPaymentStatusText(status: string): string {
    const s = status as PaymentStatus; // الكاست هنا
    switch (s) {
      case 'PENDING': return 'معلق';
      case 'COMPLETED': return 'مكتمل';
      case 'FAILED': return 'فشل';
      default: return 'غير معروف';
    }
  }

  // getStatusColor(status: InvoiceStatus): string {
  //   const colorMap = {
  //     [InvoiceStatus.DRAFT]: 'accent',
  //     [InvoiceStatus.PENDING]: 'warn',
  //     [InvoiceStatus.SENT]: 'primary',
  //     [InvoiceStatus.VIEWED]: 'accent',
  //     [InvoiceStatus.PAID]: 'primary',
  //     [InvoiceStatus.PARTIALLY_PAID]: 'accent',
  //     [InvoiceStatus.OVERDUE]: 'warn',
  //     [InvoiceStatus.CANCELLED]: 'basic',
  //     [InvoiceStatus.REFUNDED]: 'basic'
  //   };
  //   return colorMap[status] || 'basic';
  // }

  getStatusColor(status: string): string {
    const s = status as InvoiceStatus; // cast هنا مش في الـ template
    switch (s) {
      case 'PAID': return 'primary';
      case 'PENDING': return 'accent';
      case 'OVERDUE': return 'warn';
      default: return 'default';
    }
  }

  calculateCollectionRate(): number {
    const summary = this.invoiceSummary();
    if (!summary || summary.totalAmount === 0) return 0;

    return (summary.paidAmount / summary.totalAmount) * 100;
  }

  calculateAveragePaymentTime(): number {
    // This would be calculated based on actual payment dates vs due dates
    // For now, returning a mock value
    return 15; // days
  }

  onTabChange(index: number): void {
    this.selectedTab.set(index);
  }

  hasPermission(roles: string[]): boolean {
    return this.authService.hasRole(roles);
  }
}
