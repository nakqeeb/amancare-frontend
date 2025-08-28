// ===================================================================
// src/app/features/patients/components/patient-list/patient-list.component.ts
// ===================================================================
import { Component, inject, signal, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { DataTableComponent, TableColumn, TableAction } from '../../../../shared/components/data-table/data-table.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

// Services & Models
import { PatientService } from '../../services/patient.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { Patient, PatientSearchCriteria } from '../../models/patient.model';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-patient-list',
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
    MatCheckboxModule,
    MatMenuModule,
    MatDialogModule,
    MatDividerModule,
    HeaderComponent,
    SidebarComponent,
    DataTableComponent
  ],
  templateUrl: './patient-list.component.html',
  styleUrl: './patient-list.component.scss'
})

export class PatientListComponent implements OnInit {
  @ViewChild('dataTable') dataTable!: DataTableComponent;

  // Services
  private patientService = inject(PatientService);
  private notificationService = inject(NotificationService);
  private loadingService = inject(LoadingService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  // Signals
  patients = signal<Patient[]>([]);
  loading = signal(false);
  viewMode = signal<'table' | 'cards'>('table');
  showAdvancedSearch = signal(false);
  searchPerformed = signal(false);
  selectedPatient = signal<Patient | null>(null);

  // Pagination
  currentPage = signal(0);
  pageSize = signal(10);
  totalPatients = signal(0);
  totalPages = signal(0);
  originalTotal = signal(0);

  // Form
  searchForm: FormGroup;

  // Table Configuration
  tableColumns: TableColumn[] = [
    {
      key: 'patientNumber',
      label: 'رقم المريض',
      sortable: true,
      width: '120px'
    },
    {
      key: 'fullName',
      label: 'الاسم الكامل',
      sortable: true
    },
    {
      key: 'age',
      label: 'العمر',
      type: 'number',
      sortable: true,
      width: '80px',
      format: (value) => value ? `${value} سنة` : '-'
    },
    {
      key: 'gender',
      label: 'الجنس',
      width: '80px',
      format: (value) => value === 'MALE' ? 'ذكر' : 'أنثى'
    },
    {
      key: 'phone',
      label: 'رقم الهاتف',
      width: '130px'
    },
    {
      key: 'bloodType',
      label: 'فصيلة الدم',
      width: '100px',
      format: (value) => this.getBloodTypeLabel(value)
    },
    {
      key: 'lastVisit',
      label: 'آخر زيارة',
      type: 'date',
      sortable: true,
      width: '120px',
      format: (value) => value ? this.formatDate(value) : '-'
    },
    {
      key: 'isActive',
      label: 'الحالة',
      type: 'boolean',
      width: '80px'
    },
    {
      key: 'actions',
      label: 'الإجراءات',
      type: 'actions',
      width: '120px'
    }
  ];

  tableActions: TableAction[] = [
    {
      label: 'عرض',
      icon: 'visibility',
      color: 'primary',
      action: (patient) => this.onViewPatient(patient)
    },
    {
      label: 'تعديل',
      icon: 'edit',
      action: (patient) => this.onEditPatient(patient)
    },
    {
      label: 'حذف',
      icon: 'delete',
      color: 'warn',
      action: (patient) => this.onDeletePatient(patient),
      visible: (patient) => patient.isActive
    }
  ];

  // Data
  bloodTypes = this.patientService.getBloodTypes();
  genders = this.patientService.getGenders();

  constructor() {
    this.searchForm = this.fb.group({
      searchTerm: [''],
      gender: [''],
      bloodType: [''],
      ageFrom: [''],
      ageTo: [''],
      showInactive: [false],
      city: [''],
      lastVisitFrom: [''],
      lastVisitTo: ['']
    });
  }

  ngOnInit(): void {
    this.loadPatients();
    this.checkRouteParams();
  }

  private checkRouteParams(): void {
    this.route.queryParams.subscribe(params => {
      if (params['search'] === 'true') {
        // Focus on search input
        setTimeout(() => {
          const searchInput = document.querySelector('input[formControlName="searchTerm"]') as HTMLInputElement;
          searchInput?.focus();
        }, 100);
      }
    });
  }

  private loadPatients(): void {
    this.loading.set(true);

    const searchCriteria = this.buildSearchCriteria();

    this.patientService.searchPatients(
      searchCriteria,
      this.currentPage(),
      this.pageSize()
    ).subscribe({
      next: (response) => {
        this.patients.set(response.content);
        this.totalPatients.set(response.totalElements);
        this.totalPages.set(response.totalPages);
        this.loading.set(false);

        if (!this.searchPerformed()) {
          this.originalTotal.set(response.totalElements);
        }

        // Update data table if in table view
        if (this.viewMode() === 'table' && this.dataTable) {
          this.dataTable.setData(response.content);
          this.dataTable.setTotalItems(response.totalElements);
          this.dataTable.setLoading(false);
        }
      },
      error: (error) => {
        this.loading.set(false);
        this.notificationService.error('حدث خطأ في تحميل بيانات المرضى');
      }
    });
  }

  private buildSearchCriteria(): PatientSearchCriteria {
    const formValue = this.searchForm.value;

    return {
      searchTerm: formValue.searchTerm?.trim(),
      gender: formValue.gender || undefined,
      bloodType: formValue.bloodType || undefined,
      ageFrom: formValue.ageFrom || undefined,
      ageTo: formValue.ageTo || undefined,
      isActive: formValue.showInactive ? undefined : true
    };
  }

  onSearch(): void {
    this.currentPage.set(0);
    this.searchPerformed.set(true);
    this.loadPatients();
  }

  onClearSearch(): void {
    this.searchForm.reset({
      showInactive: false
    });
    this.currentPage.set(0);
    this.searchPerformed.set(false);
    this.loadPatients();
  }

  toggleAdvancedSearch(): void {
    this.showAdvancedSearch.update(show => !show);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadPatients();
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadPatients();
    }
  }

  setViewMode(mode: 'table' | 'cards'): void {
    this.viewMode.set(mode);
  }

  onAddPatient(): void {
    this.router.navigate(['/patients/new']);
  }

  onViewPatient(patient: Patient): void {
    this.router.navigate(['/patients', patient.id]);
  }

  onEditPatient(patient: Patient): void {
    this.router.navigate(['/patients', patient.id, 'edit']);
  }

  onDeletePatient(patient: Patient): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'حذف المريض',
        message: `هل أنت متأكد من حذف المريض "${patient.fullName}"؟\n\nسيتم إلغاء تفعيل المريض وإخفاء بياناته من النظام.`,
        confirmText: 'حذف',
        cancelText: 'إلغاء',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.patientService.deletePatient(patient.id!).subscribe({
          next: () => {
            this.notificationService.success('تم حذف المريض بنجاح');
            this.loadPatients();
          },
          error: () => {
            this.notificationService.error('حدث خطأ في حذف المريض');
          }
        });
      }
    });
  }

  onRestorePatient(patient: Patient): void {
    this.patientService.restorePatient(patient.id!).subscribe({
      next: () => {
        this.notificationService.success('تم إعادة تفعيل المريض بنجاح');
        this.loadPatients();
      },
      error: () => {
        this.notificationService.error('حدث خطأ في إعادة تفعيل المريض');
      }
    });
  }

  onBookAppointment(patient: Patient): void {
    this.router.navigate(['/appointments/new'], {
      queryParams: { patientId: patient.id }
    });
  }

  onCreateInvoice(patient: Patient): void {
    this.router.navigate(['/invoices/new'], {
      queryParams: { patientId: patient.id }
    });
  }

  onBulkDelete(patients: Patient[]): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'حذف متعدد',
        message: `هل أنت متأكد من حذف ${patients.length} مريض؟`,
        confirmText: 'حذف الكل',
        cancelText: 'إلغاء',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Implement bulk delete logic
        this.notificationService.success(`تم حذف ${patients.length} مريض بنجاح`);
        this.loadPatients();
      }
    });
  }

  onExport(event: { format: string }): void {
    this.loadingService.startLoading();

    this.patientService.exportPatients(event.format as 'excel' | 'pdf').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `patients.${event.format === 'excel' ? 'xlsx' : 'pdf'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.loadingService.stopLoading();
        this.notificationService.success('تم تصدير البيانات بنجاح');
      },
      error: () => {
        this.loadingService.stopLoading();
        this.notificationService.error('حدث خطأ في تصدير البيانات');
      }
    });
  }

  onRefresh(): void {
    this.loadPatients();
  }

  // Helper methods
  trackByPatient(index: number, patient: Patient): number {
    return patient.id!;
  }

  getBloodTypeLabel(bloodType: string): string {
    const type = this.bloodTypes.find(bt => bt.value === bloodType);
    return type ? type.label : '-';
  }

  getAgeText(age?: number): string {
    return age ? `${age} سنة` : 'غير محدد';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('ar-SA');
  }
}
