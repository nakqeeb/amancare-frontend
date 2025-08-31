import { toObservable } from '@angular/core/rxjs-interop';
// ===================================================================
// src/app/features/reports/components/reports-history/reports-history.component.ts
// ===================================================================
import { Component, inject, signal, OnInit, computed, ViewChild } from '@angular/core';
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
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SelectionModel } from '@angular/cdk/collections';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// Services & Models
import { ReportService } from '../../services/report.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  ReportType,
  ExportFormat,
  ReportFilter
} from '../../models/report.model';

// Interfaces for Reports History
export interface HistoricalReport {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  status: 'completed' | 'failed' | 'processing' | 'scheduled';
  createdAt: string;
  createdBy: string;
  createdByName: string;
  fileSize: number;
  filePath: string;
  downloadCount: number;
  duration: number; // Generation time in milliseconds
  parameters: ReportParameters;
  tags: string[];
}

export interface ReportParameters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  filters: any;
  format: ExportFormat;
  includeCharts: boolean;
  clinicId?: number;
  doctorId?: number;
}

export interface ReportStats {
  totalReports: number;
  successfulReports: number;
  failedReports: number;
  scheduledReports: number;
  averageGenerationTime: number;
  totalDataSize: number;
  mostPopularType: string;
}

@Component({
  selector: 'app-reports-history',
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
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatCheckboxModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatExpansionModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './reports-history.component.html',
  styleUrl: './reports-history.component.scss'
})
export class ReportsHistoryComponent implements OnInit {
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Services
  private reportService = inject(ReportService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  // Signals
  loading = signal(false);
  reports = signal<HistoricalReport[]>([]);
  reportStats = signal<ReportStats>({
    totalReports: 0,
    successfulReports: 0,
    failedReports: 0,
    scheduledReports: 0,
    averageGenerationTime: 0,
    totalDataSize: 0,
    mostPopularType: ''
  });
  selectedReports = new SelectionModel<HistoricalReport>(true, []);
  currentUser = this.authService.currentUser;

  // Table configuration
  displayedColumns = [
    'select',
    'name',
    'type',
    'status',
    'createdAt',
    'createdBy',
    'size',
    'duration',
    'actions'
  ];
  dataSource = new MatTableDataSource<HistoricalReport>();

  // Forms
  searchForm!: FormGroup;
  filtersForm!: FormGroup;

  // Computed values
  filteredReports = computed(() => {
    const searchTerm = this.searchForm?.get('searchTerm')?.value?.toLowerCase() || '';
    const typeFilter = this.filtersForm?.get('type')?.value;
    const statusFilter = this.filtersForm?.get('status')?.value;
    const createdByFilter = this.filtersForm?.get('createdBy')?.value;

    return this.reports().filter(report => {
      const matchesSearch = !searchTerm ||
        report.name.toLowerCase().includes(searchTerm) ||
        report.description.toLowerCase().includes(searchTerm) ||
        report.createdByName.toLowerCase().includes(searchTerm);

      const matchesType = !typeFilter || report.type === typeFilter;
      const matchesStatus = !statusFilter || report.status === statusFilter;
      const matchesCreatedBy = !createdByFilter || report.createdBy === createdByFilter;

      return matchesSearch && matchesType && matchesStatus && matchesCreatedBy;
    });
  });

  selectedCount = computed(() => this.selectedReports.selected.length);

  // Constants
  readonly reportTypes = [
    { value: 'FINANCIAL', label: 'التقارير المالية' },
    { value: 'OPERATIONAL', label: 'التقارير التشغيلية' },
    { value: 'PATIENT', label: 'تقارير المرضى' },
    { value: 'CUSTOM', label: 'التقارير المخصصة' }
  ];

  readonly statusOptions = [
    { value: 'completed', label: 'مكتمل' },
    { value: 'failed', label: 'فاشل' },
    { value: 'processing', label: 'قيد المعالجة' },
    { value: 'scheduled', label: 'مجدول' }
  ];

  ngOnInit(): void {
    this.initializeForms();
    this.loadReports();
    this.loadReportStats();
    this.setupTableDataSource();
  }

  private initializeForms(): void {
    this.searchForm = this.fb.group({
      searchTerm: ['']
    });

    this.filtersForm = this.fb.group({
      type: [null],
      status: [null],
      createdBy: [null],
      dateFrom: [null],
      dateTo: [null],
      minSize: [null],
      maxSize: [null]
    });

    // Watch for search changes
    this.searchForm.get('searchTerm')?.valueChanges.subscribe(() => {
      this.applyFilters();
    });

    // Watch for filter changes
    this.filtersForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  private setupTableDataSource(): void {
    // Update data source when filtered reports change
    toObservable(this.filteredReports).subscribe(reports => {
      this.dataSource.data = reports;
    });
  }

  private async loadReports(): Promise<void> {
    this.loading.set(true);

    try {
      // Simulate API call - replace with actual service call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockReports: HistoricalReport[] = [
        {
          id: '1',
          name: 'تقرير الإيرادات الشهري - مايو 2024',
          description: 'تقرير مفصل عن إيرادات العيادة لشهر مايو',
          type: ReportType.FINANCIAL,
          status: 'completed',
          createdAt: '2024-06-01T09:30:00Z',
          createdBy: 'admin',
          createdByName: 'محمد أحمد',
          fileSize: 2048576, // 2MB
          filePath: '/reports/financial-may-2024.pdf',
          downloadCount: 15,
          duration: 3500,
          parameters: {
            dateRange: { startDate: '2024-05-01', endDate: '2024-05-31' },
            filters: { clinicId: 1 },
            format: ExportFormat.PDF,
            includeCharts: true
          },
          tags: ['شهري', 'مالي', 'مايو']
        },
        {
          id: '2',
          name: 'تقرير المرضى الجدد - الربع الثاني',
          description: 'إحصائيات المرضى الجدد للربع الثاني من العام',
          type: ReportType.PATIENT,
          status: 'completed',
          createdAt: '2024-07-02T14:15:00Z',
          createdBy: 'receptionist',
          createdByName: 'فاطمة سالم',
          fileSize: 1536000, // 1.5MB
          filePath: '/reports/new-patients-q2-2024.xlsx',
          downloadCount: 8,
          duration: 2800,
          parameters: {
            dateRange: { startDate: '2024-04-01', endDate: '2024-06-30' },
            filters: {},
            format: ExportFormat.EXCEL,
            includeCharts: false
          },
          tags: ['ربعي', 'مرضى', 'جديد']
        },
        {
          id: '3',
          name: 'تقرير المواعيد اليومي',
          description: 'تقرير المواعيد لليوم الحالي',
          type: ReportType.OPERATIONAL,
          status: 'processing',
          createdAt: '2024-08-31T08:00:00Z',
          createdBy: 'doctor',
          createdByName: 'د. خالد العتيبي',
          fileSize: 0,
          filePath: '',
          downloadCount: 0,
          duration: 0,
          parameters: {
            dateRange: { startDate: '2024-08-31', endDate: '2024-08-31' },
            filters: { doctorId: 5 },
            format: ExportFormat.PDF,
            includeCharts: true
          },
          tags: ['يومي', 'مواعيد']
        },
        {
          id: '4',
          name: 'تقرير مخصص - أداء العيادات',
          description: 'تقرير مقارن لأداء العيادات المختلفة',
          type: ReportType.CUSTOM,
          status: 'failed',
          createdAt: '2024-08-30T16:45:00Z',
          createdBy: 'admin',
          createdByName: 'محمد أحمد',
          fileSize: 0,
          filePath: '',
          downloadCount: 0,
          duration: 8500,
          parameters: {
            dateRange: { startDate: '2024-08-01', endDate: '2024-08-30' },
            filters: { includeAllClinics: true },
            format: ExportFormat.PDF,
            includeCharts: true
          },
          tags: ['مخصص', 'مقارنة', 'عيادات']
        }
      ];

      this.reports.set(mockReports);

    } catch (error) {
      this.notificationService.error('حدث خطأ في تحميل سجل التقارير');
      console.error('Error loading reports history:', error);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadReportStats(): Promise<void> {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const reports = this.reports();
      const stats: ReportStats = {
        totalReports: reports.length,
        successfulReports: reports.filter(r => r.status === 'completed').length,
        failedReports: reports.filter(r => r.status === 'failed').length,
        scheduledReports: reports.filter(r => r.status === 'scheduled').length,
        averageGenerationTime: reports.length > 0 ?
          reports.reduce((acc, r) => acc + r.duration, 0) / reports.length : 0,
        totalDataSize: reports.reduce((acc, r) => acc + r.fileSize, 0),
        mostPopularType: 'FINANCIAL'
      };

      this.reportStats.set(stats);

    } catch (error) {
      console.error('Error loading report stats:', error);
    }
  }

  private applyFilters(): void {
    // The computed property will automatically update the filtered results
    this.dataSource.data = this.filteredReports();
  }

  // Event Handlers
  onSearchClear(): void {
    this.searchForm.get('searchTerm')?.setValue('');
  }

  onFiltersReset(): void {
    this.filtersForm.reset();
  }

  onReportSelect(report: HistoricalReport, event: any): void {
    if (event.checked) {
      this.selectedReports.select(report);
    } else {
      this.selectedReports.deselect(report);
    }
  }

  onMasterToggle(): void {
    const isAllSelected = this.isAllSelected();

    if (isAllSelected) {
      this.selectedReports.clear();
    } else {
      this.filteredReports().forEach(report => {
        this.selectedReports.select(report);
      });
    }
  }

  isAllSelected(): boolean {
    const filteredCount = this.filteredReports().length;
    const selectedCount = this.selectedReports.selected.length;
    return filteredCount > 0 && selectedCount === filteredCount;
  }

  async onDownloadReport(report: HistoricalReport): Promise<void> {
    if (report.status !== 'completed') {
      this.notificationService.warning('هذا التقرير غير متاح للتنزيل');
      return;
    }

    try {
      this.loading.set(true);

      // Simulate download
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update download count
      const reports = this.reports();
      const updatedReports = reports.map(r =>
        r.id === report.id ? { ...r, downloadCount: r.downloadCount + 1 } : r
      );
      this.reports.set(updatedReports);

      this.notificationService.success('تم تنزيل التقرير بنجاح');

    } catch (error) {
      this.notificationService.error('حدث خطأ في تنزيل التقرير');
      console.error('Download error:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async onViewReport(report: HistoricalReport): Promise<void> {
    if (report.status !== 'completed') {
      this.notificationService.warning('هذا التقرير غير متاح للعرض');
      return;
    }

    try {
      // Open report preview dialog
      // const dialogRef = this.dialog.open(ReportPreviewDialogComponent, {
      //   width: '90vw',
      //   height: '90vh',
      //   data: { report }
      // });

      console.log('Opening report preview for:', report.name);

    } catch (error) {
      this.notificationService.error('حدث خطأ في عرض التقرير');
      console.error('View error:', error);
    }
  }

  async onDeleteReport(report: HistoricalReport): Promise<void> {
    const confirmed = confirm(`هل أنت متأكد من حذف التقرير "${report.name}"؟`);
    if (!confirmed) return;

    try {
      this.loading.set(true);

      // Simulate deletion
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Remove from local state
      const reports = this.reports();
      const updatedReports = reports.filter(r => r.id !== report.id);
      this.reports.set(updatedReports);

      // Remove from selection if selected
      this.selectedReports.deselect(report);

      // Update stats
      this.loadReportStats();

      this.notificationService.success('تم حذف التقرير بنجاح');

    } catch (error) {
      this.notificationService.error('حدث خطأ في حذف التقرير');
      console.error('Delete error:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async onBulkDelete(): Promise<void> {
    const selectedCount = this.selectedReports.selected.length;
    if (selectedCount === 0) return;

    const confirmed = confirm(`هل أنت متأكد من حذف ${selectedCount} تقرير؟`);
    if (!confirmed) return;

    try {
      this.loading.set(true);

      const selectedIds = this.selectedReports.selected.map(r => r.id);

      // Simulate bulk deletion
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Remove from local state
      const reports = this.reports();
      const updatedReports = reports.filter(r => !selectedIds.includes(r.id));
      this.reports.set(updatedReports);

      // Clear selection
      this.selectedReports.clear();

      // Update stats
      this.loadReportStats();

      this.notificationService.success(`تم حذف ${selectedCount} تقرير بنجاح`);

    } catch (error) {
      this.notificationService.error('حدث خطأ في حذف التقارير');
      console.error('Bulk delete error:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async onBulkDownload(): Promise<void> {
    const selectedReports = this.selectedReports.selected
      .filter(r => r.status === 'completed');

    if (selectedReports.length === 0) {
      this.notificationService.warning('لا توجد تقارير متاحة للتنزيل');
      return;
    }

    try {
      this.loading.set(true);

      // Simulate bulk download (create ZIP file)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update download counts
      const reports = this.reports();
      const selectedIds = selectedReports.map(r => r.id);
      const updatedReports = reports.map(r =>
        selectedIds.includes(r.id)
          ? { ...r, downloadCount: r.downloadCount + 1 }
          : r
      );
      this.reports.set(updatedReports);

      this.notificationService.success(`تم تنزيل ${selectedReports.length} تقرير بنجاح`);

    } catch (error) {
      this.notificationService.error('حدث خطأ في تنزيل التقارير');
      console.error('Bulk download error:', error);
    } finally {
      this.loading.set(false);
    }
  }

  onRefreshData(): void {
    this.loadReports();
    this.loadReportStats();
  }

  // Utility methods
  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      completed: 'مكتمل',
      failed: 'فاشل',
      processing: 'قيد المعالجة',
      scheduled: 'مجدول'
    };
    return statusLabels[status] || status;
  }

  getStatusIcon(status: string): string {
    const statusIcons: { [key: string]: string } = {
      completed: 'check_circle',
      failed: 'error',
      processing: 'hourglass_empty',
      scheduled: 'schedule'
    };
    return statusIcons[status] || 'help';
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getReportTypeLabel(type: ReportType): string {
    const typeLabels: { [key: string]: string } = {
      FINANCIAL: 'مالي',
      OPERATIONAL: 'تشغيلي',
      PATIENT: 'مرضى',
      CUSTOM: 'مخصص'
    };
    return typeLabels[type] || type;
  }

  getReportTypeIcon(type: ReportType): string {
    const typeIcons: { [key: string]: string } = {
      FINANCIAL: 'attach_money',
      OPERATIONAL: 'business',
      PATIENT: 'people',
      CUSTOM: 'build'
    };
    return typeIcons[type] || 'description';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDuration(milliseconds: number): string {
    if (milliseconds === 0) return '-';

    const seconds = Math.floor(milliseconds / 1000);
    if (seconds < 60) {
      return `${seconds}ث`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return remainingSeconds > 0
      ? `${minutes}د ${remainingSeconds}ث`
      : `${minutes}د`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  onFiltersChange(): void {
    this.applyFilters();
  }
}
