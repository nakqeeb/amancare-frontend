// ===================================================================
// 1. MEDICAL RECORD LIST COMPONENT
// src/app/features/medical-records/components/medical-record-list/medical-record-list.component.ts
// ===================================================================
import { Component, inject, signal, OnInit, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { DataTableComponent, TableColumn, TableAction } from '../../../../shared/components/data-table/data-table.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

// Services & Models
import { MedicalRecordService } from '../../services/medical-record.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  MedicalRecord,
  MedicalRecordSearchCriteria,
  RecordStatus,
  VisitType
} from '../../models/medical-record.model';

@Component({
  selector: 'app-medical-record-list',
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
    MatMenuModule,
    MatChipsModule,
    MatDialogModule,
    MatDividerModule,
    HeaderComponent,
    SidebarComponent,
    DataTableComponent
  ],
  templateUrl: './medical-record-list.component.html',
  styleUrl: './medical-record-list.component.scss'
})
export class MedicalRecordListComponent implements OnInit {
  @ViewChild('dataTable') dataTable!: DataTableComponent;

  // Services
  private medicalRecordService = inject(MedicalRecordService);
  private notificationService = inject(NotificationService);
  private loadingService = inject(LoadingService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  // Signals
  medicalRecords = signal<MedicalRecord[]>([]);
  loading = signal(false);
  totalRecords = signal(0);
  currentUser = this.authService.currentUser;

  completedCount = computed(() =>
    this.medicalRecords().filter(r => r.status === RecordStatus.COMPLETED).length
  );

  draftCount = computed(() =>
    this.medicalRecords().filter(r => r.status === RecordStatus.DRAFT).length
  );

  lockedCount = computed(() =>
    this.medicalRecords().filter(r => r.status === RecordStatus.LOCKED).length
  );

  // Filter Form
  filterForm!: FormGroup;

  // Table Configuration
  columns: TableColumn[] = [
    {
      key: 'visitDate',
      label: 'تاريخ الزيارة',
      sortable: true,
      width: '120px',
      cellTemplate: (record: MedicalRecord) =>
        new Date(record.visitDate).toLocaleDateString('ar-SA')
    },
    {
      key: 'patientName',
      label: 'المريض',
      sortable: true,
      searchable: true
    },
    {
      key: 'doctorName',
      label: 'الطبيب',
      sortable: true
    },
    {
      key: 'visitType',
      label: 'نوع الزيارة',
      width: '120px',
      cellTemplate: (record: MedicalRecord) => this.getVisitTypeLabel(record.visitType)
    },
    {
      key: 'chiefComplaint',
      label: 'الشكوى الرئيسية',
      width: '200px'
    },
    {
      key: 'diagnosis',
      label: 'التشخيص',
      width: '200px',
      cellTemplate: (record: MedicalRecord) =>
        record.diagnosis.find(d => d.isPrimary)?.description || '-'
    },
    {
      key: 'status',
      label: 'الحالة',
      sortable: true,
      width: '100px',
      cellTemplate: (record: MedicalRecord) =>
        `<span class="status-chip status-${record.status.toLowerCase()}">
          ${this.getStatusLabel(record.status)}
        </span>`
    }
  ];

  actions: TableAction[] = [
    {
      icon: 'visibility',
      label: 'عرض',
      color: 'primary',
      action: (record: MedicalRecord) => this.onViewRecord(record)
    },
    {
      icon: 'edit',
      label: 'تعديل',
      color: 'accent',
      action: (record: MedicalRecord) => this.onEditRecord(record),
      show: (record: MedicalRecord) => this.canEdit(record)
    },
    {
      icon: 'print',
      label: 'طباعة',
      color: 'info',
      action: (record: MedicalRecord) => this.onPrintRecord(record)
    },
    {
      icon: 'lock',
      label: 'قفل',
      color: 'warn',
      action: (record: MedicalRecord) => this.onLockRecord(record),
      show: (record: MedicalRecord) =>
        record.status === RecordStatus.COMPLETED && this.isDoctor()
    },
    {
      icon: 'delete',
      label: 'حذف',
      color: 'warn',
      action: (record: MedicalRecord) => this.onDeleteRecord(record),
      show: (record: MedicalRecord) =>
        record.status === RecordStatus.DRAFT && this.canEdit(record)
    }
  ];

  // Filter Options
  visitTypes = [
    { value: '', label: 'جميع الأنواع' },
    { value: VisitType.FIRST_VISIT, label: 'زيارة أولى' },
    { value: VisitType.FOLLOW_UP, label: 'متابعة' },
    { value: VisitType.EMERGENCY, label: 'طوارئ' },
    { value: VisitType.ROUTINE_CHECK, label: 'فحص دوري' },
    { value: VisitType.VACCINATION, label: 'تطعيم' },
    { value: VisitType.CONSULTATION, label: 'استشارة' }
  ];

  statusOptions = [
    { value: '', label: 'جميع الحالات' },
    { value: RecordStatus.DRAFT, label: 'مسودة' },
    { value: RecordStatus.COMPLETED, label: 'مكتمل' },
    { value: RecordStatus.REVIEWED, label: 'مراجع' },
    { value: RecordStatus.AMENDED, label: 'معدل' },
    { value: RecordStatus.LOCKED, label: 'مقفل' }
  ];

  ngOnInit(): void {
    this.initializeFilterForm();
    this.loadMedicalRecords();
    this.checkQueryParams();
  }

  private initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      searchQuery: [''],
      visitType: [''],
      status: [''],
      fromDate: [null],
      toDate: [null],
      patientId: [''],
      doctorId: ['']
    });

    // Subscribe to form changes
    this.filterForm.valueChanges.subscribe(() => {
      this.loadMedicalRecords();
    });
  }

  private checkQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      if (params['patientId']) {
        this.filterForm.patchValue({
          patientId: +params['patientId']
        });
      }
      if (params['doctorId']) {
        this.filterForm.patchValue({
          doctorId: +params['doctorId']
        });
      }
    });
  }

  loadMedicalRecords(): void {
    this.loading.set(true);

    const criteria: MedicalRecordSearchCriteria = {
      ...this.filterForm.value
    };

    // Format dates
    if (criteria.fromDate) {
      criteria.fromDate = this.formatDate(criteria.fromDate);
    }
    if (criteria.toDate) {
      criteria.toDate = this.formatDate(criteria.toDate);
    }

    // Remove empty values
    Object.keys(criteria).forEach(key => {
      if (!criteria[key as keyof MedicalRecordSearchCriteria]) {
        delete criteria[key as keyof MedicalRecordSearchCriteria];
      }
    });

    this.medicalRecordService.getMedicalRecords(criteria).subscribe({
      next: (records) => {
        this.medicalRecords.set(records);
        this.totalRecords.set(records.length);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading medical records:', error);
        this.notificationService.error('حدث خطأ في تحميل السجلات الطبية');
        this.loading.set(false);
      }
    });
  }

  onViewRecord(record: MedicalRecord): void {
    this.router.navigate(['/medical-records', record.id]);
  }

  onEditRecord(record: MedicalRecord): void {
    this.router.navigate(['/medical-records', record.id, 'edit']);
  }

  onPrintRecord(record: MedicalRecord): void {
    this.loadingService.startLoading();
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

        this.loadingService.stopLoading();
        this.notificationService.success('تم تحميل السجل الطبي');
      },
      error: () => {
        this.loadingService.stopLoading();
        this.notificationService.error('حدث خطأ في طباعة السجل');
      }
    });
  }

  onLockRecord(record: MedicalRecord): void {
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
        this.medicalRecordService.updateRecordStatus(record.id!, RecordStatus.LOCKED).subscribe({
          next: () => {
            this.notificationService.success('تم قفل السجل الطبي');
            this.loadMedicalRecords();
          },
          error: () => {
            this.notificationService.error('حدث خطأ في قفل السجل');
          }
        });
      }
    });
  }

  onDeleteRecord(record: MedicalRecord): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'حذف السجل الطبي',
        message: 'هل أنت متأكد من حذف هذا السجل؟',
        confirmText: 'حذف',
        cancelText: 'إلغاء',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.medicalRecordService.deleteMedicalRecord(record.id!).subscribe({
          next: () => {
            this.notificationService.success('تم حذف السجل الطبي');
            this.loadMedicalRecords();
          },
          error: () => {
            this.notificationService.error('حدث خطأ في حذف السجل');
          }
        });
      }
    });
  }

  onExport(event: { format: string }): void {
    // Implement export logic
    this.notificationService.info('جاري تصدير السجلات...');
  }

  onRefresh(): void {
    this.loadMedicalRecords();
  }

  onResetFilters(): void {
    this.filterForm.reset({
      searchQuery: '',
      visitType: '',
      status: '',
      fromDate: null,
      toDate: null,
      patientId: '',
      doctorId: ''
    });
  }

  // Helper methods
  private formatDate(date: Date | string): string {
    if (!date) return '';

    if (typeof date === 'string') {
      return date;
    }

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getVisitTypeLabel(type: VisitType): string {
    const option = this.visitTypes.find(v => v.value === type);
    return option ? option.label : type;
  }

  getStatusLabel(status: RecordStatus): string {
    const option = this.statusOptions.find(s => s.value === status);
    return option ? option.label : status;
  }

  canEdit(record: MedicalRecord): boolean {
    if (record.status === RecordStatus.LOCKED) return false;

    const user = this.currentUser();
    if (!user) return false;

    // Only the doctor who created the record or admin can edit
    return (record.createdBy === user.username || user.role === 'ADMIN') &&
      (record.status === RecordStatus.DRAFT || record.status === RecordStatus.COMPLETED);
  }

  isDoctor(): boolean {
    const user = this.currentUser();
    return user?.role === 'DOCTOR';
  }

  trackByRecord(index: number, record: MedicalRecord): number {
    return record.id!;
  }
}
