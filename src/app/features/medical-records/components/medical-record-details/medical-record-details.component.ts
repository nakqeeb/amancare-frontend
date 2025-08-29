// ===================================================================
// 1. MEDICAL RECORD DETAILS COMPONENT
// src/app/features/medical-records/components/medical-record-details/medical-record-details.component.ts
// ===================================================================
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

// Services & Models
import { MedicalRecordService } from '../../services/medical-record.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  MedicalRecord,
  RecordStatus,
  VisitType,
  DiagnosisType,
  MedicationRoute,
  TestStatus
} from '../../models/medical-record.model';

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
    MatChipsModule,
    MatDividerModule,
    MatMenuModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatListModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './medical-record-details.component.html',
  styleUrl: './medical-record-details.component.scss'
})
export class MedicalRecordDetailsComponent implements OnInit {
  // Services
  private medicalRecordService = inject(MedicalRecordService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);

  // Signals
  medicalRecord = signal<MedicalRecord | null>(null);
  loading = signal(false);
  currentUser = this.authService.currentUser;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadMedicalRecord(+id);
    } else {
      this.router.navigate(['/medical-records']);
    }
  }

  private loadMedicalRecord(id: number): void {
    this.loading.set(true);
    this.medicalRecordService.getMedicalRecordById(id).subscribe({
      next: (record) => {
        this.medicalRecord.set(record);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading medical record:', error);
        this.notificationService.error('حدث خطأ في تحميل السجل الطبي');
        this.loading.set(false);
        this.router.navigate(['/medical-records']);
      }
    });
  }

  onEdit(): void {
    if (this.medicalRecord()?.id) {
      this.router.navigate(['/medical-records', this.medicalRecord()!.id, 'edit']);
    }
  }

  onPrint(): void {
    if (!this.medicalRecord()?.id) return;

    this.loading.set(true);
    this.medicalRecordService.exportMedicalRecord(this.medicalRecord()!.id!).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `medical-record-${this.medicalRecord()!.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.loading.set(false);
        this.notificationService.success('تم تحميل السجل الطبي');
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.error('حدث خطأ في طباعة السجل');
      }
    });
  }

  onPrintPrescription(prescriptionId: number): void {
    if (!this.medicalRecord()?.id) return;

    this.loading.set(true);
    this.medicalRecordService.printPrescription(
      this.medicalRecord()!.id!,
      prescriptionId
    ).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        window.URL.revokeObjectURL(url);

        this.loading.set(false);
        this.notificationService.success('تم طباعة الوصفة الطبية');
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.error('حدث خطأ في طباعة الوصفة');
      }
    });
  }

  onLockRecord(): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'قفل السجل الطبي',
        message: 'هل أنت متأكد من قفل هذا السجل؟ لن يمكن تعديله بعد القفل',
        confirmText: 'قفل السجل',
        cancelText: 'إلغاء',
        type: 'warning'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading.set(true);
        this.medicalRecordService.updateRecordStatus(
          this.medicalRecord()!.id!,
          RecordStatus.LOCKED
        ).subscribe({
          next: (record) => {
            this.medicalRecord.set(record);
            this.notificationService.success('تم قفل السجل الطبي');
            this.loading.set(false);
          },
          error: () => {
            this.notificationService.error('حدث خطأ في قفل السجل');
            this.loading.set(false);
          }
        });
      }
    });
  }

  onViewPatient(): void {
    if (this.medicalRecord()?.patientId) {
      this.router.navigate(['/patients', this.medicalRecord()!.patientId]);
    }
  }

  onViewHistory(): void {
    if (this.medicalRecord()?.patientId) {
      this.router.navigate(['/medical-records/patient', this.medicalRecord()!.patientId]);
    }
  }

  // Helper methods
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

  getStatusClass(status: RecordStatus): string {
    const classes: Record<RecordStatus, string> = {
      [RecordStatus.DRAFT]: 'status-draft',
      [RecordStatus.COMPLETED]: 'status-completed',
      [RecordStatus.REVIEWED]: 'status-reviewed',
      [RecordStatus.AMENDED]: 'status-amended',
      [RecordStatus.LOCKED]: 'status-locked'
    };
    return classes[status] || '';
  }

  getDiagnosisTypeLabel(type: DiagnosisType): string {
    const labels: Record<DiagnosisType, string> = {
      [DiagnosisType.PROVISIONAL]: 'مؤقت',
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

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  canEdit(): boolean {
    const record = this.medicalRecord();
    if (!record || record.status === RecordStatus.LOCKED) return false;

    const user = this.currentUser();
    if (!user) return false;

    return (record.createdBy === user.username || user.role === 'ADMIN') &&
           (record.status === RecordStatus.DRAFT || record.status === RecordStatus.COMPLETED);
  }

  canLock(): boolean {
    const record = this.medicalRecord();
    if (!record) return false;

    return record.status === RecordStatus.COMPLETED && this.isDoctor();
  }

  isDoctor(): boolean {
    const user = this.currentUser();
    return user?.role === 'DOCTOR';
  }
}
