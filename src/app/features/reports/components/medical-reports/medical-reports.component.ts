// ===================================================================
// src/app/features/reports/components/medical-reports/medical-reports.component.ts
// ===================================================================
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
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
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { ChartWidgetComponent } from '../chart-widgets/chart-widget.component';

// Services & Models
import { ReportService } from '../../services/report.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  PopularDiagnoses,
  ReportFilter,
  ExportFormat,
  ReportType,
  ChartData
} from '../../models/report.model';

interface MedicalStatistics {
  totalRecords: number;
  totalDiagnoses: number;
  totalPrescriptions: number;
  totalLabTests: number;
  averageVisitDuration: number;
  commonSymptoms: SymptomStat[];
  prescriptionTrends: PrescriptionTrend[];
  labTestResults: LabTestStat[];
}

interface SymptomStat {
  symptom: string;
  count: number;
  percentage: number;
  associatedDiagnoses: string[];
}

interface PrescriptionTrend {
  medication: string;
  count: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  mostCommonDose: string;
  averageDuration: number;
}

interface LabTestStat {
  testName: string;
  count: number;
  normalResults: number;
  abnormalResults: number;
  averageCost: number;
}

interface TreatmentOutcome {
  diagnosis: string;
  totalCases: number;
  successfulTreatments: number;
  averageTreatmentDays: number;
  successRate: number;
  commonTreatments: string[];
}

@Component({
  selector: 'app-medical-reports',
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
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatExpansionModule,
    MatListModule,
    HeaderComponent,
    SidebarComponent,
    ChartWidgetComponent
  ],
  templateUrl: './medical-reports.component.html',
  styleUrl: './medical-reports.component.scss'
})
export class MedicalReportsComponent implements OnInit {
  // Services
  private reportService = inject(ReportService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // Signals
  medicalStats = signal<MedicalStatistics | null>(null);
  diagnoses = signal<PopularDiagnoses[]>([]);
  prescriptionTrends = signal<PrescriptionTrend[]>([]);
  labTestStats = signal<LabTestStat[]>([]);
  treatmentOutcomes = signal<TreatmentOutcome[]>([]);
  loading = signal(false);
  selectedTab = signal(0);
  currentUser = this.authService.currentUser;

  // Form
  filterForm!: FormGroup;

  // Mock doctors list
  doctorsList = [
    { id: 1, name: 'د. أحمد محمد' },
    { id: 2, name: 'د. فاطمة علي' },
    { id: 3, name: 'د. محمد سالم' }
  ];

  // Chart data computed from medical data
  diagnosesChartData = computed(() => {
    return this.diagnoses().slice(0, 10).map(diagnosis => ({
      name: diagnosis.diagnosis,
      value: diagnosis.count
    }));
  });

  prescriptionChartData = computed(() => {
    return this.prescriptionTrends().slice(0, 10).map(prescription => ({
      name: prescription.medication,
      value: prescription.count
    }));
  });

  labTestsChartData = computed(() => {
    return this.labTestStats().slice(0, 8).map(test => ({
      name: test.testName,
      value: test.count
    }));
  });

  treatmentSuccessChartData = computed(() => {
    return this.treatmentOutcomes().slice(0, 8).map(outcome => ({
      name: outcome.diagnosis,
      value: outcome.successRate
    }));
  });

  ngOnInit(): void {
    this.initializeForm();
    this.loadMedicalData();
  }

  private initializeForm(): void {
    const defaultRange = this.reportService.getDefaultDateRange();

    this.filterForm = this.fb.group({
      startDate: [defaultRange.startDate],
      endDate: [defaultRange.endDate],
      doctorId: [''],
      diagnosisCategory: ['']
    });
  }

  private loadMedicalData(): void {
    this.loading.set(true);

    const filters: ReportFilter = {
      dateRange: {
        startDate: this.filterForm.get('startDate')?.value,
        endDate: this.filterForm.get('endDate')?.value
      },
      clinicId: this.currentUser()?.clinicId,
      doctorId: this.filterForm.get('doctorId')?.value || undefined
    };

    // Load medical data (combining real and mock data)
    Promise.all([
      this.reportService.getPopularDiagnoses(filters).toPromise(),
      this.generateMockMedicalStats(),
      this.generateMockPrescriptionTrends(),
      this.generateMockLabTestStats(),
      this.generateMockTreatmentOutcomes()
    ]).then(([diagnoses, stats, prescriptions, labTests, outcomes]) => {
      this.diagnoses.set(diagnoses!);
      this.medicalStats.set(stats);
      this.prescriptionTrends.set(prescriptions);
      this.labTestStats.set(labTests);
      this.treatmentOutcomes.set(outcomes);
      this.loading.set(false);
    }).catch(error => {
      console.error('Error loading medical data:', error);
      this.notificationService.error('حدث خطأ في تحميل البيانات الطبية');
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
    this.loadMedicalData();
  }

  onResetFilters(): void {
    const defaultRange = this.reportService.getDefaultDateRange();
    this.filterForm.patchValue({
      startDate: defaultRange.startDate,
      endDate: defaultRange.endDate,
      doctorId: '',
      diagnosisCategory: ''
    });
  }

  onRefreshData(): void {
    this.loadMedicalData();
  }

  onExportReport(format: ExportFormat): void {
    const filters: ReportFilter = {
      dateRange: {
        startDate: this.filterForm.get('startDate')?.value,
        endDate: this.filterForm.get('endDate')?.value
      },
      clinicId: this.currentUser()?.clinicId
    };

    this.reportService.exportReport(ReportType.PATIENT, filters, format).subscribe({
      next: (blob) => {
        const filename = `medical_report_${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;
        this.downloadFile(blob, filename);
        this.notificationService.success('تم تصدير التقرير بنجاح');
      },
      error: (error) => {
        console.error('Export error:', error);
        this.notificationService.error('حدث خطأ في تصدير التقرير');
      }
    });
  }

  onViewDiagnosisDetails(diagnosis: PopularDiagnoses): void {
    this.notificationService.info(`عرض تفاصيل ${diagnosis.diagnosis}`);
  }

  onViewTreatmentProtocol(diagnosis: PopularDiagnoses): void {
    this.notificationService.info(`عرض بروتوكول علاج ${diagnosis.diagnosis}`);
  }

  onGenerateDiagnosisReport(diagnosis: PopularDiagnoses): void {
    this.notificationService.info(`إنشاء تقرير مفصل لـ ${diagnosis.diagnosis}`);
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

  getDiagnosisCategory(diagnosis: string): string {
    // Simple categorization logic
    if (diagnosis.includes('برد') || diagnosis.includes('حلق')) return 'تنفسي';
    if (diagnosis.includes('صداع') || diagnosis.includes('دوار')) return 'عصبي';
    if (diagnosis.includes('ظهر') || diagnosis.includes('مفصل')) return 'عضلي';
    if (diagnosis.includes('حساسية')) return 'مناعي';
    return 'عام';
  }

  getSuccessRate(diagnosis: PopularDiagnoses): number {
    // Mock success rate calculation
    return Math.random() * 30 + 70; // 70-100%
  }

  getSuccessRateColor(rate: number): 'primary' | 'accent' | 'warn' {
    if (rate >= 85) return 'primary';
    if (rate >= 70) return 'accent';
    return 'warn';
  }

  getTotalLabTests(): number {
    return this.labTestStats().reduce((sum, test) => sum + test.count, 0);
  }

  getNormalResultsRate(): number {
    const tests = this.labTestStats();
    const totalTests = tests.reduce((sum, test) => sum + test.count, 0);
    const normalResults = tests.reduce((sum, test) => sum + test.normalResults, 0);
    return totalTests > 0 ? (normalResults / totalTests) * 100 : 0;
  }

  getAbnormalResultsRate(): number {
    return 100 - this.getNormalResultsRate();
  }

  getTrendColor(trend: string): 'primary' | 'accent' | 'warn' {
    switch (trend) {
      case 'increasing': return 'primary';
      case 'stable': return 'accent';
      case 'decreasing': return 'warn';
      default: return 'primary';
    }
  }

  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'increasing': return 'trending_up';
      case 'decreasing': return 'trending_down';
      default: return 'trending_flat';
    }
  }

  getTrendLabel(trend: string): string {
    switch (trend) {
      case 'increasing': return 'متزايد';
      case 'decreasing': return 'متناقص';
      default: return 'مستقر';
    }
  }

  getOverallSuccessRate(): number {
    const outcomes = this.treatmentOutcomes();
    return outcomes.length > 0
      ? outcomes.reduce((sum, outcome) => sum + outcome.successRate, 0) / outcomes.length
      : 0;
  }

  getAverageTreatmentDuration(): number {
    const outcomes = this.treatmentOutcomes();
    return outcomes.length > 0
      ? outcomes.reduce((sum, outcome) => sum + outcome.averageTreatmentDays, 0) / outcomes.length
      : 0;
  }

  getAverageTreatmentCost(): number {
    // Mock calculation
    return 850;
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
  // MOCK DATA GENERATORS
  // ===================================================================
  private generateMockMedicalStats(): Promise<MedicalStatistics> {
    const stats: MedicalStatistics = {
      totalRecords: 2847,
      totalDiagnoses: 156,
      totalPrescriptions: 1923,
      totalLabTests: 1456,
      averageVisitDuration: 35,
      commonSymptoms: [
        { symptom: 'صداع', count: 234, percentage: 15.2, associatedDiagnoses: ['صداع نصفي', 'توتر'] },
        { symptom: 'سعال', count: 198, percentage: 12.8, associatedDiagnoses: ['نزلة برد', 'التهاب الحلق'] },
        { symptom: 'حمى', count: 156, percentage: 10.1, associatedDiagnoses: ['عدوى فيروسية', 'التهاب'] }
      ],
      prescriptionTrends: [],
      labTestResults: []
    };
    return Promise.resolve(stats);
  }

  private generateMockPrescriptionTrends(): Promise<PrescriptionTrend[]> {
    const trends: PrescriptionTrend[] = [
      { medication: 'باراسيتامول', count: 234, trend: 'stable', mostCommonDose: '500mg', averageDuration: 5 },
      { medication: 'أموكسيسيلين', count: 189, trend: 'increasing', mostCommonDose: '250mg', averageDuration: 7 },
      { medication: 'إيبوبروفين', count: 156, trend: 'decreasing', mostCommonDose: '400mg', averageDuration: 3 },
      { medication: 'سيتيريزين', count: 134, trend: 'stable', mostCommonDose: '10mg', averageDuration: 10 },
      { medication: 'أوميبرازول', count: 98, trend: 'increasing', mostCommonDose: '20mg', averageDuration: 14 }
    ];
    return Promise.resolve(trends);
  }

  private generateMockLabTestStats(): Promise<LabTestStat[]> {
    const stats: LabTestStat[] = [
      { testName: 'تحليل دم شامل', count: 345, normalResults: 298, abnormalResults: 47, averageCost: 120 },
      { testName: 'تحليل سكر', count: 267, normalResults: 201, abnormalResults: 66, averageCost: 45 },
      { testName: 'وظائف الكلى', count: 198, normalResults: 176, abnormalResults: 22, averageCost: 180 },
      { testName: 'وظائف الكبد', count: 156, normalResults: 142, abnormalResults: 14, averageCost: 200 },
      { testName: 'فيتامين د', count: 134, normalResults: 89, abnormalResults: 45, averageCost: 150 },
      { testName: 'الغدة الدرقية', count: 98, normalResults: 82, abnormalResults: 16, averageCost: 220 }
    ];
    return Promise.resolve(stats);
  }

  private generateMockTreatmentOutcomes(): Promise<TreatmentOutcome[]> {
    const outcomes: TreatmentOutcome[] = [
      {
        diagnosis: 'نزلة برد',
        totalCases: 89,
        successfulTreatments: 84,
        averageTreatmentDays: 7,
        successRate: 94.4,
        commonTreatments: ['مسكنات', 'مضادات احتقان', 'راحة']
      },
      {
        diagnosis: 'التهاب الحلق',
        totalCases: 67,
        successfulTreatments: 61,
        averageTreatmentDays: 5,
        successRate: 91.0,
        commonTreatments: ['مضادات حيوية', 'مسكنات', 'غرغرة']
      },
      {
        diagnosis: 'حساسية',
        totalCases: 54,
        successfulTreatments: 47,
        averageTreatmentDays: 10,
        successRate: 87.0,
        commonTreatments: ['مضادات هيستامين', 'كورتيزون موضعي']
      },
      {
        diagnosis: 'آلام الظهر',
        totalCases: 43,
        successfulTreatments: 35,
        averageTreatmentDays: 14,
        successRate: 81.4,
        commonTreatments: ['مسكنات', 'علاج طبيعي', 'مرخيات عضلات']
      }
    ];
    return Promise.resolve(outcomes);
  }
}
