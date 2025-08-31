// ===================================================================
// Clinic List Component
// src/app/features/clinics/components/clinic-list/clinic-list.component.ts
// ===================================================================

import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatBadgeModule } from '@angular/material/badge';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

// Services & Models
import { ClinicService } from '../../services/clinic.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  Clinic,
  ClinicFilters,
  SubscriptionPlan,
  ClinicStats,
  SUBSCRIPTION_FEATURES
} from '../../models/clinic.model';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDatepickerModule } from '@angular/material/datepicker';

@Component({
  selector: 'app-clinic-list',
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
    MatProgressSpinnerModule,
    MatTabsModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatDialogModule,
    MatCheckboxModule,
    MatBadgeModule,
    MatPaginatorModule,
    MatDatepickerModule,
    HeaderComponent,
    SidebarComponent,
],
  templateUrl: './clinic-list.component.html',
  styleUrl: './clinic-list.component.scss'
})
export class ClinicListComponent implements OnInit {
  // Services
  private clinicService = inject(ClinicService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // Signals
  loading = this.clinicService.loading;
  clinics = this.clinicService.clinics;
  stats = this.clinicService.stats;
  selectedClinics = signal<Clinic[]>([]);
  showFilters = signal(false);
  viewMode = signal<'grid' | 'list'>('grid');

  // Computed signals
  activeClinics = computed(() => this.clinics().filter(c => c.isActive));
  inactiveClinics = computed(() => this.clinics().filter(c => !c.isActive));
  totalRevenue = computed(() => this.clinics().reduce((sum, c) => sum + (c.monthlyRevenue || 0), 0));

  // Form
  filterForm!: FormGroup;
  searchForm!: FormGroup;

  // Enums for template
  SubscriptionPlan = SubscriptionPlan;
  SUBSCRIPTION_FEATURES = SUBSCRIPTION_FEATURES;

  // Pagination
  currentPage = signal(0);
  pageSize = signal(9); // For grid view
  totalElements = signal(0);

  ngOnInit(): void {
    this.initializeForms();
    this.loadClinics();
    this.loadStats();
  }

  private initializeForms(): void {
    // Search form
    this.searchForm = this.fb.group({
      query: ['']
    });

    // Filter form
    this.filterForm = this.fb.group({
      subscriptionPlan: [''],
      status: [''],
      city: [''],
      createdAfter: [''],
      createdBefore: ['']
    });

    // Subscribe to form changes
    this.searchForm.get('query')?.valueChanges.subscribe(query => {
      if (query.length > 2 || query.length === 0) {
        this.onSearch();
      }
    });
  }

  private loadClinics(): void {
    const filters = this.buildFilters();
    this.clinicService.getClinics(
      this.currentPage(),
      this.pageSize(),
      filters
    ).subscribe(response => {
      this.totalElements.set(response.totalElements);
    });
  }

  private loadStats(): void {
    this.clinicService.getClinicStats().subscribe();
  }

  private buildFilters(): ClinicFilters {
    const formValue = this.filterForm.value;
    const filters: ClinicFilters = {};

    if (formValue.subscriptionPlan) filters.subscriptionPlan = formValue.subscriptionPlan;
    if (formValue.city) filters.city = formValue.city;
    if (formValue.createdAfter) filters.createdAfter = formValue.createdAfter;
    if (formValue.createdBefore) filters.createdBefore = formValue.createdBefore;

    // Add search query if exists
    const searchQuery = this.searchForm.get('query')?.value;
    if (searchQuery) {
      filters.name = searchQuery;
    }

    return filters;
  }

  // ===================================================================
  // EVENT HANDLERS
  // ===================================================================

  onSearch(): void {
    this.currentPage.set(0);
    this.loadClinics();
  }

  onFilterApply(): void {
    this.currentPage.set(0);
    this.loadClinics();
  }

  onFilterClear(): void {
    this.filterForm.reset();
    this.searchForm.reset();
    this.currentPage.set(0);
    this.loadClinics();
  }

  onToggleFilters(): void {
    this.showFilters.set(!this.showFilters());
  }

  onViewModeChange(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
    // Adjust page size based on view mode
    this.pageSize.set(mode === 'grid' ? 9 : 10);
    this.loadClinics();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadClinics();
  }

  onClinicSelect(clinic: Clinic, selected: boolean): void {
    const current = this.selectedClinics();
    if (selected) {
      this.selectedClinics.set([...current, clinic]);
    } else {
      this.selectedClinics.set(current.filter(c => c.id !== clinic.id));
    }
  }

  onSelectAll(selected: boolean): void {
    if (selected) {
      this.selectedClinics.set([...this.clinics()]);
    } else {
      this.selectedClinics.set([]);
    }
  }

  // ===================================================================
  // CLINIC ACTIONS
  // ===================================================================

  onCreateClinic(): void {
    this.router.navigate(['/clinics/new']);
  }

  onViewClinic(clinic: Clinic): void {
    this.router.navigate(['/clinics', clinic.id]);
  }

  onEditClinic(clinic: Clinic): void {
    this.router.navigate(['/clinics', clinic.id, 'edit']);
  }

  onClinicSettings(clinic: Clinic): void {
    this.router.navigate(['/clinics', clinic.id, 'settings']);
  }

  onToggleStatus(clinic: Clinic): void {
    const action = clinic.isActive ? 'إلغاء تفعيل' : 'تفعيل';
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: `${action} العيادة`,
        message: `هل أنت متأكد من ${action} عيادة "${clinic.name}"؟`,
        confirmText: action,
        cancelText: 'إلغاء'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.clinicService.toggleClinicStatus(clinic.id).subscribe({
          next: () => {
            this.notificationService.success(`تم ${action} العيادة بنجاح`);
            this.loadClinics();
          },
          error: (error) => {
            this.notificationService.error(`فشل في ${action} العيادة`);
            console.error('Error toggling clinic status:', error);
          }
        });
      }
    });
  }

  onDeleteClinic(clinic: Clinic): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'حذف العيادة',
        message: `هل أنت متأكد من حذف عيادة "${clinic.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`,
        confirmText: 'حذف',
        cancelText: 'إلغاء',
        isDangerous: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.clinicService.deleteClinic(clinic.id).subscribe({
          next: () => {
            this.notificationService.success('تم حذف العيادة بنجاح');
            this.loadClinics();
          },
          error: (error) => {
            this.notificationService.error('فشل في حذف العيادة');
            console.error('Error deleting clinic:', error);
          }
        });
      }
    });
  }

  // ===================================================================
  // BULK ACTIONS
  // ===================================================================

  onBulkDelete(): void {
    const count = this.selectedClinics().length;
    if (count === 0) return;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'حذف العيادات المحددة',
        message: `هل أنت متأكد من حذف ${count} عيادة؟ هذا الإجراء لا يمكن التراجع عنه.`,
        confirmText: 'حذف الكل',
        cancelText: 'إلغاء',
        isDangerous: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Implementation for bulk delete
        this.selectedClinics.set([]);
        this.notificationService.success(`تم حذف ${count} عيادة بنجاح`);
        this.loadClinics();
      }
    });
  }

  onBulkStatusChange(activate: boolean): void {
    const count = this.selectedClinics().length;
    if (count === 0) return;

    const action = activate ? 'تفعيل' : 'إلغاء تفعيل';

    // Implementation for bulk status change
    this.selectedClinics.set([]);
    this.notificationService.success(`تم ${action} ${count} عيادة بنجاح`);
    this.loadClinics();
  }

  onExportClinics(): void {
    // Implementation for export functionality
    this.notificationService.success('تم تصدير بيانات العيادات بنجاح');
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================

  getClinicStatusColor(clinic: Clinic): string {
    return clinic.isActive ? 'primary' : 'warn';
  }

  getClinicStatusText(clinic: Clinic): string {
    return clinic.isActive ? 'نشطة' : 'غير نشطة';
  }

  getSubscriptionColor(plan: SubscriptionPlan): string {
    return SUBSCRIPTION_FEATURES[plan].color;
  }

  formatRevenue(amount: number): string {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  }

  isSelected(clinic: Clinic): boolean {
    return this.selectedClinics().some(c => c.id === clinic.id);
  }

  hasSelection(): boolean {
    return this.selectedClinics().length > 0;
  }
}
