// ===================================================================
// src/app/features/patients/components/patient-list/patient-list.component.ts
// Updated to use integrated PatientService with Spring Boot APIs
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { DataTableComponent, TableColumn, TableAction } from '../../../../shared/components/data-table/data-table.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

// Services & Models
import { PatientService } from '../../services/patient.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  Patient,
  PatientSearchCriteria,
  Gender,
  BloodType,
  PatientStatistics
} from '../../models/patient.model';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTableModule } from '@angular/material/table';

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
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatDividerModule,
    MatChipsModule,
    MatBadgeModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatTableModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './patient-list.component.html',
  styleUrl: './patient-list.component.scss'
})
export class PatientListComponent implements OnInit {
  @ViewChild('dataTable') dataTable!: DataTableComponent;

  // Services
  private patientService = inject(PatientService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  // ===================================================================
  // STATE MANAGEMENT
  // ===================================================================

  // Data signals
  patients = this.patientService.patients;
  loading = this.patientService.loading;
  statistics = this.patientService.statistics;

  // UI State signals
  viewMode = signal<'table' | 'cards'>('table');
  currentPage = signal(0);
  pageSize = signal(10);
  totalPatients = signal(0);
  totalPages = signal(0);
  searchPerformed = signal(false);
  showAdvancedSearch = signal(false);
  selectedPatients = signal<Patient[]>([]);

  // Search Form
  searchForm: FormGroup;

  // ===================================================================
  // TABLE CONFIGURATION
  // ===================================================================

  tableColumns: TableColumn[] = [
    {
      key: 'patientNumber',
      label: 'رقم المريض',
      sortable: true,
      width: '120px',
      format: (value) => value || '-'
    },
    {
      key: 'fullName',
      label: 'اسم المريض',
      sortable: true,
      width: '200px'
    },
    {
      key: 'age',
      label: 'العمر',
      width: '80px',
      format: (value, row) => {
        if (row.dateOfBirth) {
          return `${this.patientService.calculateAge(row.dateOfBirth)} سنة`;
        }
        return value ? `${value} سنة` : '-';
      }
    },
    {
      key: 'gender',
      label: 'الجنس',
      width: '80px',
      format: (value) => this.patientService.formatGender(value)
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
      format: (value) => value ? this.patientService.formatBloodType(value) : '-'
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
      width: '80px',
      format: (value) => value ? 'نشط' : 'غير نشط'
    },
    {
      key: 'actions',
      label: 'الإجراءات',
      type: 'actions',
      width: '150px'
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
    },
    {
      label: 'إعادة تفعيل',
      icon: 'restore',
      color: 'accent',
      action: (patient) => this.onReactivatePatient(patient),
      visible: (patient) => !patient.isActive
    }
  ];

  // Dropdown Data
  bloodTypes = this.patientService.getBloodTypes();
  genders = this.patientService.getGenders();

  // ===================================================================
  // LIFECYCLE HOOKS
  // ===================================================================

  constructor() {
    this.searchForm = this.fb.group({
      searchTerm: [''],
      gender: [''],
      bloodType: [''],
      // ageFrom: [''],
      // ageTo: [''],
      showInactive: [false],
      // city: [''],
      // lastVisitFrom: [''],
      // lastVisitTo: ['']
    });

    // Watch for search form changes
    this.searchForm.valueChanges.subscribe(() => {
      // Debounce search
      setTimeout(() => this.onSearch(), 300);
    });
  }

  ngOnInit(): void {
    this.loadPatients();
    this.loadStatistics();
    this.checkRouteParams();
  }

  // ===================================================================
  // DATA LOADING METHODS
  // ===================================================================

  /**
   * Load patients using the integrated service
   */
  private loadPatients(): void {
    const searchCriteria = this.buildSearchCriteria();

    if (this.hasSearchCriteria(searchCriteria)) {
      // Use search endpoint
      this.patientService.searchPatients(
        searchCriteria,
        this.currentPage(),
        this.pageSize()
      ).subscribe({
        next: (response) => {
          if (response.success) {
            this.totalPatients.set(response.data!.totalElements);
            this.totalPages.set(response.data!.totalPages);
            this.searchPerformed.set(true);
          }
        },
        error: (error) => {
          this.notificationService.error('حدث خطأ في البحث عن المرضى');
        }
      });
    } else {
      // Use get all patients endpoint
      this.patientService.getAllPatients(
        this.currentPage(),
        this.pageSize(),
        'firstName',
        'asc'
      ).subscribe({
        next: (response) => {
          if (response.success) {
            this.totalPatients.set(response.data!.totalElements);
            this.totalPages.set(response.data!.totalPages);
            this.searchPerformed.set(false);
          }
        },
        error: (error) => {
          this.notificationService.error('حدث خطأ في تحميل بيانات المرضى');
        }
      });
    }
  }

  /**
   * Load patient statistics
   */
  private loadStatistics(): void {
    this.patientService.getPatientStatistics().subscribe({
      next: (response) => {
        if (response.success) {
          // Statistics are automatically set in the service
        }
      },
      error: (error) => {
        console.warn('Could not load patient statistics:', error);
      }
    });
  }

  /**
   * Build search criteria from form
   */
  private buildSearchCriteria(): PatientSearchCriteria {
    const formValue = this.searchForm.value;

    return {
      searchTerm: formValue.searchTerm?.trim() || undefined,
      gender: formValue.gender || undefined,
      bloodType: formValue.bloodType || undefined,
      // ageFrom: formValue.ageFrom || undefined,
      // ageTo: formValue.ageTo || undefined,
      isActive: formValue.showInactive ? false : true,
      // city: formValue.city?.trim() || undefined,
      // lastVisitFrom: formValue.lastVisitFrom || undefined,
      // lastVisitTo: formValue.lastVisitTo || undefined,
    };
  }

  /**
   * Check if search criteria has any filters
   */
  private hasSearchCriteria(criteria: PatientSearchCriteria): boolean {
    return !!(
      criteria.searchTerm ||
      criteria.gender ||
      criteria.bloodType ||
      criteria.ageFrom ||
      criteria.ageTo ||
      criteria.city ||
      criteria.lastVisitFrom ||
      criteria.lastVisitTo ||
      criteria.isActive === false
    );
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

  // ===================================================================
  // EVENT HANDLERS
  // ===================================================================

  /**
   * Handle search button click
   */
  onSearch(): void {
    this.currentPage.set(0);
    this.loadPatients();
  }

  /**
   * Clear search filters
   */
  onClearSearch(): void {
    this.searchForm.reset({
      searchTerm: '',
      gender: '',
      bloodType: '',
      // ageFrom: '',
      // ageTo: '',
      showInactive: false,
      // city: '',
      // lastVisitFrom: '',
      // lastVisitTo: ''
    });
    this.currentPage.set(0);
    this.loadPatients();
  }

  /**
   * Toggle advanced search
   */
  onToggleAdvancedSearch(): void {
    this.showAdvancedSearch.set(!this.showAdvancedSearch());
  }

  /**
   * Handle pagination
   */
  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadPatients();
  }

  /**
   * Toggle view mode
   */
  onToggleViewMode(): void {
    this.viewMode.set(this.viewMode() === 'table' ? 'cards' : 'table');
  }

  /**
   * Refresh data
   */
  onRefresh(): void {
    this.loadPatients();
    this.loadStatistics();
  }

  // ===================================================================
  // PATIENT ACTIONS
  // ===================================================================

  /**
   * View patient details
   */
  onViewPatient(patient: Patient): void {
    this.router.navigate(['/patients', patient.id]);
  }

  /**
   * Edit patient
   */
  onEditPatient(patient: Patient): void {
    this.router.navigate(['/patients', patient.id, 'edit']);
  }

  /**
   * Delete patient (soft delete)
   */
  onDeletePatient(patient: Patient): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'تأكيد الحذف',
        message: `هل أنت متأكد من حذف المريض "${patient.fullName}"؟ سيتم إلغاء تفعيل المريض فقط.`,
        confirmText: 'حذف',
        cancelText: 'إلغاء',
        type: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.patientService.deletePatient(patient.id).subscribe({
          next: (response) => {
            if (response.success) {
              this.loadPatients(); // Refresh the list
            }
          },
          error: (error) => {
            this.notificationService.error('فشل في حذف المريض');
          }
        });
      }
    });
  }

  /**
   * Reactivate patient
   */
  onReactivatePatient(patient: Patient): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'تأكيد إعادة التفعيل',
        message: `هل أنت متأكد من إعادة تفعيل المريض "${patient.fullName}"؟`,
        confirmText: 'إعادة تفعيل',
        cancelText: 'إلغاء',
        type: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.patientService.reactivatePatient(patient.id).subscribe({
          next: (response) => {
            if (response.success) {
              this.loadPatients(); // Refresh the list
            }
          },
          error: (error) => {
            this.notificationService.error('فشل في إعادة تفعيل المريض');
          }
        });
      }
    });
  }

  /**
   * Add new patient
   */
  onAddPatient(): void {
    this.router.navigate(['/patients/new']);
  }

  /**
   * Export patients data
   */
  onExportPatients(format: 'excel' | 'pdf' | 'csv'): void {
    // TODO: Implement export functionality
    this.notificationService.info(`تصدير البيانات بتنسيق ${format} قريباً...`);
  }

  /**
   * Import patients data
   */
  onImportPatients(): void {
    // TODO: Implement import functionality
    this.notificationService.info('استيراد البيانات قريباً...');
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA');
  }

  /**
   * Get patient age (this method can be removed if you prefer the pre-calculated approach)
   */
  getPatientAge(patient: Patient): number {
    if (patient.age) {
      return patient.age; // Use pre-calculated age
    }
    if (patient.dateOfBirth) {
      return this.patientService.calculateAge(patient.dateOfBirth);
    }
    return 0;
  }

  /**
   * Format gender for display
   */
  formatGender(gender: Gender): string {
    return this.patientService.formatGender(gender);
  }

  /**
   * Format blood type for display
   */
  formatBloodType(bloodType: BloodType): string {
    return this.patientService.formatBloodType(bloodType);
  }

  /**
   * Get statistics summary text
   */
  getStatisticsSummary(): string {
    const stats = this.statistics();
    if (!stats) return '';

    return `المجموع: ${stats.totalPatients} | النشط: ${stats.activePatients} | الجدد هذا الشهر: ${stats.newPatientsThisMonth}`;
  }

  /**
   * Get search results summary
   */
  getSearchSummary(): string {
    const total = this.totalPatients();
    const hasFilters = this.searchPerformed();

    if (hasFilters) {
      return `تم العثور على ${total} مريض`;
    }
    return `إجمالي المرضى: ${total}`;
  }

  /**
   * Check if user can delete patients
   */
  canDeletePatients(): boolean {
    // TODO: Implement role-based permissions
    return true;
  }

  /**
   * Check if user can reactivate patients
   */
  canReactivatePatients(): boolean {
    // TODO: Implement role-based permissions
    return true;
  }
}
