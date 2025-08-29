// ===================================================================
// 2. PATIENT MEDICAL HISTORY COMPONENT
// src/app/features/medical-records/components/patient-medical-history/patient-medical-history.component.ts
// ===================================================================
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// Services & Models
import { MedicalRecordService } from '../../services/medical-record.service';
import { PatientService } from '../../../patients/services/patient.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  MedicalRecord,
  RecordStatus,
  VisitType
} from '../../models/medical-record.model';
import { Patient } from '../../../patients/models/patient.model';

interface GroupedRecords {
  year: number;
  months: {
    month: string;
    records: MedicalRecord[];
  }[];
}

@Component({
  selector: 'app-patient-medical-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatExpansionModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './patient-medical-history.component.html',
  styleUrl: './patient-medical-history.component.scss'
})
export class PatientMedicalHistoryComponent implements OnInit {
  // Services
  private medicalRecordService = inject(MedicalRecordService);
  private patientService = inject(PatientService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Signals
  patient = signal<Patient | null>(null);
  medicalRecords = signal<MedicalRecord[]>([]);
  groupedRecords = signal<GroupedRecords[]>([]);
  loading = signal(false);
  selectedTab = signal(0);

  // Statistics
  totalVisits = signal(0);
  totalPrescriptions = signal(0);
  totalLabTests = signal(0);
  chronicConditions = signal<string[]>([]);
  allergies = signal<string[]>([]);

  ngOnInit(): void {
    const patientId = this.route.snapshot.paramMap.get('patientId');
    if (patientId) {
      this.loadPatientData(+patientId);
      this.loadMedicalHistory(+patientId);
    } else {
      this.router.navigate(['/medical-records']);
    }
  }

  getYearTotalRecords(yearGroup: any): number {
    return yearGroup.months.reduce((sum: number, m: any) => sum + m.records.length, 0);
  }

  getStatusClass(status: RecordStatus): string {
    const statusClasses: Record<RecordStatus, string> = {
      [RecordStatus.DRAFT]: 'status-draft',
      [RecordStatus.COMPLETED]: 'status-completed',
      [RecordStatus.REVIEWED]: 'status-reviewed',
      [RecordStatus.AMENDED]: 'status-amended',
      [RecordStatus.LOCKED]: 'status-locked'
    };
    return statusClasses[status] || '';
  }

  private loadPatientData(patientId: number): void {
    // Mock patient data - replace with actual service call
    this.patient.set({
      id: patientId,
      firstName: 'أحمد',
      lastName: 'محمد علي',
      patientNumber: 'P001',
      phone: '0501234567',
      dateOfBirth: '1985-03-15',
      gender: 'MALE',
      bloodType: 'O_POSITIVE',
      address: 'الرياض'
    });
  }

  private loadMedicalHistory(patientId: number): void {
    this.loading.set(true);
    this.medicalRecordService.getPatientMedicalHistory(patientId).subscribe({
      next: (records) => {
        this.medicalRecords.set(records);
        this.processRecords(records);
        this.calculateStatistics(records);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading medical history:', error);
        this.notificationService.error('حدث خطأ في تحميل التاريخ المرضي');
        this.loading.set(false);
      }
    });
  }

  private processRecords(records: MedicalRecord[]): void {
    // Group records by year and month
    const grouped = new Map<number, Map<string, MedicalRecord[]>>();

    records.forEach(record => {
      const date = new Date(record.visitDate);
      const year = date.getFullYear();
      const month = date.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });

      if (!grouped.has(year)) {
        grouped.set(year, new Map());
      }

      const yearMap = grouped.get(year)!;
      if (!yearMap.has(month)) {
        yearMap.set(month, []);
      }

      yearMap.get(month)!.push(record);
    });

    // Convert to array structure
    const result: GroupedRecords[] = [];
    grouped.forEach((yearMap, year) => {
      const months: { month: string; records: MedicalRecord[] }[] = [];
      yearMap.forEach((records, month) => {
        months.push({ month, records });
      });

      // Sort months in descending order
      months.sort((a, b) => {
        const dateA = new Date(a.records[0].visitDate);
        const dateB = new Date(b.records[0].visitDate);
        return dateB.getTime() - dateA.getTime();
      });

      result.push({ year, months });
    });

    // Sort years in descending order
    result.sort((a, b) => b.year - a.year);

    this.groupedRecords.set(result);
  }

  private calculateStatistics(records: MedicalRecord[]): void {
    this.totalVisits.set(records.length);

    // Count prescriptions and lab tests
    let prescriptionCount = 0;
    let labTestCount = 0;
    const allergiesSet = new Set<string>();
    const conditionsSet = new Set<string>();

    records.forEach(record => {
      if (record.prescriptions) {
        prescriptionCount += record.prescriptions.length;
      }

      if (record.labTests) {
        labTestCount += record.labTests.length;
      }

      if (record.allergies) {
        record.allergies.forEach(allergy => allergiesSet.add(allergy));
      }

      // Extract chronic conditions from diagnoses
      record.diagnosis.forEach(diagnosis => {
        if (diagnosis.isPrimary) {
          conditionsSet.add(diagnosis.description);
        }
      });
    });

    this.totalPrescriptions.set(prescriptionCount);
    this.totalLabTests.set(labTestCount);
    this.allergies.set(Array.from(allergiesSet));
    this.chronicConditions.set(Array.from(conditionsSet).slice(0, 5)); // Top 5 conditions
  }

  onViewRecord(record: MedicalRecord): void {
    this.router.navigate(['/medical-records', record.id]);
  }

  onEditRecord(record: MedicalRecord): void {
    this.router.navigate(['/medical-records', record.id, 'edit']);
  }

  onPrintRecord(record: MedicalRecord): void {
    this.medicalRecordService.exportMedicalRecord(record.id!).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `medical-record-${record.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.notificationService.success('تم تحميل السجل الطبي');
      },
      error: () => {
        this.notificationService.error('حدث خطأ في طباعة السجل');
      }
    });
  }

  onAddNewRecord(): void {
    if (this.patient()?.id) {
      this.router.navigate(['/medical-records/new'], {
        queryParams: { patientId: this.patient()!.id }
      });
    }
  }

  onExportHistory(): void {
    // Export all medical history as PDF
    this.notificationService.info('جاري تصدير التاريخ المرضي...');
  }

  // Helper methods
  getPatientAge(): number {
    if (!this.patient()?.dateOfBirth) return 0;

    const today = new Date();
    const birthDate = new Date(this.patient()!.dateOfBirth!);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  getVisitTypeLabel(type: VisitType): string {
    const labels: Record<VisitType, string> = {
      [VisitType.FIRST_VISIT]: 'زيارة أولى',
      [VisitType.FOLLOW_UP]: 'متابعة',
      [VisitType.EMERGENCY]: 'طوارئ',
      [VisitType.ROUTINE_CHECK]: 'فحص دوري',
      [VisitType.VACCINATION]: 'تطعيم',
      [VisitType.CONSULTATION]: 'استشارة'
    };
    return labels[type] || type;
  }

  getStatusLabel(status: RecordStatus): string {
    const labels: Record<RecordStatus, string> = {
      [RecordStatus.DRAFT]: 'مسودة',
      [RecordStatus.COMPLETED]: 'مكتمل',
      [RecordStatus.REVIEWED]: 'مراجع',
      [RecordStatus.AMENDED]: 'معدل',
      [RecordStatus.LOCKED]: 'مقفل'
    };
    return labels[status] || status;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getPrimaryDiagnosis(record: MedicalRecord): string {
    const primary = record.diagnosis.find(d => d.isPrimary);
    return primary ? primary.description : '-';
  }
}
