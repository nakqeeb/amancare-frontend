// ===================================================================
// src/app/features/patients/components/patient-search/patient-search.component.ts
// Advanced Patient Search Component with Spring Boot Integration
// ===================================================================
import { Component, inject, signal, OnInit, Output, EventEmitter, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

// Services & Models
import { PatientService } from '../../services/patient.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  Patient,
  PatientSearchCriteria,
  Gender,
  BloodType,
  BLOOD_TYPE_OPTIONS,
  GENDER_OPTIONS
} from '../../models/patient.model';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface SearchResult {
  criteria: PatientSearchCriteria;
  patients: Patient[];
  totalCount: number;
}

@Component({
  selector: 'app-patient-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatTooltipModule
],
  templateUrl: './patient-search.component.html',
  styleUrl: './patient-search.component.scss'
})
export class PatientSearchComponent implements OnInit, OnDestroy {
  // Services
  private patientService = inject(PatientService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);

  // Destroy subject
  private destroy$ = new Subject<void>();

  // ===================================================================
  // INPUTS & OUTPUTS
  // ===================================================================

  @Input() showAdvanced = true;
  @Input() autoSearch = true;
  @Input() debounceTime = 500;
  @Output() searchResults = new EventEmitter<SearchResult>();
  @Output() searchCleared = new EventEmitter<void>();

  // ===================================================================
  // STATE MANAGEMENT
  // ===================================================================

  // UI State
  loading = signal(false);
  expanded = signal(false);
  hasResults = signal(false);
  searchPerformed = signal(false);

  // Form
  searchForm: FormGroup;

  // Data
  bloodTypes = BLOOD_TYPE_OPTIONS;
  genders = GENDER_OPTIONS;
  cities = signal<string[]>([]);

  // Search state
  lastSearchCriteria = signal<PatientSearchCriteria>({});
  resultCount = signal(0);

  // ===================================================================
  // LIFECYCLE HOOKS
  // ===================================================================

  constructor() {
    this.searchForm = this.fb.group({
      searchTerm: [''],
      gender: [''],
      bloodType: [''],
      ageFrom: [''],
      ageTo: [''],
      city: [''],
      isActive: [true],
      showInactive: [false],
      lastVisitFrom: [''],
      lastVisitTo: ['']
    });
  }

  ngOnInit(): void {
    this.setupAutoSearch();
    this.loadCities();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===================================================================
  // SETUP METHODS
  // ===================================================================

  private setupAutoSearch(): void {
    if (this.autoSearch) {
      this.searchForm.valueChanges
        .pipe(
          debounceTime(this.debounceTime),
          distinctUntilChanged(),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          this.performSearch();
        });
    }
  }

  private loadCities(): void {
    // Mock cities - replace with actual API call if available
    this.cities.set([
      'الرياض',
      'جدة',
      'مكة المكرمة',
      'المدينة المنورة',
      'الدمام',
      'الخبر',
      'الطائف',
      'تبوك',
      'بريدة',
      'خميس مشيط',
      'حائل',
      'الجبيل',
      'الخرج',
      'الأحساء',
      'نجران',
      'ينبع',
      'أبها',
      'عرعر',
      'سكاكا',
      'جازان'
    ]);
  }

  // ===================================================================
  // SEARCH METHODS
  // ===================================================================

  /**
   * Perform search with current form values
   */
  private performSearch(): void {
    const criteria = this.buildSearchCriteria();

    // Don't search if no criteria provided
    if (!this.hasSearchCriteria(criteria)) {
      this.clearResults();
      return;
    }

    this.loading.set(true);
    this.lastSearchCriteria.set(criteria);

    this.patientService.searchPatients(criteria, 0, 50)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            const result: SearchResult = {
              criteria,
              patients: response.data!.patients,
              totalCount: response.data!.totalElements
            };

            this.resultCount.set(response.data!.totalElements);
            this.hasResults.set(response.data!.patients.length > 0);
            this.searchPerformed.set(true);
            this.searchResults.emit(result);
          }
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          this.notificationService.error('فشل في البحث عن المرضى');
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
      ageFrom: formValue.ageFrom || undefined,
      ageTo: formValue.ageTo || undefined,
      city: formValue.city || undefined,
      isActive: formValue.showInactive ? undefined : formValue.isActive,
      lastVisitFrom: formValue.lastVisitFrom || undefined,
      lastVisitTo: formValue.lastVisitTo || undefined,
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

  /**
   * Clear search results
   */
  private clearResults(): void {
    this.hasResults.set(false);
    this.searchPerformed.set(false);
    this.resultCount.set(0);
    this.searchCleared.emit();
  }

  // ===================================================================
  // EVENT HANDLERS
  // ===================================================================

  /**
   * Manual search trigger
   */
  onSearch(): void {
    this.performSearch();
  }

  /**
   * Clear search form and results
   */
  onClear(): void {
    this.searchForm.reset({
      searchTerm: '',
      gender: '',
      bloodType: '',
      ageFrom: '',
      ageTo: '',
      city: '',
      isActive: true,
      showInactive: false,
      lastVisitFrom: '',
      lastVisitTo: ''
    });

    this.clearResults();
  }

  /**
   * Toggle advanced search panel
   */
  onToggleAdvanced(): void {
    this.expanded.set(!this.expanded());
  }

  /**
   * Quick search presets
   */
  onQuickSearch(preset: string): void {
    this.searchForm.patchValue({
      searchTerm: '',
      gender: '',
      bloodType: '',
      ageFrom: '',
      ageTo: '',
      city: '',
      isActive: true,
      showInactive: false,
      lastVisitFrom: '',
      lastVisitTo: ''
    });

    switch (preset) {
      case 'all':
        // Already reset above
        break;
      case 'active':
        this.searchForm.patchValue({ isActive: true });
        break;
      case 'inactive':
        this.searchForm.patchValue({
          isActive: false,
          showInactive: true
        });
        break;
      case 'male':
        this.searchForm.patchValue({ gender: 'MALE' });
        break;
      case 'female':
        this.searchForm.patchValue({ gender: 'FEMALE' });
        break;
      case 'pediatric':
        this.searchForm.patchValue({
          ageFrom: 0,
          ageTo: 18
        });
        break;
      case 'adult':
        this.searchForm.patchValue({
          ageFrom: 18,
          ageTo: 65
        });
        break;
      case 'senior':
        this.searchForm.patchValue({ ageFrom: 65 });
        break;
    }

    this.performSearch();
  }

  /**
   * Search by patient number
   */
  onSearchByNumber(patientNumber: string): void {
    if (!patientNumber.trim()) return;

    this.loading.set(true);

    this.patientService.getPatientByNumber(patientNumber.trim())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            const result: SearchResult = {
              criteria: { searchTerm: patientNumber },
              patients: [response.data!],
              totalCount: 1
            };

            this.resultCount.set(1);
            this.hasResults.set(true);
            this.searchPerformed.set(true);
            this.searchResults.emit(result);
          } else {
            this.notificationService.warning('لم يتم العثور على مريض بهذا الرقم');
            this.clearResults();
          }
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          this.notificationService.error('فشل في البحث برقم المريض');
          this.clearResults();
        }
      });
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================

  /**
   * Get search summary text
   */
  getSearchSummary(): string {
    if (!this.searchPerformed()) {
      return 'ابدأ البحث للعثور على المرضى';
    }

    const count = this.resultCount();
    if (count === 0) {
      return 'لم يتم العثور على نتائج';
    }

    return `تم العثور على ${count} مريض`;
  }

  /**
   * Get active filters count
   */
  getActiveFiltersCount(): number {
    const criteria = this.buildSearchCriteria();
    let count = 0;

    if (criteria.searchTerm) count++;
    if (criteria.gender) count++;
    if (criteria.bloodType) count++;
    if (criteria.ageFrom || criteria.ageTo) count++;
    if (criteria.city) count++;
    if (criteria.lastVisitFrom || criteria.lastVisitTo) count++;
    if (criteria.isActive === false) count++;

    return count;
  }

  /**
   * Get blood type label
   */
  getBloodTypeLabel(value: BloodType): string {
    return this.bloodTypes.find(bt => bt.value === value)?.arabic || value;
  }

  /**
   * Get gender label
   */
  getGenderLabel(value: Gender): string {
    return this.genders.find(g => g.value === value)?.arabic || value;
  }

  /**
   * Check if form is valid for age range
   */
  isAgeRangeValid(): boolean {
    const ageFrom = this.searchForm.get('ageFrom')?.value;
    const ageTo = this.searchForm.get('ageTo')?.value;

    if (ageFrom && ageTo) {
      return parseInt(ageFrom) <= parseInt(ageTo);
    }

    return true;
  }

  /**
   * Check if form is valid for date range
   */
  isDateRangeValid(): boolean {
    const fromDate = this.searchForm.get('lastVisitFrom')?.value;
    const toDate = this.searchForm.get('lastVisitTo')?.value;

    if (fromDate && toDate) {
      return new Date(fromDate) <= new Date(toDate);
    }

    return true;
  }
}
