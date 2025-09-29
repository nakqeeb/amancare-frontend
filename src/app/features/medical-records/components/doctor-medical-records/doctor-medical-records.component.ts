// ===================================================================
// src/app/features/medical-records/components/doctor-medical-records/doctor-medical-records.component.ts
// Doctor Medical Records Component - Shows all records created by a specific doctor
// ===================================================================

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MedicalRecordService } from '../../services/medical-record.service';
import { UserService } from '../../../users/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

import { MedicalRecordSummary, RecordStatus, VisitType } from '../../models/medical-record.model';
import { User } from '../../../users/models/user.model';

@Component({
  selector: 'app-doctor-medical-records',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './doctor-medical-records.component.html',
  styleUrl: './doctor-medical-records.component.scss'
})
export class DoctorMedicalRecordsComponent implements OnInit {
  // Services
  private medicalRecordService = inject(MedicalRecordService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // State
  doctor = signal<User | null>(null);
  records = signal<MedicalRecordSummary[]>([]);
  filteredRecords = signal<MedicalRecordSummary[]>([]);
  loading = this.medicalRecordService.loading;

  // Statistics
  totalRecords = signal(0);
  uniquePatients = signal(0);
  todayRecords = signal(0);
  completedRecords = signal(0);

  // Filters
  selectedPeriod = 'all';
  selectedStatus = '';
  selectedVisitType = '';

  // Pagination
  currentPage = 0;
  pageSize = 10;

  // Table columns
  displayedColumns = ['id', 'visitDate', 'patient', 'visitType', 'chiefComplaint', 'status', 'actions'];

  ngOnInit(): void {
    const doctorId = this.route.snapshot.paramMap.get('doctorId');
    if (doctorId) {
      this.loadDoctorData(parseInt(doctorId));
      this.loadDoctorRecords(parseInt(doctorId));
    }
  }

  private loadDoctorData(doctorId: number): void {
    this.userService.getClinicUserById(doctorId).subscribe({
      next: (response) => {
        this.doctor.set(response.data!);
      }
    });
  }

  private loadDoctorRecords(doctorId: number): void {
    this.medicalRecordService.getDoctorMedicalRecords(doctorId, this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.records.set(response.content || []);
        this.filteredRecords.set(response.content || []);
        this.totalRecords.set(response.totalElements || 0);
        this.calculateStatistics();
      }
    });
  }

  private calculateStatistics(): void {
    const records = this.records();

    // Unique patients
    const uniquePatientsSet = new Set(records.map(r => r.patientId));
    this.uniquePatients.set(uniquePatientsSet.size);

    // Today's records
    const today = new Date().toDateString();
    this.todayRecords.set(
      records.filter(r => new Date(r.visitDate).toDateString() === today).length
    );

    // Completed records
    this.completedRecords.set(
      records.filter(r => r.status === RecordStatus.COMPLETED).length
    );
  }

  onFilterChange(): void {
    let filtered = [...this.records()];

    // Apply period filter
    if (this.selectedPeriod !== 'all') {
      const now = new Date();
      let cutoff: Date;

      switch (this.selectedPeriod) {
        case 'today':
          cutoff = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          cutoff = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          cutoff = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          cutoff = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          cutoff = new Date(0);
      }

      filtered = filtered.filter(r => new Date(r.visitDate) >= cutoff);
    }

    // Apply status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(r => r.status === this.selectedStatus);
    }

    // Apply visit type filter
    if (this.selectedVisitType) {
      filtered = filtered.filter(r => r.visitType === this.selectedVisitType);
    }

    this.filteredRecords.set(filtered);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    const doctorId = this.route.snapshot.paramMap.get('doctorId');
    if (doctorId) {
      this.loadDoctorRecords(parseInt(doctorId));
    }
  }

  onView(record: MedicalRecordSummary): void {
    this.router.navigate(['/medical-records', record.id]);
  }

  onEdit(record: MedicalRecordSummary): void {
    this.router.navigate(['/medical-records', record.id, 'edit']);
  }

  onPrint(record: MedicalRecordSummary): void {
    this.medicalRecordService.exportMedicalRecordAsPdf(record.id).subscribe({
      next: (blob) => {
        this.medicalRecordService.downloadPdf(blob, `medical-record-${record.id}.pdf`);
      }
    });
  }

  onExport(): void {
    this.notificationService.info('جاري تصدير البيانات...');
  }

  onRefresh(): void {
    const doctorId = this.route.snapshot.paramMap.get('doctorId');
    if (doctorId) {
      this.loadDoctorRecords(parseInt(doctorId));
    }
  }

  onBack(): void {
    this.router.navigate(['/medical-records']);
  }

  canEdit(record: MedicalRecordSummary): boolean {
    const user = this.authService.currentUser();
    return user?.role === 'DOCTOR' || user?.role === 'ADMIN' || user?.role === 'SYSTEM_ADMIN';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-SA');
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

  getVisitTypeColor(type: VisitType): string {
    const colors: Record<VisitType, string> = {
      [VisitType.CONSULTATION]: '#9C27B0',
      [VisitType.FOLLOW_UP]: '#00BCD4',
      [VisitType.EMERGENCY]: '#F44336',
      [VisitType.ROUTINE_CHECKUP]: '#4CAF50',
      [VisitType.VACCINATION]: '#FF9800',
      [VisitType.PROCEDURE]: '#607D8B',
      [VisitType.SURGERY]: '#795548',
      [VisitType.REHABILITATION]: '#3F51B5',
      [VisitType.PREVENTIVE_CARE]: '#8BC34A',
      [VisitType.CHRONIC_CARE]: '#FF5722'
    };
    return colors[type] || '#757575';
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

  getStatusColor(status: RecordStatus): string {
    const colors: Record<RecordStatus, string> = {
      [RecordStatus.DRAFT]: '#9E9E9E',
      [RecordStatus.IN_PROGRESS]: '#FF9800',
      [RecordStatus.COMPLETED]: '#4CAF50',
      [RecordStatus.REVIEWED]: '#2196F3',
      [RecordStatus.LOCKED]: '#F44336',
      [RecordStatus.CANCELLED]: '#757575'
    };
    return colors[status] || '#757575';
  }
}
