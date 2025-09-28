// ===================================================================
// src/app/features/medical-records/components/medical-record-details/medical-record-details.component.ts
// Medical Record Details Component
// ===================================================================

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { MedicalRecordService } from '../../services/medical-record.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

import {
  MedicalRecord,
  RecordStatus,
  VisitType,
  DiagnosisType,
  MedicationRoute,
  TestStatus,
  UpdateRecordStatusRequest,
  ReferralPriority
} from '../../models/medical-record.model';

import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LabResultsComponent } from '../lab-results/lab-results.component';
import { RadiologyResultsComponent } from '../radiology-results/radiology-results.component';

@Component({
  selector: 'app-medical-record-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatTableModule,
    MatDialogModule,
    LabResultsComponent,
    RadiologyResultsComponent
  ],
  templateUrl: './medical-record-details.component.html',
  styleUrl: './medical-record-details.component.scss'
})
export class MedicalRecordDetailsComponent implements OnInit {
  // Services
  private medicalRecordService = inject(MedicalRecordService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);

  // State
  medicalRecord = signal<MedicalRecord | null>(null);
  loading = this.medicalRecordService.loading;
  currentUser = this.authService.currentUser;
  selectedTab = 0;

  // Table columns for prescriptions
  prescriptionColumns: string[] = [
    'medication',
    'dosage',
    'frequency',
    'duration',
    'route',
    'instructions'
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadMedicalRecord(parseInt(id));
    } else {
      this.router.navigate(['/medical-records']);
    }
  }

  // ===================================================================
  // DATA LOADING
  // ===================================================================

  private loadMedicalRecord(id: number): void {
    this.medicalRecordService.getMedicalRecordById(id).subscribe({
      next: (record) => {
        this.medicalRecord.set(record);
      },
      error: (error) => {
        this.notificationService.error('خطأ في تحميل السجل الطبي');
        this.router.navigate(['/medical-records']);
      }
    });
  }

  // ===================================================================
  // ACTIONS
  // ===================================================================

  onBack(): void {
    this.router.navigate(['/medical-records']);
  }

  onEdit(): void {
    const record = this.medicalRecord();
    if (record) {
      this.router.navigate(['/medical-records', record.id, 'edit']);
    }
  }

  onPrint(): void {
    window.print();
  }

  onExportPdf(): void {
    const record = this.medicalRecord();
    if (record?.id) {
      this.medicalRecordService.exportMedicalRecordAsPdf(record.id).subscribe({
        next: (blob) => {
          const filename = `medical-record-${record.id}-${new Date().toISOString().split('T')[0]}.pdf`;
          this.medicalRecordService.downloadPdf(blob, filename);
        }
      });
    }
  }

  onDuplicate(): void {
    const record = this.medicalRecord();
    if (record) {
      this.router.navigate(['/medical-records', 'new'], {
        queryParams: { duplicateFrom: record.id }
      });
    }
  }

  onToggleLock(): void {
    const record = this.medicalRecord();
    if (!record) return;

    const newStatus = record.status === RecordStatus.LOCKED
      ? RecordStatus.COMPLETED
      : RecordStatus.LOCKED;

    const request: UpdateRecordStatusRequest = {
      status: newStatus,
      notes: newStatus === RecordStatus.LOCKED
        ? 'تم قفل السجل الطبي'
        : 'تم إلغاء قفل السجل الطبي'
    };

    this.medicalRecordService.updateRecordStatus(record.id!, request).subscribe({
      next: (updatedRecord) => {
        this.medicalRecord.set(updatedRecord);
        this.notificationService.success(
          newStatus === RecordStatus.LOCKED
            ? 'تم قفل السجل الطبي بنجاح'
            : 'تم إلغاء قفل السجل الطبي بنجاح'
        );
      }
    });
  }

  onViewHistory(): void {
    const record = this.medicalRecord();
    if (record) {
      this.router.navigate(['/medical-records', record.id, 'history']);
    }
  }

  onDelete(): void {
    const record = this.medicalRecord();
    if (!record) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'حذف السجل الطبي',
        message: `هل أنت متأكد من حذف السجل الطبي رقم ${record.id}؟`,
        confirmText: 'حذف',
        cancelText: 'إلغاء'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.medicalRecordService.deleteMedicalRecord(record.id!).subscribe({
          next: () => {
            this.notificationService.success('تم حذف السجل الطبي بنجاح');
            this.router.navigate(['/medical-records']);
          }
        });
      }
    });
  }

  onPrintPrescription(): void {
    const record = this.medicalRecord();
    if (record) {
      this.router.navigate(['/medical-records', record.id, 'prescription']);
    }
  }

  // ===================================================================
  // PERMISSIONS
  // ===================================================================

  canEdit(): boolean {
    const record = this.medicalRecord();
    const user = this.currentUser();

    if (!record || !user) return false;

    if (record.status === RecordStatus.LOCKED) {
      return user.role === 'ADMIN' || user.role === 'SYSTEM_ADMIN';
    }

    return user.role === 'DOCTOR' || user.role === 'ADMIN' || user.role === 'SYSTEM_ADMIN';
  }

  canDelete(): boolean {
    const record = this.medicalRecord();
    const user = this.currentUser();

    if (!record || !user) return false;

    return (user.role === 'ADMIN' || user.role === 'SYSTEM_ADMIN') &&
      record.status !== RecordStatus.LOCKED;
  }

  canLock(): boolean {
    const user = this.currentUser();
    return user?.role === 'DOCTOR' || user?.role === 'ADMIN' || user?.role === 'SYSTEM_ADMIN';
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDateTime(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusLabel(status: RecordStatus): string {
    const labels: Record<RecordStatus, string> = {
      [RecordStatus.DRAFT]: 'مسودة',
      [RecordStatus.IN_PROGRESS]: 'قيد التحرير',
      [RecordStatus.COMPLETED]: 'مكتمل',
      [RecordStatus.REVIEWED]: 'مراجع',
      [RecordStatus.AMENDED]: 'معدل',
      [RecordStatus.LOCKED]: 'مقفل',
      [RecordStatus.CANCELLED]: 'ملغي'
    };
    return labels[status] || status;
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

  getDiagnosisTypeLabel(type: DiagnosisType): string {
    const labels: Record<DiagnosisType, string> = {
      [DiagnosisType.PRELIMINARY]: 'أولي',
      [DiagnosisType.DIFFERENTIAL]: 'تفريقي',
      [DiagnosisType.CONFIRMED]: 'مؤكد',
      [DiagnosisType.RULED_OUT]: 'مستبعد'
    };
    return labels[type] || type;
  }

  getMedicationRouteLabel(route: MedicationRoute): string {
    const labels: Record<MedicationRoute, string> = {
      [MedicationRoute.ORAL]: 'فموي',
      [MedicationRoute.INTRAVENOUS]: 'وريدي',
      [MedicationRoute.INTRAMUSCULAR]: 'عضلي',
      [MedicationRoute.SUBCUTANEOUS]: 'تحت الجلد',
      [MedicationRoute.TOPICAL]: 'موضعي',
      [MedicationRoute.INHALATION]: 'استنشاق',
      [MedicationRoute.RECTAL]: 'شرجي',
      [MedicationRoute.OPHTHALMIC]: 'قطرة عين',
      [MedicationRoute.OTIC]: 'قطرة أذن',
      [MedicationRoute.NASAL]: 'أنفي'
    };
    return labels[route] || route;
  }

  getTestStatusLabel(status: TestStatus): string {
    const labels: Record<TestStatus, string> = {
      [TestStatus.ORDERED]: 'مطلوب',
      [TestStatus.SPECIMEN_COLLECTED]: 'تم جمع العينة',
      [TestStatus.IN_PROGRESS]: 'قيد التنفيذ',
      [TestStatus.COMPLETED]: 'مكتمل',
      [TestStatus.CANCELLED]: 'ملغي'
    };
    return labels[status] || status;
  }

  getReferralPriorityLabel(priority: ReferralPriority): string {
    const labels: Record<ReferralPriority, string> = {
      [ReferralPriority.LOW]: 'منخفض',
      [ReferralPriority.MEDIUM]: 'متوسط',
      [ReferralPriority.HIGH]: 'عالي',
      [ReferralPriority.URGENT]: 'عاجل'
    };
    return labels[priority] || priority;
  }
}
