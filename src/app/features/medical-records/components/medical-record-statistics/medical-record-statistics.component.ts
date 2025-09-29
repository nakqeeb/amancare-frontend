// ===================================================================
// src/app/features/medical-records/components/medical-record-statistics/medical-record-statistics.component.ts
// Medical Record Statistics Component - Dashboard for medical records analytics
// ===================================================================

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';

import { MedicalRecordService } from '../../services/medical-record.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

import {
  MedicalRecordStatistics,
  DiagnosisFrequency,
  MedicationFrequency,
  VisitType
} from '../../models/medical-record.model';

// Chart.js types
interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

@Component({
  selector: 'app-medical-record-statistics',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule,
    MatTabsModule
  ],
  templateUrl: './medical-record-statistics.component.html',
  styleUrl: './medical-record-statistics.component.scss'
})
export class MedicalRecordStatisticsComponent implements OnInit {
  private medicalRecordService = inject(MedicalRecordService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  // State
  loading = signal(false);
  statistics = signal<MedicalRecordStatistics | null>(null);
  commonDiagnoses = signal<DiagnosisFrequency[]>([]);
  commonMedications = signal<MedicationFrequency[]>([]);

  // Filters
  selectedPeriod = 'month';
  fromDate: Date | null = null;
  toDate: Date | null = null;

  // Table columns
  diagnosisColumns = ['rank', 'diagnosis', 'count', 'percentage'];
  medicationColumns = ['rank', 'medication', 'count', 'percentage'];

  // Chart data
  visitTypes = [
    { type: 'FIRST_VISIT', label: 'زيارة أولى', count: 45, color: '#4CAF50' },
    { type: 'FOLLOW_UP', label: 'متابعة', count: 120, color: '#2196F3' },
    { type: 'EMERGENCY', label: 'طوارئ', count: 15, color: '#F44336' },
    { type: 'ROUTINE_CHECK', label: 'فحص دوري', count: 80, color: '#FF9800' },
    { type: 'CONSULTATION', label: 'استشارة', count: 35, color: '#9C27B0' }
  ];

  ngOnInit(): void {
    this.loadStatistics();
  }

  private loadStatistics(): void {
    this.loading.set(true);

    // Load actual statistics
    this.medicalRecordService.getMedicalRecordStatistics().subscribe({
      next: (stats) => {
        this.statistics.set(stats);
        this.commonDiagnoses.set(stats.commonDiagnoses || []);
        this.commonMedications.set(stats.commonMedications || []);
        this.loading.set(false);
      },
      error: (error) => {
        // Use mock data on error
        this.loadMockData();
      }
    });
  }

  private loadMockData(): void {
   const mockStats: MedicalRecordStatistics = {
  totalRecords: 1250,
  recordsByStatus: {
    COMPLETED: 1180,
    DRAFT: 45,
    IN_PROGRESS: 32,
    LOCKED: 25,
    REVIEWED: 0,
    CANCELLED: 3
  },
  recordsToday: 15,
  recordsThisWeek: 85,
  recordsThisMonth: 320,
  commonDiagnoses: [
    { diagnosis: 'ارتفاع ضغط الدم', icdCode: 'I10', count: 156, percentage: 12.5 },
    { diagnosis: 'السكري من النوع الثاني', icdCode: 'E11.9', count: 142, percentage: 11.4 },
    { diagnosis: 'التهاب الجهاز التنفسي العلوي', icdCode: 'J06.9', count: 98, percentage: 7.8 },
    { diagnosis: 'آلام أسفل الظهر', icdCode: 'M54.5', count: 87, percentage: 7.0 },
    { diagnosis: 'الصداع النصفي', icdCode: 'G43.9', count: 65, percentage: 5.2 }
  ],
  commonMedications: [
    { medicationName: 'Paracetamol', count: 234, percentage: 18.7 },
    { medicationName: 'Amoxicillin', count: 189, percentage: 15.1 },
    { medicationName: 'Metformin', count: 142, percentage: 11.4 },
    { medicationName: 'Ibuprofen', count: 126, percentage: 10.1 },
    { medicationName: 'Omeprazole', count: 98, percentage: 7.8 }
  ],
  visitTypeDistribution: {
    CONSULTATION: 35,
    FOLLOW_UP: 120,
    EMERGENCY: 15,
    ROUTINE_CHECKUP: 80,
    VACCINATION: 10,
    PROCEDURE: 0,
    SURGERY: 0,
    REHABILITATION: 0,
    PREVENTIVE_CARE: 0,
    CHRONIC_CARE: 0
  },
  confidentialRecordsCount: 25
};

    this.statistics.set(mockStats);
    this.commonDiagnoses.set(mockStats.commonDiagnoses);
    this.commonMedications.set(mockStats.commonMedications);
    this.loading.set(false);
  }

  onPeriodChange(): void {
    this.loadStatistics();
  }

  onExportReport(): void {
    this.notificationService.info('جاري تصدير التقرير...');
  }

  completionRate(): number {
    const stats = this.statistics();
    if (!stats) return 0;

    const completed = stats.recordsByStatus?.['COMPLETED'] || 0;
    const total = stats.totalRecords;

    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }
}
