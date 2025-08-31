// ===================================================================
// src/app/features/reports/components/scheduled-reports/scheduled-reports.component.ts
// ===================================================================
import { Component, inject, signal, OnInit, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';

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

// Interfaces for Scheduled Reports
export interface ScheduledReport {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  status: 'active' | 'paused' | 'disabled' | 'error';
  schedule: ReportSchedule;
  parameters: ScheduledReportParameters;
  recipients: ReportRecipient[];
  lastExecution: ExecutionResult | null;
  nextExecution: string;
  createdAt: string;
  createdBy: string;
  createdByName: string;
  executionHistory: ExecutionResult[];
  statistics: ScheduleStatistics;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  time: string; // HH:mm format
  dayOfWeek?: number; // 0-6 (Sunday=0)
  dayOfMonth?: number; // 1-31
  timezone: string;
  startDate: string;
  endDate?: string;
}

export interface ScheduledReportParameters {
  filters: ReportFilter;
  format: ExportFormat;
  includeCharts: boolean;
  language: 'ar' | 'en';
  template?: string;
  customFields?: string[];
}

export interface ReportRecipient {
  id: string;
  email: string;
  name: string;
  role: string;
  deliveryMethod: 'email' | 'notification' | 'both';
  active: boolean;
}

export interface ExecutionResult {
  id: string;
  scheduledReportId: string;
  startTime: string;
  endTime?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  duration: number; // milliseconds
  fileSize?: number;
  filePath?: string;
  errorMessage?: string;
  sentTo: string[];
  downloadCount: number;
}

export interface ScheduleStatistics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  totalFilesGenerated: number;
  totalDataSize: number;
  lastSuccessfulRun?: string;
}

@Component({
  selector: 'app-scheduled-reports',
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
    MatListModule,
    MatDividerModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatMenuModule,
    MatTooltipModule,
    MatStepperModule,
    MatProgressBarModule,
    MatBadgeModule,
    MatDialogModule,
    MatSnackBarModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './scheduled-reports.component.html',
  styleUrl: './scheduled-reports.component.scss'
})
export class ScheduledReportsComponent implements OnInit, OnDestroy {
  // Services
  private reportService = inject(ReportService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  // Signals
  loading = signal(false);
  scheduledReports = signal<ScheduledReport[]>([]);
  recentExecutions = signal<ExecutionResult[]>([]);
  selectedReport = signal<ScheduledReport | null>(null);
  showCreateForm = signal(false);
  currentUser = this.authService.currentUser;

  // Forms
  scheduleForm!: FormGroup;
  recipientsFormArray!: FormArray;

  // Computed values
  activeReports = computed(() =>
    this.scheduledReports().filter(report => report.status === 'active')
  );

  pausedReports = computed(() =>
    this.scheduledReports().filter(report => report.status === 'paused')
  );

  errorReports = computed(() =>
    this.scheduledReports().filter(report => report.status === 'error')
  );

  totalReports = computed(() => this.scheduledReports().length);

  upcomingExecutions = computed(() => {
    const now = new Date();
    return this.scheduledReports()
      .filter(report => report.status === 'active' && new Date(report.nextExecution) > now)
      .sort((a, b) => new Date(a.nextExecution).getTime() - new Date(b.nextExecution).getTime())
      .slice(0, 5);
  });

  // Constants
  readonly frequencyOptions = [
    { value: 'daily', label: 'يومياً', icon: 'today' },
    { value: 'weekly', label: 'أسبوعياً', icon: 'date_range' },
    { value: 'monthly', label: 'شهرياً', icon: 'event' },
    { value: 'quarterly', label: 'ربع سنوي', icon: 'event_note' },
    { value: 'yearly', label: 'سنوياً', icon: 'calendar_view_year' }
  ];

  readonly reportTypes = [
    { value: 'FINANCIAL', label: 'التقارير المالية', icon: 'attach_money' },
    { value: 'OPERATIONAL', label: 'التقارير التشغيلية', icon: 'business' },
    { value: 'PATIENT', label: 'تقارير المرضى', icon: 'people' },
    { value: 'CUSTOM', label: 'التقارير المخصصة', icon: 'build' }
  ];

  readonly exportFormats = [
    { value: 'PDF', label: 'PDF', icon: 'picture_as_pdf' },
    { value: 'EXCEL', label: 'Excel', icon: 'table_chart' },
    { value: 'CSV', label: 'CSV', icon: 'storage' }
  ];

  readonly timeSlots = this.generateTimeSlots();

  private refreshInterval: any;

  ngOnInit(): void {
    this.initializeForms();
    this.loadScheduledReports();
    this.loadRecentExecutions();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  private initializeForms(): void {
    this.recipientsFormArray = this.fb.array([]);

    this.scheduleForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      type: ['', Validators.required],
      frequency: ['', Validators.required],
      time: ['09:00', Validators.required],
      dayOfWeek: [null],
      dayOfMonth: [null],
      startDate: [new Date(), Validators.required],
      endDate: [null],
      format: ['PDF', Validators.required],
      includeCharts: [true],
      language: ['ar', Validators.required],
      recipients: this.recipientsFormArray,
      // Filters
      clinicId: [null],
      doctorId: [null],
      dateRangeType: ['last-month', Validators.required], // last-week, last-month, etc.
      customStartDays: [30], // For relative date ranges
      customEndDays: [0]
    });

    // Watch frequency changes to show/hide day options
    this.scheduleForm.get('frequency')?.valueChanges.subscribe(frequency => {
      this.updateFrequencyValidators(frequency);
    });
  }

  private updateFrequencyValidators(frequency: string): void {
    const dayOfWeekControl = this.scheduleForm.get('dayOfWeek');
    const dayOfMonthControl = this.scheduleForm.get('dayOfMonth');

    // Clear existing validators
    dayOfWeekControl?.clearValidators();
    dayOfMonthControl?.clearValidators();

    // Add validators based on frequency
    switch (frequency) {
      case 'weekly':
        dayOfWeekControl?.setValidators([Validators.required]);
        break;
      case 'monthly':
      case 'quarterly':
      case 'yearly':
        dayOfMonthControl?.setValidators([Validators.required, Validators.min(1), Validators.max(31)]);
        break;
    }

    dayOfWeekControl?.updateValueAndValidity();
    dayOfMonthControl?.updateValueAndValidity();
  }

  private async loadScheduledReports(): Promise<void> {
    this.loading.set(true);

    try {
      // Simulate API call - replace with actual service call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockScheduledReports: ScheduledReport[] = [
        {
          id: '1',
          name: 'تقرير الإيرادات الشهري',
          description: 'تقرير تلقائي للإيرادات يتم إنشاؤه في بداية كل شهر',
          type: ReportType.FINANCIAL,
          status: 'active',
          schedule: {
            frequency: 'monthly',
            time: '08:00',
            dayOfMonth: 1,
            timezone: 'Asia/Riyadh',
            startDate: '2024-01-01'
          },
          parameters: {
            filters: { dateRange: { startDate: '', endDate: '' } },
            format: ExportFormat.PDF,
            includeCharts: true,
            language: 'ar'
          },
          recipients: [
            {
              id: '1',
              email: 'admin@clinic.com',
              name: 'إدارة العيادة',
              role: 'مدير',
              deliveryMethod: 'email',
              active: true
            },
            {
              id: '2',
              email: 'finance@clinic.com',
              name: 'قسم المحاسبة',
              role: 'محاسب',
              deliveryMethod: 'email',
              active: true
            }
          ],
          lastExecution: {
            id: 'exe1',
            scheduledReportId: '1',
            startTime: '2024-08-01T08:00:00Z',
            endTime: '2024-08-01T08:03:25Z',
            status: 'completed',
            duration: 205000,
            fileSize: 2048576,
            filePath: '/reports/scheduled/monthly-revenue-aug-2024.pdf',
            sentTo: ['admin@clinic.com', 'finance@clinic.com'],
            downloadCount: 5
          },
          nextExecution: '2024-09-01T08:00:00Z',
          createdAt: '2024-01-01T12:00:00Z',
          createdBy: 'admin',
          createdByName: 'محمد أحمد',
          executionHistory: [],
          statistics: {
            totalExecutions: 8,
            successfulExecutions: 8,
            failedExecutions: 0,
            averageExecutionTime: 198000,
            totalFilesGenerated: 8,
            totalDataSize: 16777216, // 16MB
            lastSuccessfulRun: '2024-08-01T08:03:25Z'
          }
        },
        {
          id: '2',
          name: 'تقرير المواعيد الأسبوعي',
          description: 'ملخص أسبوعي للمواعيد والحضور',
          type: ReportType.OPERATIONAL,
          status: 'active',
          schedule: {
            frequency: 'weekly',
            time: '17:00',
            dayOfWeek: 0, // Sunday
            timezone: 'Asia/Riyadh',
            startDate: '2024-06-01'
          },
          parameters: {
            filters: { dateRange: { startDate: '', endDate: '' } },
            format: ExportFormat.EXCEL,
            includeCharts: false,
            language: 'ar'
          },
          recipients: [
            {
              id: '3',
              email: 'reception@clinic.com',
              name: 'قسم الاستقبال',
              role: 'موظف استقبال',
              deliveryMethod: 'both',
              active: true
            }
          ],
          lastExecution: {
            id: 'exe2',
            scheduledReportId: '2',
            startTime: '2024-08-25T17:00:00Z',
            endTime: '2024-08-25T17:01:45Z',
            status: 'completed',
            duration: 105000,
            fileSize: 524288,
            filePath: '/reports/scheduled/weekly-appointments-w34-2024.xlsx',
            sentTo: ['reception@clinic.com'],
            downloadCount: 2
          },
          nextExecution: '2024-09-01T17:00:00Z',
          createdAt: '2024-06-01T10:00:00Z',
          createdBy: 'receptionist',
          createdByName: 'فاطمة سالم',
          executionHistory: [],
          statistics: {
            totalExecutions: 13,
            successfulExecutions: 12,
            failedExecutions: 1,
            averageExecutionTime: 98000,
            totalFilesGenerated: 12,
            totalDataSize: 6291456, // 6MB
            lastSuccessfulRun: '2024-08-25T17:01:45Z'
          }
        },
        {
          id: '3',
          name: 'تقرير المرضى الجدد',
          description: 'إحصائيات يومية للمرضى الجدد',
          type: ReportType.PATIENT,
          status: 'paused',
          schedule: {
            frequency: 'daily',
            time: '20:00',
            timezone: 'Asia/Riyadh',
            startDate: '2024-07-01'
          },
          parameters: {
            filters: { dateRange: { startDate: '', endDate: '' } },
            format: ExportFormat.CSV,
            includeCharts: false,
            language: 'en'
          },
          recipients: [
            {
              id: '4',
              email: 'marketing@clinic.com',
              name: 'قسم التسويق',
              role: 'مسوق',
              deliveryMethod: 'email',
              active: false
            }
          ],
          lastExecution: {
            id: 'exe3',
            scheduledReportId: '3',
            startTime: '2024-08-15T20:00:00Z',
            endTime: '2024-08-15T20:00:35Z',
            status: 'completed',
            duration: 35000,
            fileSize: 102400,
            filePath: '/reports/scheduled/daily-new-patients-2024-08-15.csv',
            sentTo: ['marketing@clinic.com'],
            downloadCount: 0
          },
          nextExecution: '', // Paused, so no next execution
          createdAt: '2024-07-01T15:00:00Z',
          createdBy: 'admin',
          createdByName: 'محمد أحمد',
          executionHistory: [],
          statistics: {
            totalExecutions: 45,
            successfulExecutions: 43,
            failedExecutions: 2,
            averageExecutionTime: 42000,
            totalFilesGenerated: 43,
            totalDataSize: 4396032, // ~4.2MB
            lastSuccessfulRun: '2024-08-15T20:00:35Z'
          }
        }
      ];

      this.scheduledReports.set(mockScheduledReports);

    } catch (error) {
      this.notificationService.error('حدث خطأ في تحميل التقارير المجدولة');
      console.error('Error loading scheduled reports:', error);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadRecentExecutions(): Promise<void> {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const allExecutions = this.scheduledReports()
        .map(report => report.lastExecution)
        .filter(exec => exec !== null)
        .sort((a, b) => new Date(b!.startTime).getTime() - new Date(a!.startTime).getTime())
        .slice(0, 10);

      this.recentExecutions.set(allExecutions as ExecutionResult[]);

    } catch (error) {
      console.error('Error loading recent executions:', error);
    }
  }

  private startAutoRefresh(): void {
    // Refresh data every 5 minutes
    this.refreshInterval = setInterval(() => {
      this.loadScheduledReports();
      this.loadRecentExecutions();
    }, 5 * 60 * 1000);
  }

  private generateTimeSlots(): { value: string; label: string }[] {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeValue = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const timeLabel = new Date(0, 0, 0, hour, minute).toLocaleTimeString('ar-SA', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        slots.push({ value: timeValue, label: timeLabel });
      }
    }
    return slots;
  }

  // Event Handlers
  onCreateNewSchedule(): void {
    this.showCreateForm.set(true);
    this.scheduleForm.reset();
    this.recipientsFormArray.clear();
    this.addRecipient(); // Add at least one recipient
  }

  onCancelCreate(): void {
    this.showCreateForm.set(false);
    this.scheduleForm.reset();
    this.selectedReport.set(null);
  }

  async onSubmitSchedule(): Promise<void> {
    if (this.scheduleForm.invalid) {
      this.notificationService.error('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }

    try {
      this.loading.set(true);

      const formValue = this.scheduleForm.value;

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newScheduledReport: ScheduledReport = {
        id: Date.now().toString(),
        name: formValue.name,
        description: formValue.description || '',
        type: formValue.type,
        status: 'active',
        schedule: {
          frequency: formValue.frequency,
          time: formValue.time,
          dayOfWeek: formValue.dayOfWeek,
          dayOfMonth: formValue.dayOfMonth,
          timezone: 'Asia/Riyadh',
          startDate: formValue.startDate.toISOString().split('T')[0],
          endDate: formValue.endDate?.toISOString().split('T')[0]
        },
        parameters: {
          filters: {
            dateRange: { startDate: '', endDate: '' },
            clinicId: formValue.clinicId,
            doctorId: formValue.doctorId
          },
          format: formValue.format,
          includeCharts: formValue.includeCharts,
          language: formValue.language
        },
        recipients: formValue.recipients.map((r: any, index: number) => ({
          id: (index + 1).toString(),
          email: r.email,
          name: r.name,
          role: r.role || 'مستخدم',
          deliveryMethod: r.deliveryMethod || 'email',
          active: true
        })),
        lastExecution: null,
        nextExecution: this.calculateNextExecution(formValue),
        createdAt: new Date().toISOString(),
        createdBy: this.currentUser()?.id.toString() || '',
        createdByName: this.currentUser()?.fullName || '',
        executionHistory: [],
        statistics: {
          totalExecutions: 0,
          successfulExecutions: 0,
          failedExecutions: 0,
          averageExecutionTime: 0,
          totalFilesGenerated: 0,
          totalDataSize: 0
        }
      };

      // Add to local state
      const reports = this.scheduledReports();
      this.scheduledReports.set([...reports, newScheduledReport]);

      this.showCreateForm.set(false);
      this.notificationService.success('تم إنشاء التقرير المجدول بنجاح');

    } catch (error) {
      this.notificationService.error('حدث خطأ في إنشاء التقرير المجدول');
      console.error('Error creating scheduled report:', error);
    } finally {
      this.loading.set(false);
    }
  }

  addRecipient(): void {
    const recipientGroup = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      name: ['', Validators.required],
      role: [''],
      deliveryMethod: ['email']
    });

    this.recipientsFormArray.push(recipientGroup);
  }

  removeRecipient(index: number): void {
    if (this.recipientsFormArray.length > 1) {
      this.recipientsFormArray.removeAt(index);
    }
  }

  async onToggleReportStatus(report: ScheduledReport): Promise<void> {
    try {
      this.loading.set(true);

      const newStatus = report.status === 'active' ? 'paused' : 'active';

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update local state
      const reports = this.scheduledReports();
      const updatedReports = reports.map(r =>
        r.id === report.id
          ? {
            ...r,
            status: newStatus as 'active' | 'paused' | 'disabled' | 'error',
            nextExecution: newStatus === 'active' ? this.calculateNextExecutionForReport(r) : ''
          }
          : r
      );
      this.scheduledReports.set(updatedReports);

      const statusText = newStatus === 'active' ? 'تم تفعيل' : 'تم إيقاف';
      this.notificationService.success(`${statusText} التقرير المجدول بنجاح`);

    } catch (error) {
      this.notificationService.error('حدث خطأ في تحديث حالة التقرير');
      console.error('Error toggling report status:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async onDeleteScheduledReport(report: ScheduledReport): Promise<void> {
    const confirmed = confirm(`هل أنت متأكد من حذف التقرير المجدول "${report.name}"؟`);
    if (!confirmed) return;

    try {
      this.loading.set(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Remove from local state
      const reports = this.scheduledReports();
      const updatedReports = reports.filter(r => r.id !== report.id);
      this.scheduledReports.set(updatedReports);

      this.notificationService.success('تم حذف التقرير المجدول بنجاح');

    } catch (error) {
      this.notificationService.error('حدث خطأ في حذف التقرير المجدول');
      console.error('Error deleting scheduled report:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async onRunNow(report: ScheduledReport): Promise<void> {
    if (report.status === 'disabled') {
      this.notificationService.warning('لا يمكن تشغيل التقرير المعطل');
      return;
    }

    try {
      this.loading.set(true);

      // Simulate immediate execution
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newExecution: ExecutionResult = {
        id: Date.now().toString(),
        scheduledReportId: report.id,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 30000).toISOString(),
        status: 'completed',
        duration: 30000,
        fileSize: 1048576, // 1MB
        filePath: `/reports/manual/${report.name}-${Date.now()}.${report.parameters.format.toLowerCase()}`,
        sentTo: report.recipients.map(r => r.email),
        downloadCount: 0
      };

      // Update report with new execution
      const reports = this.scheduledReports();
      const updatedReports = reports.map(r =>
        r.id === report.id
          ? {
            ...r,
            lastExecution: newExecution,
            statistics: {
              ...r.statistics,
              totalExecutions: r.statistics.totalExecutions + 1,
              successfulExecutions: r.statistics.successfulExecutions + 1,
              lastSuccessfulRun: newExecution.endTime!
            }
          }
          : r
      );
      this.scheduledReports.set(updatedReports);

      // Update recent executions
      const recentExecs = this.recentExecutions();
      this.recentExecutions.set([newExecution, ...recentExecs.slice(0, 9)]);

      this.notificationService.success('تم تشغيل التقرير بنجاح وإرساله للمستلمين');

    } catch (error) {
      this.notificationService.error('حدث خطأ في تشغيل التقرير');
      console.error('Error running report now:', error);
    } finally {
      this.loading.set(false);
    }
  }

  onViewExecutionHistory(report: ScheduledReport): void {
    this.selectedReport.set(report);
    // Could open a dialog showing detailed execution history
    console.log('Viewing execution history for:', report.name);
  }

  onDownloadExecution(execution: ExecutionResult): void {
    if (execution.status !== 'completed' || !execution.filePath) {
      this.notificationService.warning('هذا التقرير غير متاح للتنزيل');
      return;
    }

    // Simulate download
    console.log('Downloading execution:', execution.filePath);
    this.notificationService.success('تم بدء التنزيل');
  }

  onRefreshData(): void {
    this.loadScheduledReports();
    this.loadRecentExecutions();
  }

  // Utility methods
  private calculateNextExecution(formValue: any): string {
    const now = new Date();
    const [hours, minutes] = formValue.time.split(':').map(Number);
    const startDate = new Date(formValue.startDate);

    let nextExecution = new Date(Math.max(now.getTime(), startDate.getTime()));
    nextExecution.setHours(hours, minutes, 0, 0);

    switch (formValue.frequency) {
      case 'daily':
        if (nextExecution <= now) {
          nextExecution.setDate(nextExecution.getDate() + 1);
        }
        break;
      case 'weekly':
        const targetDay = formValue.dayOfWeek;
        const currentDay = nextExecution.getDay();
        let daysUntilTarget = targetDay - currentDay;
        if (daysUntilTarget <= 0 || (daysUntilTarget === 0 && nextExecution <= now)) {
          daysUntilTarget += 7;
        }
        nextExecution.setDate(nextExecution.getDate() + daysUntilTarget);
        break;
      case 'monthly':
        nextExecution.setDate(formValue.dayOfMonth);
        if (nextExecution <= now) {
          nextExecution.setMonth(nextExecution.getMonth() + 1);
        }
        break;
      case 'quarterly':
        nextExecution.setDate(formValue.dayOfMonth);
        const currentQuarter = Math.floor(nextExecution.getMonth() / 3);
        const nextQuarterStart = (currentQuarter + 1) * 3;
        nextExecution.setMonth(nextQuarterStart, formValue.dayOfMonth);
        if (nextExecution <= now) {
          nextExecution.setMonth(nextExecution.getMonth() + 3);
        }
        break;
      case 'yearly':
        nextExecution.setMonth(0, formValue.dayOfMonth); // January
        if (nextExecution <= now) {
          nextExecution.setFullYear(nextExecution.getFullYear() + 1);
        }
        break;
    }

    return nextExecution.toISOString();
  }

  private calculateNextExecutionForReport(report: ScheduledReport): string {
    // Similar logic but using report's schedule
    const schedule = report.schedule;
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);

    let nextExecution = new Date();
    nextExecution.setHours(hours, minutes, 0, 0);

    switch (schedule.frequency) {
      case 'daily':
        if (nextExecution <= now) {
          nextExecution.setDate(nextExecution.getDate() + 1);
        }
        break;
      case 'weekly':
        const targetDay = schedule.dayOfWeek!;
        const currentDay = nextExecution.getDay();
        let daysUntilTarget = targetDay - currentDay;
        if (daysUntilTarget <= 0 || (daysUntilTarget === 0 && nextExecution <= now)) {
          daysUntilTarget += 7;
        }
        nextExecution.setDate(nextExecution.getDate() + daysUntilTarget);
        break;
      case 'monthly':
        nextExecution.setDate(schedule.dayOfMonth!);
        if (nextExecution <= now) {
          nextExecution.setMonth(nextExecution.getMonth() + 1);
        }
        break;
      // Add other frequency cases as needed
    }

    return nextExecution.toISOString();
  }

  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      active: 'نشط',
      paused: 'متوقف',
      disabled: 'معطل',
      error: 'خطأ'
    };
    return statusLabels[status] || status;
  }

  getStatusIcon(status: string): string {
    const statusIcons: { [key: string]: string } = {
      active: 'play_circle',
      paused: 'pause_circle',
      disabled: 'stop_circle',
      error: 'error_outline'
    };
    return statusIcons[status] || 'help';
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getFrequencyLabel(frequency: string): string {
    const labels: { [key: string]: string } = {
      daily: 'يومياً',
      weekly: 'أسبوعياً',
      monthly: 'شهرياً',
      quarterly: 'ربع سنوي',
      yearly: 'سنوياً'
    };
    return labels[frequency] || frequency;
  }

  getExecutionStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      running: 'hourglass_empty',
      completed: 'check_circle',
      failed: 'error',
      cancelled: 'cancel'
    };
    return icons[status] || 'help';
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

  formatDateTime(dateString: string): string {
    if (!dateString) return '-';

    const date = new Date(dateString);
    return date.toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';

    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  }

  formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date(0, 0, 0, hours, minutes);
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  getReportName(execution: ExecutionResult): string {
    const report = this.scheduledReports().find(r => r.id === execution.scheduledReportId);
    return report?.name || 'تقرير غير معروف';
  }

  getReportTypeIcon(type: ReportType): string {
    const typeIcons: { [key: string]: string } = {
      'FINANCIAL': 'attach_money',
      'OPERATIONAL': 'business',
      'PATIENT': 'people',
      'CUSTOM': 'build'
    };
    return typeIcons[type] || 'description';
  }

}
