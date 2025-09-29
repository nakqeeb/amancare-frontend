// ===================================================================
// src/app/features/medical-records/components/medical-record-list/medical-record-list.component.ts
// Medical Record List Component with Full Functionality
// ===================================================================

import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ViewChild } from '@angular/core';

import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { Observable, map, startWith } from 'rxjs';

import { MedicalRecordService } from '../../services/medical-record.service';
import { PatientService } from '../../../patients/services/patient.service';
import { UserService } from '../../../users/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

import {
  MedicalRecordSummary,
  MedicalRecordSearchCriteria,
  MedicalRecordStatistics,
  RecordStatus,
  VisitType,
  UpdateRecordStatusRequest
} from '../../models/medical-record.model';
import { Patient } from '../../../patients/models/patient.model';
import { User } from '../../../users/models/user.model';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-medical-record-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatAutocompleteModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './medical-record-list.component.html',
  styleUrl: './medical-record-list.component.scss'
})
export class MedicalRecordListComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Services
  private medicalRecordService = inject(MedicalRecordService);
  private patientService = inject(PatientService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  // State Management
  medicalRecords = this.medicalRecordService.medicalRecords;
  statistics = this.medicalRecordService.statistics;
  loading = this.medicalRecordService.loading;
  currentUser = this.authService.currentUser;

  // Additional Signals
  doctors = signal<User[]>([]);
  patients = signal<Patient[]>([]);

  // Table Configuration
  displayedColumns: string[] = [
    'id',
    'patient',
    'doctor',
    'visitDate',
    'visitType',
    'chiefComplaint',
    'diagnosis',
    'status',
    'indicators',
    'actions'
  ];

  dataSource = new MatTableDataSource<MedicalRecordSummary>([]);

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalRecords = 0;

  // Search and Filters
  searchTerm = '';
  selectedPatient: Patient | null = null;
  selectedDoctor = '';
  selectedVisitType = '';
  selectedStatus = '';
  fromDate: Date | null = null;
  toDate: Date | null = null;
  includeConfidential = false;

  // Autocomplete
  patientControl = new FormControl<Patient | string>('');
  filteredPatients$!: Observable<Patient[]>;

  // Subscriptions
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initializeData();
    this.setupAutoComplete();
    this.subscribeToDataChanges();
    this.loadStatistics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===================================================================
  // INITIALIZATION
  // ===================================================================

  private initializeData(): void {
    this.loadMedicalRecords();
    this.loadDoctors();
    this.loadPatients();
  }

  private setupAutoComplete(): void {
    this.filteredPatients$ = this.patientControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      map(value => {
        const filterValue = typeof value === 'string' ? value : value?.fullName || '';
        return this.filterPatients(filterValue);
      })
    );
  }

  private filterPatients(value: string): Patient[] {
    const filterValue = value.toLowerCase();
    return this.patients().filter(patient =>
      patient.fullName.toLowerCase().includes(filterValue) ||
      patient.patientNumber.toLowerCase().includes(filterValue)
    );
  }

  private subscribeToDataChanges(): void {
    // Subscribe to medical records changes
    this.medicalRecordService.medicalRecords$
      .pipe(takeUntil(this.destroy$))
      .subscribe(records => {
        this.dataSource.data = records;
        this.totalRecords = records.length;
      });
  }

  // ===================================================================
  // DATA LOADING
  // ===================================================================

  private loadMedicalRecords(): void {
    this.medicalRecordService.getAllMedicalRecords(
      this.currentPage,
      this.pageSize
    ).subscribe({
      next: (response) => {
        this.dataSource.data = response.content || [];
        this.totalRecords = response.totalElements || 0;
        this.setupTableFeatures();
      },
      error: (error) => {
        console.error('Error loading medical records:', error);
      }
    });
  }

  private loadStatistics(): void {
    this.medicalRecordService.getMedicalRecordStatistics().subscribe();
  }

  private loadDoctors(): void {
    this.userService.getDoctors().subscribe({
      next: (response) => {
        this.doctors.set(response.data!);
      }
    });
  }

  private loadPatients(): void {
    this.patientService.getAllPatients(0, 100).subscribe({
      next: (response) => {
        this.patients.set(response.data?.content || []);
      }
    });
  }

  private setupTableFeatures(): void {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  // ===================================================================
  // SEARCH & FILTERS
  // ===================================================================

  onSearch(): void {
    const criteria: MedicalRecordSearchCriteria = {
      searchTerm: this.searchTerm,
      patientId: this.selectedPatient?.id,
      doctorId: this.selectedDoctor ? parseInt(this.selectedDoctor) : undefined,
      visitType: this.selectedVisitType as VisitType || undefined,
      status: this.selectedStatus as RecordStatus || undefined,
      visitDateFrom: this.fromDate?.toISOString().split('T')[0],
      visitDateTo: this.toDate?.toISOString().split('T')[0],
      isConfidential: this.includeConfidential ? undefined : false
    };

    this.medicalRecordService.searchMedicalRecords(
      criteria,
      this.currentPage,
      this.pageSize
    ).subscribe({
      next: (response) => {
        this.dataSource.data = response.content || [];
        this.totalRecords = response.totalElements || 0;
      }
    });
  }

  onFilterChange(): void {
    // Reset to first page when filters change
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.onSearch();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.onSearch();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedPatient = null;
    this.patientControl.setValue('');
    this.selectedDoctor = '';
    this.selectedVisitType = '';
    this.selectedStatus = '';
    this.fromDate = null;
    this.toDate = null;
    this.includeConfidential = false;
    this.loadMedicalRecords();
  }

  onPatientSelected(event: any): void {
    this.selectedPatient = event.option.value;
    this.onFilterChange();
  }

  displayPatient(patient: Patient): string {
    return patient ? `${patient.fullName} - ${patient.patientNumber}` : '';
  }

  // ===================================================================
  // TABLE ACTIONS
  // ===================================================================

  onRowClick(record: MedicalRecordSummary): void {
    if (!record.isConfidential || this.canViewConfidential()) {
      this.router.navigate(['/medical-records', record.id]);
    }
  }

  onView(record: MedicalRecordSummary): void {
    this.router.navigate(['/medical-records', record.id]);
  }

  onEdit(record: MedicalRecordSummary): void {
    this.router.navigate(['/medical-records', record.id, 'edit']);
  }

  onAddRecord(): void {
    this.router.navigate(['/medical-records', 'new']);
  }

  onPrint(record: MedicalRecordSummary): void {
    this.medicalRecordService.exportMedicalRecordAsPdf(record.id).subscribe({
      next: (blob) => {
        const filename = `medical-record-${record.id}-${new Date().toISOString().split('T')[0]}.pdf`;
        this.medicalRecordService.downloadPdf(blob, filename);
      }
    });
  }

  onDelete(record: MedicalRecordSummary): void {
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
        this.medicalRecordService.deleteMedicalRecord(record.id).subscribe({
          next: () => {
            this.loadMedicalRecords();
          }
        });
      }
    });
  }

  onDuplicate(record: MedicalRecordSummary): void {
    // Navigate to create form with record data as query params
    this.router.navigate(['/medical-records', 'new'], {
      queryParams: { duplicateFrom: record.id }
    });
  }

  onToggleLock(record: MedicalRecordSummary): void {
    const newStatus = record.status === RecordStatus.LOCKED
      ? RecordStatus.COMPLETED
      : RecordStatus.LOCKED;

    const request: UpdateRecordStatusRequest = {
      status: newStatus,
      notes: newStatus === RecordStatus.LOCKED
        ? 'تم قفل السجل الطبي'
        : 'تم إلغاء قفل السجل الطبي'
    };

    this.medicalRecordService.updateRecordStatus(record.id, request).subscribe({
      next: () => {
        this.loadMedicalRecords();
      }
    });
  }

  onViewHistory(record: MedicalRecordSummary): void {
    this.router.navigate(['/medical-records', record.id, 'history']);
  }

  onExport(): void {
    // Export current filtered results
    this.notificationService.info('جاري تصدير البيانات...');
    // Implementation for export functionality
  }

  onRefresh(): void {
    this.loadMedicalRecords();
    this.loadStatistics();
  }

  // ===================================================================
  // PAGINATION
  // ===================================================================

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadMedicalRecords();
  }

  // ===================================================================
  // PERMISSIONS
  // ===================================================================

  canCreateRecord(): boolean {
    const role = this.currentUser()?.role;
    return role === 'DOCTOR' || role === 'ADMIN' || role === 'SYSTEM_ADMIN';
  }

  canEdit(record: MedicalRecordSummary): boolean {
    const user = this.currentUser();
    if (!user) return false;

    if (record.status === RecordStatus.LOCKED) {
      return user.role === 'ADMIN' || user.role === 'SYSTEM_ADMIN';
    }

    return user.role === 'DOCTOR' || user.role === 'ADMIN' || user.role === 'SYSTEM_ADMIN';
  }

  canDelete(record: MedicalRecordSummary): boolean {
    const role = this.currentUser()?.role;
    return (role === 'ADMIN' || role === 'SYSTEM_ADMIN') &&
      record.status !== RecordStatus.LOCKED;
  }

  canLock(record: MedicalRecordSummary): boolean {
    const role = this.currentUser()?.role;
    return role === 'DOCTOR' || role === 'ADMIN' || role === 'SYSTEM_ADMIN';
  }

  canViewConfidential(): boolean {
    const role = this.currentUser()?.role || '';
    return this.medicalRecordService.canViewConfidential(role);
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================

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

  getStatusIcon(status: RecordStatus): string {
    const icons: Record<RecordStatus, string> = {
      [RecordStatus.DRAFT]: 'edit_note',
      [RecordStatus.IN_PROGRESS]: 'pending',
      [RecordStatus.COMPLETED]: 'check_circle',
      [RecordStatus.REVIEWED]: 'task_alt',
      [RecordStatus.LOCKED]: 'lock',
      [RecordStatus.CANCELLED]: 'cancel'
    };
    return icons[status] || 'help';
  }
}
