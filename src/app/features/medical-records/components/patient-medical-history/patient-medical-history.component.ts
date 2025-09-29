// ===================================================================
// src/app/features/medical-records/components/patient-medical-history/patient-medical-history.component.ts
// Patient Medical History Component
// ===================================================================

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

import { MedicalRecordService } from '../../services/medical-record.service';
import { PatientService } from '../../../patients/services/patient.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

import {
  MedicalRecordSummary,
  RecordStatus,
  VisitType,
  GroupedRecords
} from '../../models/medical-record.model';
import { Patient } from '../../../patients/models/patient.model';

@Component({
  selector: 'app-patient-medical-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './patient-medical-history.component.html',
  styleUrl: './patient-medical-history.component.scss'
})
export class PatientMedicalHistoryComponent implements OnInit {
  // Services
  private medicalRecordService = inject(MedicalRecordService);
  private patientService = inject(PatientService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // State
  patient = signal<Patient | null>(null);
  medicalRecords = signal<MedicalRecordSummary[]>([]);
  filteredRecords = signal<MedicalRecordSummary[]>([]);
  loading = this.medicalRecordService.loading;
  currentUser = this.authService.currentUser;

  // Statistics
  totalVisits = signal(0);
  totalPrescriptions = signal(0);
  totalLabTests = signal(0);
  chronicConditions = signal<string[]>([]);
  allergies = signal<string[]>([]);

  // Filters
  filterVisitType = '';
  filterStatus = '';
  filterPeriod = '';
  searchTerm = '';

  // Pagination
  currentPage = 0;
  pageSize = 20;
  hasMoreRecords = signal(false);

  // Computed
  groupedRecords = computed(() => {
    const records = this.filteredRecords();
    return this.medicalRecordService.groupRecordsByDate(records);
  });

  ngOnInit(): void {
    const patientId = this.route.snapshot.paramMap.get('patientId');
    if (patientId) {
      this.loadPatientData(parseInt(patientId));
      this.loadMedicalHistory(parseInt(patientId));
    } else {
      this.router.navigate(['/medical-records']);
    }
  }

  // ===================================================================
  // DATA LOADING
  // ===================================================================

  private loadPatientData(patientId: number): void {
    this.patientService.getPatientById(patientId).subscribe({
      next: (response) => {
        this.patient.set(response.data!);
        this.extractPatientInfo(response.data!);
      },
      error: (error) => {
        this.notificationService.error('خطأ في تحميل بيانات المريض');
        this.router.navigate(['/medical-records']);
      }
    });
  }

  private loadMedicalHistory(patientId: number): void {
    this.medicalRecordService.getPatientMedicalHistory(
      patientId,
      this.currentPage,
      this.pageSize
    ).subscribe({
      next: (response) => {
        const records = response.content || [];
        if (this.currentPage === 0) {
          this.medicalRecords.set(records);
        } else {
          this.medicalRecords.update(current => [...current, ...records]);
        }
        this.filteredRecords.set(this.medicalRecords());
        this.hasMoreRecords.set(!response.last);

        // Calculate statistics
        this.calculateStatistics();
      }
    });
  }

  private extractPatientInfo(patient: Patient): void {
    // Extract chronic conditions
    if (patient.chronicDiseases) {
      this.chronicConditions.set(
        patient.chronicDiseases.split(',').map(c => c.trim()).filter(c => c)
      );
    }

    // Extract allergies
    if (patient.allergies) {
      this.allergies.set(
        patient.allergies.split(',').map(a => a.trim()).filter(a => a)
      );
    }
  }

  private calculateStatistics(): void {
    const records = this.medicalRecords();

    this.totalVisits.set(records.length);

    // These would need additional data from the full records
    // For now, using placeholder calculations
    this.totalPrescriptions.set(
      records.filter(r => r.status === RecordStatus.COMPLETED).length * 2
    );

    this.totalLabTests.set(
      records.filter(r =>
        r.visitType === VisitType.ROUTINE_CHECKUP ||
        r.visitType === VisitType.CONSULTATION
      ).length
    );
  }

  // ===================================================================
  // FILTERS
  // ===================================================================

  applyFilters(): void {
    let filtered = [...this.medicalRecords()];

    // Filter by visit type
    if (this.filterVisitType) {
      filtered = filtered.filter(r => r.visitType === this.filterVisitType);
    }

    // Filter by status
    if (this.filterStatus) {
      filtered = filtered.filter(r => r.status === this.filterStatus);
    }

    // Filter by period
    if (this.filterPeriod) {
      const now = new Date();
      let cutoffDate: Date;

      switch (this.filterPeriod) {
        case 'last_month':
          cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'last_3_months':
          cutoffDate = new Date(now.setMonth(now.getMonth() - 3));
          break;
        case 'last_6_months':
          cutoffDate = new Date(now.setMonth(now.getMonth() - 6));
          break;
        case 'last_year':
          cutoffDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          cutoffDate = new Date(0);
      }

      filtered = filtered.filter(r =>
        new Date(r.visitDate) >= cutoffDate
      );
    }

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.chiefComplaint.toLowerCase().includes(term) ||
        (r.primaryDiagnosis && r.primaryDiagnosis.toLowerCase().includes(term)) ||
        r.doctorName.toLowerCase().includes(term)
      );
    }

    this.filteredRecords.set(filtered);
  }

  // ===================================================================
  // ACTIONS
  // ===================================================================

  onBack(): void {
    this.router.navigate(['/patients', this.patient()?.id]);
  }

  onRefresh(): void {
    if (this.patient()) {
      this.currentPage = 0;
      this.loadMedicalHistory(this.patient()!.id);
    }
  }

  onAddNewRecord(): void {
    if (this.patient()) {
      this.router.navigate(['/medical-records', 'new'], {
        queryParams: { patientId: this.patient()!.id }
      });
    }
  }

  onViewRecord(record: MedicalRecordSummary): void {
    this.router.navigate(['/medical-records', record.id]);
  }

  onEditRecord(record: MedicalRecordSummary): void {
    this.router.navigate(['/medical-records', record.id, 'edit']);
  }

  onPrintRecord(record: MedicalRecordSummary): void {
    this.medicalRecordService.exportMedicalRecordAsPdf(record.id).subscribe({
      next: (blob) => {
        const filename = `medical-record-${record.id}.pdf`;
        this.medicalRecordService.downloadPdf(blob, filename);
      }
    });
  }

  onExportHistory(): void {
    this.notificationService.info('جاري تصدير التاريخ المرضي...');
    // Implementation would generate a comprehensive PDF report
  }

  loadMore(): void {
    if (this.patient() && this.hasMoreRecords()) {
      this.currentPage++;
      this.loadMedicalHistory(this.patient()!.id);
    }
  }

  // ===================================================================
  // PERMISSIONS
  // ===================================================================

  canEdit(record: MedicalRecordSummary): boolean {
    const user = this.currentUser();
    if (!user) return false;

    if (record.status === RecordStatus.LOCKED) {
      return user.role === 'ADMIN' || user.role === 'SYSTEM_ADMIN';
    }

    return user.role === 'DOCTOR' || user.role === 'ADMIN' || user.role === 'SYSTEM_ADMIN';
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================

  getPatientAge(): number {
    const patient = this.patient();
    if (!patient?.dateOfBirth) return 0;

    const today = new Date();
    const birthDate = new Date(patient.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  getYearTotalRecords(yearGroup: GroupedRecords): number {
    return yearGroup.months.reduce(
      (total, month) => total + month.records.length,
      0
    );
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getVisitTypeLabel(type: VisitType): string {
    const labels: Record<VisitType, string> = {
      [VisitType.CONSULTATION]: 'استشارة',
      [VisitType.FOLLOW_UP]: 'متابعة',
      [VisitType.EMERGENCY]: 'طوارئ',
      [VisitType.ROUTINE_CHECKUP]: 'فحص دوري',
      [VisitType.VACCINATION]: 'تطعيم',
      [VisitType.PROCEDURE]: 'إجراء طبي',
      [VisitType.SURGERY]: 'عملية جراحية',
      [VisitType.REHABILITATION]: 'تأهيل',
      [VisitType.PREVENTIVE_CARE]: 'رعاية وقائية',
      [VisitType.CHRONIC_CARE]: 'رعاية مزمنة'
    };
    return labels[type] || type;
  }

  getStatusLabel(status: RecordStatus): string {
    const labels: Record<RecordStatus, string> = {
      [RecordStatus.DRAFT]: 'مسودة',
      [RecordStatus.IN_PROGRESS]: 'قيد التحرير',
      [RecordStatus.COMPLETED]: 'مكتمل',
      [RecordStatus.REVIEWED]: 'مراجع',
      [RecordStatus.LOCKED]: 'مقفل',
      [RecordStatus.CANCELLED]: 'ملغي'
    };
    return labels[status] || status;
  }

  getStatusClass(status: RecordStatus): string {
    const classes: Record<RecordStatus, string> = {
      [RecordStatus.DRAFT]: 'draft',
      [RecordStatus.IN_PROGRESS]: 'progress',
      [RecordStatus.COMPLETED]: 'completed',
      [RecordStatus.REVIEWED]: 'reviewed',
      [RecordStatus.LOCKED]: 'locked',
      [RecordStatus.CANCELLED]: 'cancelled'
    };
    return classes[status] || '';
  }
}
