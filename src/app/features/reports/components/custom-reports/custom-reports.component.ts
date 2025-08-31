// ===================================================================
// src/app/features/reports/components/custom-reports/custom-reports.component.ts
// ===================================================================
import { Component, inject, signal, OnInit, computed } from '@angular/core';
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
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { ChartWidgetComponent } from '../chart-widgets/chart-widget.component';

// Services & Models
import { ReportService } from '../../services/report.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  ReportType,
  ExportFormat,
  ChartType,
  ReportFilter,
  ReportConfig,
  FilterType,
  ChartData
} from '../../models/report.model';

interface CustomReportField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  category: 'patient' | 'appointment' | 'financial' | 'medical';
  options?: { value: string; label: string }[];
  required?: boolean;
}

interface CustomReportTemplate {
  id: string;
  name: string;
  description: string;
  category: ReportType;
  fields: string[];
  filters: FilterType[];
  chartTypes: ChartType[];
  isDefault: boolean;
}

@Component({
  selector: 'app-custom-reports',
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
    MatCheckboxModule,
    MatSlideToggleModule,
    MatStepperModule,
    MatDividerModule,
    MatExpansionModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule,
    MatDialogModule,
    HeaderComponent,
    SidebarComponent,
    ChartWidgetComponent
  ],
  templateUrl: './custom-reports.component.html',
  styleUrl: './custom-reports.component.scss'
})
export class CustomReportsComponent implements OnInit {
  // Services
  private reportService = inject(ReportService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  // Signals
  selectedTemplate = signal<CustomReportTemplate | null>(null);
  selectedFields = signal<string[]>([]);
  generating = signal(false);
  generatedReportData = signal<ChartData[]>([]);
  currentUser = this.authService.currentUser;

  // Forms
  reportForm!: FormGroup;
  basicConfigGroup!: FormGroup;
  fieldsGroup!: FormGroup;
  chartsGroup!: FormGroup;

  // Preview data for chart demonstration
  previewData = computed(() => {
    // Generate sample data for preview
    return [
      { name: 'يناير', value: 850 },
      { name: 'فبراير', value: 920 },
      { name: 'مارس', value: 1150 },
      { name: 'أبريل', value: 980 },
      { name: 'مايو', value: 1320 }
    ];
  });

  // Available fields for custom reports
  availableFields: CustomReportField[] = [
    // Patient fields
    { key: 'patient_name', label: 'اسم المريض', type: 'text', category: 'patient' },
    { key: 'patient_age', label: 'عمر المريض', type: 'number', category: 'patient' },
    {
      key: 'patient_gender', label: 'جنس المريض', type: 'select', category: 'patient', options: [
        { value: 'MALE', label: 'ذكر' },
        { value: 'FEMALE', label: 'أنثى' }
      ]
    },
    { key: 'patient_phone', label: 'رقم الهاتف', type: 'text', category: 'patient' },
    { key: 'patient_city', label: 'المدينة', type: 'text', category: 'patient' },
    { key: 'blood_type', label: 'فصيلة الدم', type: 'select', category: 'patient' },

    // Appointment fields
    { key: 'appointment_date', label: 'تاريخ الموعد', type: 'date', category: 'appointment' },
    { key: 'appointment_type', label: 'نوع الموعد', type: 'select', category: 'appointment' },
    { key: 'appointment_status', label: 'حالة الموعد', type: 'select', category: 'appointment' },
    { key: 'doctor_name', label: 'اسم الطبيب', type: 'text', category: 'appointment' },
    { key: 'appointment_duration', label: 'مدة الموعد', type: 'number', category: 'appointment' },

    // Financial fields
    { key: 'invoice_amount', label: 'قيمة الفاتورة', type: 'number', category: 'financial', required: true },
    { key: 'payment_status', label: 'حالة الدفع', type: 'select', category: 'financial' },
    { key: 'payment_method', label: 'طريقة الدفع', type: 'select', category: 'financial' },
    { key: 'service_category', label: 'فئة الخدمة', type: 'select', category: 'financial' },
    { key: 'discount_amount', label: 'قيمة الخصم', type: 'number', category: 'financial' },

    // Medical fields
    { key: 'diagnosis', label: 'التشخيص', type: 'text', category: 'medical' },
    { key: 'treatment_plan', label: 'خطة العلاج', type: 'text', category: 'medical' },
    { key: 'visit_type', label: 'نوع الزيارة', type: 'select', category: 'medical' },
    { key: 'vital_signs', label: 'العلامات الحيوية', type: 'text', category: 'medical' },
    { key: 'medication_prescribed', label: 'الأدوية الموصوفة', type: 'text', category: 'medical' }
  ];

  // Report templates
  reportTemplates: CustomReportTemplate[] = [
    {
      id: 'patient-demographics',
      name: 'التركيبة السكانية للمرضى',
      description: 'تحليل خصائص المرضى حسب العمر والجنس والمنطقة',
      category: ReportType.PATIENT,
      fields: ['patient_age', 'patient_gender', 'patient_city', 'blood_type'],
      filters: [FilterType.DATE_RANGE],
      chartTypes: [ChartType.PIE, ChartType.BAR],
      isDefault: true
    },
    {
      id: 'financial-summary',
      name: 'الملخص المالي',
      description: 'تحليل الإيرادات والمدفوعات حسب الفترة',
      category: ReportType.FINANCIAL,
      fields: ['invoice_amount', 'payment_status', 'payment_method', 'service_category'],
      filters: [FilterType.DATE_RANGE, FilterType.STATUS],
      chartTypes: [ChartType.LINE, ChartType.BAR, ChartType.PIE],
      isDefault: true
    },
    {
      id: 'appointment-efficiency',
      name: 'كفاءة المواعيد',
      description: 'تحليل أداء المواعيد والحضور والإلغاء',
      category: ReportType.OPERATIONAL,
      fields: ['appointment_date', 'appointment_status', 'doctor_name', 'appointment_type'],
      filters: [FilterType.DATE_RANGE, FilterType.DOCTOR],
      chartTypes: [ChartType.LINE, ChartType.BAR],
      isDefault: true
    },
    {
      id: 'medical-conditions',
      name: 'الحالات الطبية الشائعة',
      description: 'تحليل التشخيصات والعلاجات الأكثر شيوعاً',
      category: ReportType.PATIENT,
      fields: ['diagnosis', 'treatment_plan', 'visit_type', 'patient_age'],
      filters: [FilterType.DATE_RANGE],
      chartTypes: [ChartType.BAR, ChartType.PIE],
      isDefault: true
    }
  ];

  ngOnInit(): void {
    this.initializeForms();
  }

  private initializeForms(): void {
    const defaultRange = this.reportService.getDefaultDateRange();

    this.basicConfigGroup = this.fb.group({
      reportName: ['', Validators.required],
      reportDescription: [''],
      reportType: [ReportType.CUSTOM, Validators.required],
      startDate: [defaultRange.startDate, Validators.required],
      endDate: [defaultRange.endDate, Validators.required]
    });

    this.fieldsGroup = this.fb.group({
      selectedFields: this.fb.array([])
    });

    this.chartsGroup = this.fb.group({
      includeCharts: [true],
      primaryChartType: [ChartType.BAR],
      showLegend: [true],
      showDataLabels: [false],
      enableInteractivity: [true],
      colorScheme: ['cool']
    });

    this.reportForm = this.fb.group({
      basicConfig: this.basicConfigGroup,
      fields: this.fieldsGroup,
      charts: this.chartsGroup
    });
  }

  // ===================================================================
  // TEMPLATE METHODS
  // ===================================================================
  onSelectTemplate(template: CustomReportTemplate): void {
    this.selectedTemplate.set(template);

    // Auto-fill form with template data
    this.basicConfigGroup.patchValue({
      reportName: template.name,
      reportDescription: template.description,
      reportType: template.category
    });

    // Select template fields
    this.selectedFields.set([...template.fields]);

    // Configure charts
    if (template.chartTypes.length > 0) {
      this.chartsGroup.patchValue({
        includeCharts: true,
        primaryChartType: template.chartTypes[0]
      });
    }
  }

  // ===================================================================
  // FIELD SELECTION METHODS
  // ===================================================================
  getFieldsByCategory(category: string): CustomReportField[] {
    return this.availableFields.filter(field => field.category === category);
  }

  isFieldSelected(fieldKey: string): boolean {
    return this.selectedFields().includes(fieldKey);
  }

  onFieldToggle(field: CustomReportField, selected: boolean): void {
    const currentFields = [...this.selectedFields()];

    if (selected) {
      currentFields.push(field.key);
    } else {
      const index = currentFields.indexOf(field.key);
      if (index > -1) {
        currentFields.splice(index, 1);
      }
    }

    this.selectedFields.set(currentFields);
  }

  onRemoveField(fieldKey: string): void {
    const currentFields = this.selectedFields().filter(key => key !== fieldKey);
    this.selectedFields.set(currentFields);
  }

  getFieldLabel(fieldKey: string): string {
    const field = this.availableFields.find(f => f.key === fieldKey);
    return field?.label || fieldKey;
  }

  // ===================================================================
  // REPORT GENERATION
  // ===================================================================
  onGenerateReport(action: 'view' | 'pdf' | 'excel' | 'csv'): void {
    if (!this.reportForm.valid || this.selectedFields().length === 0) {
      this.notificationService.warning('يرجى إكمال جميع الحقول المطلوبة');
      return;
    }

    this.generating.set(true);

    const reportConfig = this.buildReportConfig();

    // Simulate report generation
    setTimeout(() => {
      if (action === 'view') {
        // Generate sample data for display
        const sampleData = this.generateSampleData();
        this.generatedReportData.set(sampleData);
        this.notificationService.success('تم إنشاء التقرير بنجاح');
      } else {
        // Export report
        this.exportReport(action as ExportFormat);
      }

      this.generating.set(false);
    }, 2000);
  }

  private buildReportConfig(): any {
    return {
      name: this.basicConfigGroup.get('reportName')?.value,
      description: this.basicConfigGroup.get('reportDescription')?.value,
      type: this.basicConfigGroup.get('reportType')?.value,
      dateRange: {
        startDate: this.basicConfigGroup.get('startDate')?.value,
        endDate: this.basicConfigGroup.get('endDate')?.value
      },
      fields: this.selectedFields(),
      includeCharts: this.chartsGroup.get('includeCharts')?.value,
      chartConfig: this.chartsGroup.value,
      clinicId: this.currentUser()?.clinicId
    };
  }

  private generateSampleData(): ChartData[] {
    // Generate mock data based on selected fields
    const data: ChartData[] = [];
    const categories = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'];

    categories.forEach(category => {
      data.push({
        name: category,
        value: Math.floor(Math.random() * 1000) + 100
      });
    });

    return data;
  }

  private exportReport(format: ExportFormat): void {
    const filters: ReportFilter = {
      dateRange: {
        startDate: this.basicConfigGroup.get('startDate')?.value,
        endDate: this.basicConfigGroup.get('endDate')?.value
      },
      clinicId: this.currentUser()?.clinicId
    };

    this.reportService.exportReport(ReportType.CUSTOM, filters, format).subscribe({
      next: (blob) => {
        const filename = `custom_report_${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;
        this.downloadFile(blob, filename);
        this.notificationService.success('تم تصدير التقرير بنجاح');
      },
      error: (error) => {
        console.error('Export error:', error);
        this.notificationService.error('حدث خطأ في تصدير التقرير');
      }
    });
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================
  onSaveTemplate(): void {
    if (!this.reportForm.valid) {
      this.notificationService.warning('يرجى إكمال جميع الحقول المطلوبة');
      return;
    }

    const templateData = {
      name: this.basicConfigGroup.get('reportName')?.value,
      description: this.basicConfigGroup.get('reportDescription')?.value,
      fields: this.selectedFields(),
      chartConfig: this.chartsGroup.value
    };

    // Save template logic would go here
    this.notificationService.success('تم حفظ القالب بنجاح');
  }

  onResetForm(): void {
    this.reportForm.reset();
    this.selectedFields.set([]);
    this.selectedTemplate.set(null);
    this.generatedReportData.set([]);
    this.initializeForms();
  }

  getTemplateIcon(category: ReportType): string {
    switch (category) {
      case ReportType.FINANCIAL: return 'monetization_on';
      case ReportType.OPERATIONAL: return 'event_note';
      case ReportType.PATIENT: return 'people';
      default: return 'description';
    }
  }

  getChartTypeLabel(chartType: string): string {
    const labels: { [key: string]: string } = {
      'bar': 'أعمدة',
      'line': 'خط',
      'pie': 'دائري',
      'area': 'مساحة'
    };
    return labels[chartType] || chartType;
  }

  getReportTypeLabel(reportType: string): string {
    const labels: { [key: string]: string } = {
      'FINANCIAL': 'مالي',
      'OPERATIONAL': 'عملياتي',
      'PATIENT': 'المرضى',
      'CUSTOM': 'مخصص'
    };
    return labels[reportType] || reportType;
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('ar-SA');
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('ar-SA').format(num);
  }

  getTotalValue(): number {
    return this.generatedReportData().reduce((sum, item) => sum + item.value, 0);
  }

  getAverageValue(): number {
    const data = this.generatedReportData();
    return data.length > 0 ? this.getTotalValue() / data.length : 0;
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
