// ===================================================================
// src/app/features/admin/components/audit-statistics/audit-statistics.component.ts
// Audit Statistics Component - Dashboard for Audit Analytics
// ===================================================================
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// Services & Models
import { AdminService } from '../../services/admin.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  AuditStatisticsResponse,
  AUDIT_ACTION_TYPE_LABELS,
  AUDIT_RESOURCE_TYPE_LABELS
} from '../../models/audit.model';

@Component({
  selector: 'app-audit-statistics',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    MatInputModule,
    MatTabsModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './audit-statistics.component.html',
  styleUrls: ['./audit-statistics.component.scss']
})
export class AuditStatisticsComponent implements OnInit {
  // Services
  private adminService = inject(AdminService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // ===================================================================
  // STATE MANAGEMENT
  // ===================================================================

  statistics = signal<AuditStatisticsResponse | null>(null);
  loading = signal(false);

  // Labels
  actionTypeLabels = AUDIT_ACTION_TYPE_LABELS;
  resourceTypeLabels = AUDIT_RESOURCE_TYPE_LABELS;

  // Filter Form
  filterForm: FormGroup;

  // ===================================================================
  // COMPUTED PROPERTIES
  // ===================================================================

  hasData = computed(() => this.statistics() !== null);
  isEmpty = computed(() => !this.loading() && this.statistics() === null);

  // Chart data computed properties
  actionTypeChartData = computed(() => {
    const stats = this.statistics();
    if (!stats?.actionTypeBreakdown) return [];

    return Object.entries(stats.actionTypeBreakdown).map(([key, value]) => ({
      name: this.actionTypeLabels[key] || key,
      value: value
    }));
  });

  resourceTypeChartData = computed(() => {
    const stats = this.statistics();
    if (!stats?.resourceTypeBreakdown) return [];

    return Object.entries(stats.resourceTypeBreakdown).map(([key, value]) => ({
      name: this.resourceTypeLabels[key] || key,
      value: value
    }));
  });

  clinicChartData = computed(() => {
    const stats = this.statistics();
    if (!stats?.clinicBreakdown) return [];

    return Object.entries(stats.clinicBreakdown).map(([key, value]) => ({
      name: `عيادة #${key}`,
      value: value
    }));
  });

  // ===================================================================
  // LIFECYCLE HOOKS
  // ===================================================================

  constructor() {
    // Initialize filter form with default date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    this.filterForm = this.fb.group({
      adminUserId: [null],
      startDate: [startDate],
      endDate: [endDate]
    });
  }

  ngOnInit(): void {
    this.loadStatistics();
  }

  // ===================================================================
  // DATA LOADING
  // ===================================================================

  loadStatistics(): void {
    this.loading.set(true);

    const adminUserId = this.filterForm.get('adminUserId')?.value;
    const startDate = this.filterForm.get('startDate')?.value;
    const endDate = this.filterForm.get('endDate')?.value;

    this.adminService.getAuditStatistics(adminUserId, startDate, endDate).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.statistics.set(response.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  // ===================================================================
  // FILTER METHODS
  // ===================================================================

  applyFilters(): void {
    this.loadStatistics();
  }

  resetFilters(): void {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    this.filterForm.patchValue({
      adminUserId: null,
      startDate: startDate,
      endDate: endDate
    });

    this.loadStatistics();
  }

  setDateRange(days: number): void {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    this.filterForm.patchValue({
      startDate: startDate,
      endDate: endDate
    });

    this.loadStatistics();
  }

  // ===================================================================
  // NAVIGATION
  // ===================================================================

  viewAuditLogs(): void {
    this.router.navigate(['/admin/audit/logs']);
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================

  getTopActionTypes(limit: number = 5): Array<{ name: string; value: number }> {
    return this.actionTypeChartData()
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  }

  getTopResourceTypes(limit: number = 5): Array<{ name: string; value: number }> {
    return this.resourceTypeChartData()
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  }

  getTopClinics(limit: number = 5): Array<{ name: string; value: number }> {
    return this.clinicChartData()
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  }

  formatNumber(value: number): string {
    return value.toLocaleString('ar-SA');
  }

  getPercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  }
}
