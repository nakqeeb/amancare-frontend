// ===================================================================
// src/app/features/reports/components/financial-reports/financial-reports.component.ts
// ===================================================================
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { ChartWidgetComponent } from '../chart-widgets/chart-widget.component';

// Services & Models
import { ReportService } from '../../services/report.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  FinancialSummary,
  RevenueByService,
  OutstandingPayments,
  ReportFilter,
  ExportFormat,
  ReportType,
  ChartData,
  PeriodRevenue
} from '../../models/report.model';

@Component({
  selector: 'app-financial-reports',
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
    MatTabsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    HeaderComponent,
    SidebarComponent,
    ChartWidgetComponent
  ],
  templateUrl: './financial-reports.component.html',
  styleUrl: './financial-reports.component.scss'
})
export class FinancialReportsComponent implements OnInit {
  // Services
  private reportService = inject(ReportService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);

  // Signals
  financialSummary = signal<FinancialSummary | null>(null);
  revenueByService = signal<RevenueByService[]>([]);
  outstandingPayments = signal<OutstandingPayments[]>([]);
  loading = signal(false);
  selectedTab = signal(0);
  currentUser = this.authService.currentUser;

  // Form
  filterForm!: FormGroup;

  // Chart data
  revenueChartData = computed(() => {
    const summary = this.financialSummary();
    return summary ? summary.revenueByPeriod.map(item => ({
      name: new Date(item.period).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }),
      value: item.revenue
    })) : [];
  });

  paymentMethodsChartData = computed(() => {
    const summary = this.financialSummary();
    return summary ? summary.paymentMethods.map(method => ({
      name: method.method,
      value: method.amount
    })) : [];
  });

  serviceRevenueChartData = computed(() => {
    return this.revenueByService().map(service => ({
      name: service.serviceName,
      value: service.totalRevenue
    }));
  });

  // Table columns for outstanding payments
  outstandingColumns = [
    'patientName',
    'invoiceNumber',
    'amount',
    'dueDate',
    'daysPastDue',
    'actions'
  ];

  ngOnInit(): void {
    this.initializeForm();
    this.loadFinancialData();
  }

  private initializeForm(): void {
    const defaultRange = this.reportService.getDefaultDateRange();

    this.filterForm = this.fb.group({
      startDate: [defaultRange.startDate],
      endDate: [defaultRange.endDate],
      clinicId: [this.currentUser()?.clinicId],
      doctorId: [null],
      status: ['all']
    });

    // Auto-update when form changes
    this.filterForm.valueChanges.subscribe(() => {
      this.loadFinancialData();
    });
  }

  private loadFinancialData(): void {
    this.loading.set(true);

    const filters: ReportFilter = {
      dateRange: {
        startDate: this.filterForm.get('startDate')?.value,
        endDate: this.filterForm.get('endDate')?.value
      },
      clinicId: this.filterForm.get('clinicId')?.value,
      doctorId: this.filterForm.get('doctorId')?.value,
      status: this.filterForm.get('status')?.value === 'all' ? undefined : this.filterForm.get('status')?.value
    };

    // Load all financial data
    Promise.all([
      this.reportService.getFinancialSummary(filters).toPromise(),
      this.reportService.getRevenueByService(filters).toPromise(),
      this.reportService.getOutstandingPayments(filters).toPromise()
    ]).then(([summary, revenueByService, outstanding]) => {
      this.financialSummary.set(summary!);
      this.revenueByService.set(revenueByService!);
      this.outstandingPayments.set(outstanding!);
      this.loading.set(false);
    }).catch(error => {
      console.error('Error loading financial data:', error);
      this.notificationService.error('حدث خطأ في تحميل البيانات المالية');
      this.loading.set(false);
    });
  }

  // ===================================================================
  // EVENT HANDLERS
  // ===================================================================
  onTabChange(index: number): void {
    this.selectedTab.set(index);
  }

  onFilterChange(): void {
    this.loadFinancialData();
  }

  onResetFilters(): void {
    const defaultRange = this.reportService.getDefaultDateRange();
    this.filterForm.patchValue({
      startDate: defaultRange.startDate,
      endDate: defaultRange.endDate,
      doctorId: null,
      status: 'all'
    });
  }

  onExportReport(format: ExportFormat): void {
    const filters: ReportFilter = {
      dateRange: {
        startDate: this.filterForm.get('startDate')?.value,
        endDate: this.filterForm.get('endDate')?.value
      },
      clinicId: this.filterForm.get('clinicId')?.value
    };

    this.reportService.exportReport(ReportType.FINANCIAL, filters, format).subscribe({
      next: (blob) => {
        const filename = `financial_report_${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;
        this.downloadFile(blob, filename);
        this.notificationService.success('تم تصدير التقرير بنجاح');
      },
      error: (error) => {
        console.error('Export error:', error);
        this.notificationService.error('حدث خطأ في تصدير التقرير');
      }
    });
  }

  onViewInvoiceDetails(payment: OutstandingPayments): void {
    // Navigate to invoice details
    window.open(`/invoices/${payment.invoiceId}`, '_blank');
  }

  onContactPatient(payment: OutstandingPayments): void {
    // Open patient contact dialog or navigate to patient profile
    window.open(`/patients/${payment.patientId}`, '_blank');
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('ar-SA').format(num);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('ar-SA');
  }

  getPaymentStatusClass(daysPastDue: number): string {
    if (daysPastDue <= 0) return 'status-current';
    if (daysPastDue <= 7) return 'status-warning';
    if (daysPastDue <= 30) return 'status-overdue';
    return 'status-critical';
  }

  getCollectionRate(): number {
    const summary = this.financialSummary();
    if (!summary || summary.totalRevenue === 0) return 0;
    return (summary.totalPaid / summary.totalRevenue) * 100;
  }

  getPendingRate(): number {
    const summary = this.financialSummary();
    if (!summary || summary.totalRevenue === 0) return 0;
    return (summary.totalPending / summary.totalRevenue) * 100;
  }

  getOverdueRate(): number {
    const summary = this.financialSummary();
    if (!summary || summary.totalRevenue === 0) return 0;
    return (summary.totalOverdue / summary.totalRevenue) * 100;
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // ===================================================================
  // COMPUTED VALUES
  // ===================================================================
  totalOutstanding = computed(() => {
    return this.outstandingPayments().reduce((sum, payment) => sum + payment.amount, 0);
  });

  averageDaysPastDue = computed(() => {
    const payments = this.outstandingPayments();
    if (payments.length === 0) return 0;
    const totalDays = payments.reduce((sum, payment) => sum + payment.daysPastDue, 0);
    return Math.round(totalDays / payments.length);
  });

  criticalPayments = computed(() => {
    return this.outstandingPayments().filter(payment => payment.daysPastDue > 30);
  });
}
