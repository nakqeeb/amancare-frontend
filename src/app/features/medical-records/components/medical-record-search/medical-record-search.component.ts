// ===================================================================
// src/app/features/medical-records/components/medical-record-search/medical-record-search.component.ts
// Medical Record Search Component - Advanced search functionality
// ===================================================================

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

import { MedicalRecordService } from '../../services/medical-record.service';
import { PatientService } from '../../../patients/services/patient.service';
import { UserService } from '../../../users/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

import {
  MedicalRecordSummary,
  MedicalRecordSearchCriteria,
  RecordStatus,
  VisitType
} from '../../models/medical-record.model';
import { Patient, PatientSearchCriteria } from '../../../patients/models/patient.model';
import { User } from '../../../users/models/user.model';

@Component({
  selector: 'app-medical-record-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatExpansionModule,
    MatMenuModule
  ],
  templateUrl: './medical-record-search.component.html',
  styleUrl: './medical-record-search.component.scss'
})
export class MedicalRecordSearchComponent implements OnInit {
  private fb = inject(FormBuilder);
  private medicalRecordService = inject(MedicalRecordService);
  private patientService = inject(PatientService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  // State
  loading = signal(false);
  loadingPatients = signal(false);
  searchPerformed = signal(false);
  searchResults = signal<MedicalRecordSummary[]>([]);
  totalResults = signal(0);
  filteredPatients = signal<Patient[]>([]);
  doctors = signal<User[]>([]);
  savedSearches = signal<any[]>([]);
  selectedPatient = signal<Patient | null>(null);

  // Form
  searchForm: FormGroup;

  // Table
  displayedColumns = [
    'id',
    'patient',
    'doctor',
    'visitDate',
    'visitType',
    'chiefComplaint',
    'status',
    'actions'
  ];

  // Pagination
  pageSize = 25;
  currentPage = 0;

  constructor() {
    this.searchForm = this.fb.group({
      searchTerm: [''],
      patientName: [''],
      patientId: [null],
      doctorId: [''],
      visitType: [''],
      status: [''],
      visitDateFrom: [null],
      visitDateTo: [null],
      isConfidential: [false],
    });
  }

  ngOnInit(): void {
    this.loadDoctors();
    this.setupPatientAutocomplete();
    this.loadSavedSearches();
  }

  private loadDoctors(): void {
    this.userService.getDoctors().subscribe({
      next: (response) => {
        this.doctors.set(response.data || []);
      },
      error: (error) => {
        console.error('Error loading doctors:', error);
      }
    });
  }

  private setupPatientAutocomplete(): void {
    this.searchForm.get('patientName')?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        filter(value => {
          // Only search if it's a string and has at least 2 characters
          if (typeof value === 'string' && value.length >= 2) {
            return true;
          }
          // Clear the filtered patients if the input is cleared
          if (!value || value === '') {
            this.filteredPatients.set([]);
            this.selectedPatient.set(null);
            this.searchForm.patchValue({ patientId: null }, { emitEvent: false });
          }
          return false;
        }),
        switchMap(searchTerm => {
          this.loadingPatients.set(true);

          // Build search criteria for patient search
          const criteria: PatientSearchCriteria = {
            searchTerm: searchTerm.trim(),
            isActive: true  // Only search for active patients
          };

          // Use the PatientService's searchPatients method with proper parameters
          return this.patientService.searchPatients(criteria, 0, 20);
        })
      )
      .subscribe({
        next: (response) => {
          this.loadingPatients.set(false);
          if (response.success && response.data) {
            // Extract patients from the paginated response
            this.filteredPatients.set(response.data.patients || []);
          } else {
            this.filteredPatients.set([]);
          }
        },
        error: (error) => {
          this.loadingPatients.set(false);
          this.filteredPatients.set([]);
          console.error('Error searching patients:', error);
        }
      });
  }

  private loadSavedSearches(): void {
    // Load saved searches from localStorage or backend
    const saved = localStorage.getItem('savedMedicalRecordSearches');
    if (saved) {
      try {
        this.savedSearches.set(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved searches:', error);
        this.savedSearches.set([]);
      }
    }
  }

  activeFiltersCount(): number {
    let count = 0;
    const values = this.searchForm.value;

    Object.keys(values).forEach(key => {
      if (values[key] && values[key] !== '' && key !== 'searchTerm') {
        count++;
      }
    });

    return count;
  }

  clearSearchTerm(): void {
    this.searchForm.get('searchTerm')?.setValue('');
  }

  displayPatient(patient: Patient): string {
    return patient ? patient.fullName : '';
  }

  selectPatient(patient: Patient): void {
    this.selectedPatient.set(patient);
    this.searchForm.patchValue({
      patientId: patient.id,
      patientName: patient.fullName
    });
  }

  setDateRange(range: string): void {
    const today = new Date();
    let fromDate: Date;
    let toDate = today;

    switch (range) {
      case 'today':
        fromDate = today;
        break;
      case 'week':
        fromDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'year':
        fromDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        return;
    }

    this.searchForm.patchValue({
      visitDateFrom: fromDate,
      visitDateTo: toDate
    });
  }

  onSearch(): void {
    this.loading.set(true);
    this.searchPerformed.set(true);

    const criteria: MedicalRecordSearchCriteria = {
      searchTerm: this.searchForm.value.searchTerm || undefined,
      patientId: this.searchForm.value.patientId || undefined,
      doctorId: this.searchForm.value.doctorId || undefined,
      visitType: this.searchForm.value.visitType || undefined,
      status: this.searchForm.value.status || undefined,
      visitDateFrom: this.searchForm.value.visitDateFrom
        ? this.searchForm.value.visitDateFrom.toISOString().split('T')[0]
        : undefined,
      visitDateTo: this.searchForm.value.visitDateTo
        ? this.searchForm.value.visitDateTo.toISOString().split('T')[0]
        : undefined,
      isConfidential: this.searchForm.value.isConfidential || undefined,
      clinicId: this.searchForm.value.clinicId || undefined
    };

    this.medicalRecordService.searchMedicalRecords(
      criteria,
      this.currentPage,
      this.pageSize
    ).subscribe({
      next: (response) => {
        this.searchResults.set(response.content || []);
        this.totalResults.set(response.totalElements || 0);
        this.loading.set(false);
      },
      error: (error) => {
        this.notificationService.error('حدث خطأ في البحث');
        this.loading.set(false);
        console.error('Search error:', error);
      }
    });
  }

  onReset(): void {
    this.searchForm.reset({
      isConfidential: false
    });
    this.searchResults.set([]);
    this.searchPerformed.set(false);
    this.selectedPatient.set(null);
    this.filteredPatients.set([]);
  }

  saveSearchCriteria(): void {
    const name = prompt('أدخل اسم للبحث المحفوظ:');
    if (name) {
      const savedSearch = {
        id: Date.now(),
        name,
        criteria: this.searchForm.value,
        createdAt: new Date()
      };

      const searches = [...this.savedSearches(), savedSearch];
      this.savedSearches.set(searches);
      localStorage.setItem('savedMedicalRecordSearches', JSON.stringify(searches));
      this.notificationService.success('تم حفظ معايير البحث');
    }
  }

  loadSavedSearch(search: any): void {
    this.searchForm.patchValue(search.criteria);

    // If there's a patient ID in the saved search, we need to load the patient data
    if (search.criteria.patientId && search.criteria.patientName) {
      // Create a temporary patient object for display
      const tempPatient: Partial<Patient> = {
        id: search.criteria.patientId,
        fullName: search.criteria.patientName
      };
      this.selectedPatient.set(tempPatient as Patient);
    }

    this.onSearch();
  }

  deleteSavedSearch(id: number, event?: Event): void {
    // Stop propagation to prevent chip click event
    if (event) {
      event.stopPropagation();
    }

    const searches = this.savedSearches().filter(s => s.id !== id);
    this.savedSearches.set(searches);
    localStorage.setItem('savedMedicalRecordSearches', JSON.stringify(searches));
    this.notificationService.info('تم حذف البحث المحفوظ');
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.onSearch();
  }

  viewRecord(record: MedicalRecordSummary): void {
    this.router.navigate(['/medical-records', record.id]);
  }

  editRecord(record: MedicalRecordSummary): void {
    this.router.navigate(['/medical-records', record.id, 'edit']);
  }

  printRecord(record: MedicalRecordSummary): void {
    this.router.navigate(['/medical-records', record.id, 'prescription']);
  }

  exportResults(): void {
    this.notificationService.info('جاري تصدير النتائج...');
    // TODO: Implement actual export functionality
    // This could export to CSV, PDF, or Excel based on requirements
  }

  formatDate(date: string): string {
    if (!date) return '';
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
}
