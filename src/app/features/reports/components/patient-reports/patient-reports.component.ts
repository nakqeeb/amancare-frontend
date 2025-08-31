// ===================================================================
// src/app/features/reports/components/patient-reports/patient-reports.component.ts
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

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { ChartWidgetComponent } from '../chart-widgets/chart-widget.component';

// Services & Models
import { ReportService } from '../../services/report.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  PatientDemographics,
  PopularDiagnoses,
  PatientVisitFrequency,
  ReportFilter,
  ExportFormat,
  ReportType,
  ChartData
} from '../../models/report.model';

@Component({
  selector: 'app-patient-reports',
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
    HeaderComponent,
    SidebarComponent,
    ChartWidgetComponent
  ],
  templateUrl: './patient-reports.component.html',
  styleUrl: './patient-reports.component.scss'
})
export class PatientReportsComponent implements OnInit {
  exportFormat = ExportFormat;
  // Services
  private reportService = inject(ReportService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // Signals
  demographics = signal<PatientDemographics | null>(null);
  diagnoses = signal<PopularDiagnoses[]>([]);
  visitFrequency = signal<PatientVisitFrequency[]>([]);
  loading = signal(false);
  selectedTab = signal(0);
  currentUser = this.authService.currentUser;

  // Form
  filterForm!: FormGroup;

  // Chart data computed from demographics
  ageGroupChartData = computed(() => {
    const demo = this.demographics();
    return demo ? demo.ageGroups.map(group => ({
      name: group.ageGroup,
      value: group.count
    })) : [];
  });

  genderChartData = computed(() => {
    const demo = this.demographics();
    return demo ? demo.genderDistribution.map(gender => ({
      name: gender.gender,
      value: gender.count
    })) : [];
  });

  bloodTypeChartData = computed(() => {
    const demo = this.demographics();
    return demo ? demo.bloodTypeDistribution.map(blood => ({
      name: blood.bloodType,
      value: blood.count
    })) : [];
  });

  geographicChartData = computed(() => {
    const demo = this.demographics();
    return demo ? demo.geographicDistribution.map(geo => ({
      name: geo.city,
      value: geo.count
    })) : [];
  });

  diagnosesChartData = computed(() => {
    return this.diagnoses().slice(0, 10).map(diagnosis => ({
      name: diagnosis.diagnosis,
      value: diagnosis.count
    }));
  });

  ngOnInit(): void {
    this.initializeForm();
    this.loadPatientData();
  }

  private initializeForm(): void {
    const defaultRange = this.reportService.getDefaultDateRange();

    this.filterForm = this.fb.group({
      startDate: [defaultRange.startDate],
      endDate: [defaultRange.endDate],
      ageGroup: ['all'],
      gender: ['all']
    });
  }

  private loadPatientData(): void {
    this.loading.set(true);

    const filters: ReportFilter = {
      dateRange: {
        startDate: this.filterForm.get('startDate')?.value,
        endDate: this.filterForm.get('endDate')?.value
      },
      clinicId: this.currentUser()?.clinicId
    };

    // Load all patient data
    Promise.all([
      this.reportService.getPatientDemographics(filters).toPromise(),
      this.reportService.getPopularDiagnoses(filters).toPromise(),
      this.generateMockVisitFrequency() // This would be a real service call
    ]).then(([demographics, diagnoses, visitFreq]) => {
      this.demographics.set(demographics!);
      this.diagnoses.set(diagnoses!);
      this.visitFrequency.set(visitFreq);
      this.loading.set(false);
    }).catch(error => {
      console.error('Error loading patient data:', error);
      this.notificationService.error('حدث خطأ في تحميل بيانات المرضى');
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
    this.loadPatientData();
  }

  onResetFilters(): void {
    const defaultRange = this.reportService.getDefaultDateRange();
    this.filterForm.patchValue({
      startDate: defaultRange.startDate,
      endDate: defaultRange.endDate,
      ageGroup: 'all',
      gender: 'all'
    });
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
        const filename = `patient_report_${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;
        this.downloadFile(blob, filename);
        this.notificationService.success('تم تصدير التقرير بنجاح');
      },
      error: (error) => {
        console.error('Export error:', error);
        this.notificationService.error('حدث خطأ في تصدير التقرير');
      }
    });
  }

  onViewPatientProfile(patientId: number): void {
    this.router.navigate(['/patients', patientId]);
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

  getLoyaltyRate(): number {
    const demo = this.demographics();
    if (!demo || demo.totalPatients === 0) return 0;
    return (demo.returningPatients / demo.totalPatients) * 100;
  }

  getAverageVisitInterval(): number {
    const visits = this.visitFrequency();
    if (visits.length === 0) return 0;
    const totalDays = visits.reduce((sum, patient) => sum + patient.averageDaysBetweenVisits, 0);
    return Math.round(totalDays / visits.length);
  }

  getTopPatientVisits(): number {
    const visits = this.visitFrequency();
    if (visits.length === 0) return 0;
    return Math.max(...visits.map(patient => patient.totalVisits));
  }

  getLoyaltyLevel(visits: number): string {
    if (visits >= 20) return 'ذهبي';
    if (visits >= 10) return 'فضي';
    if (visits >= 5) return 'برونزي';
    return 'عادي';
  }

  getLoyaltyClass(visits: number): string {
    if (visits >= 20) return 'loyalty-gold';
    if (visits >= 10) return 'loyalty-silver';
    if (visits >= 5) return 'loyalty-bronze';
    return 'loyalty-normal';
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // Mock data generator (would be replaced with real service call)
  private generateMockVisitFrequency(): Promise<PatientVisitFrequency[]> {
    const mockData: PatientVisitFrequency[] = [
      {
        patientId: 1001,
        patientName: 'أحمد محمد علي',
        totalVisits: 15,
        lastVisitDate: '2025-08-25',
        averageDaysBetweenVisits: 21,
        totalSpent: 12750,
        visitsByMonth: [
          { month: '2025-06', count: 2, amount: 1200 },
          { month: '2025-07', count: 4, amount: 3600 },
          { month: '2025-08', count: 3, amount: 2700 }
        ]
      },
      {
        patientId: 1002,
        patientName: 'فاطمة أحمد سالم',
        totalVisits: 8,
        lastVisitDate: '2025-08-20',
        averageDaysBetweenVisits: 35,
        totalSpent: 6400,
        visitsByMonth: [
          { month: '2025-06', count: 1, amount: 800 },
          { month: '2025-07', count: 3, amount: 2400 },
          { month: '2025-08', count: 2, amount: 1600 }
        ]
      },
      {
        patientId: 1003,
        patientName: 'عبدالله محمد',
        totalVisits: 22,
        lastVisitDate: '2025-08-28',
        averageDaysBetweenVisits: 14,
        totalSpent: 18900,
        visitsByMonth: [
          { month: '2025-06', count: 7, amount: 5600 },
          { month: '2025-07', count: 8, amount: 6800 },
          { month: '2025-08', count: 6, amount: 5100 }
        ]
      }
    ];

    return Promise.resolve(mockData);
  }
}
