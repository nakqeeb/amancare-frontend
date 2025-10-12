// ===================================================================
// src/app/features/admin/components/audit-logs-list/audit-logs-list.component.ts
// Audit Logs List Component - Complete Implementation
// ===================================================================
import { Component, inject, signal, OnInit, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// Services & Models
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  AuditLogResponse,
  AuditFilters,
  AUDIT_ACTION_TYPE_LABELS,
  AUDIT_RESOURCE_TYPE_LABELS,
  HTTP_METHOD_LABELS,
  CRITICAL_ACTION_TYPES
} from '../../models/audit.model';
import { PageResponse } from '../../../../core/models/api-response.model';

@Component({
  selector: 'app-audit-logs-list',
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
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatTooltipModule,
    MatChipsModule,
    MatBadgeModule,
    MatDividerModule,
    MatSlideToggleModule,
    MatExpansionModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './audit-logs-list.component.html',
  styleUrls: ['./audit-logs-list.component.scss']
})
export class AuditLogsListComponent implements OnInit {
  // Services
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // ===================================================================
  // STATE MANAGEMENT
  // ===================================================================

  auditLogs = signal<AuditLogResponse[]>([]);
  pageData = signal<PageResponse<AuditLogResponse> | null>(null);
  loading = signal(false);
  showFilters = signal(true);

  // Labels
  actionTypeLabels = AUDIT_ACTION_TYPE_LABELS;
  resourceTypeLabels = AUDIT_RESOURCE_TYPE_LABELS;
  httpMethodLabels = HTTP_METHOD_LABELS;
  criticalActionTypes = CRITICAL_ACTION_TYPES;

  // Filter Form
  filterForm: FormGroup;

  // Table Configuration
  displayedColumns: string[] = [
    'createdAt',
    'adminFullName',
    'actionType',
    'targetClinicName',
    'targetResourceType',
    'ipAddress',
    'actions'
  ];

  // Action Types for filter dropdown
  actionTypes = Object.keys(AUDIT_ACTION_TYPE_LABELS);
  resourceTypes = Object.keys(AUDIT_RESOURCE_TYPE_LABELS);

  // Pagination
  pageSize = 20;
  pageIndex = 0;
  totalElements = 0;

  // ===================================================================
  // COMPUTED PROPERTIES
  // ===================================================================

  hasData = computed(() => this.auditLogs().length > 0);
  isEmpty = computed(() => !this.loading() && this.auditLogs().length === 0);

  // ===================================================================
  // LIFECYCLE HOOKS
  // ===================================================================

  constructor() {
    this.filterForm = this.fb.group({
      adminUserId: [null],
      clinicId: [null],
      actionType: [null],
      resourceType: [null],
      startDate: [null],
      endDate: [null],
      sortBy: ['createdAt'],
      sortDirection: ['DESC']
    });
  }

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  // ===================================================================
  // DATA LOADING
  // ===================================================================

  loadAuditLogs(): void {
    this.loading.set(true);

    const filters: AuditFilters = {
      ...this.filterForm.value,
      page: this.pageIndex,
      size: this.pageSize
    };

    this.adminService.getAuditLogs(filters).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.auditLogs.set(response.data.content);
          this.pageData.set(response.data);
          this.totalElements = response.data.totalElements;
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
    this.pageIndex = 0; // Reset to first page
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadAuditLogs();
  }

  clearFilters(): void {
    this.filterForm.reset({
      sortBy: 'createdAt',
      sortDirection: 'DESC'
    });
    this.pageIndex = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadAuditLogs();
  }

  toggleFilters(): void {
    this.showFilters.update(value => !value);
  }

  // ===================================================================
  // PAGINATION
  // ===================================================================

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadAuditLogs();
  }

  // ===================================================================
  // EXPORT FUNCTIONALITY
  // ===================================================================

  exportLogs(): void {
    const startDate = this.filterForm.get('startDate')?.value;
    const endDate = this.filterForm.get('endDate')?.value;

    if (!startDate || !endDate) {
      this.notificationService.warning('يرجى تحديد تاريخ البداية والنهاية للتصدير');
      return;
    }

    this.adminService.exportAndDownloadAuditLogs(startDate, endDate);
  }

  // ===================================================================
  // NAVIGATION
  // ===================================================================

  viewResourceAuditTrail(log: AuditLogResponse): void {
    if (log.targetResourceType && log.targetResourceId) {
      this.router.navigate(['/admin/audit/resource', log.targetResourceType, log.targetResourceId]);
    } else {
      this.notificationService.info('لا يوجد مورد مرتبط بهذا السجل');
    }
  }

  viewStatistics(): void {
    this.router.navigate(['/admin/audit/statistics']);
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================

  getActionTypeLabel(actionType: string): string {
    return this.actionTypeLabels[actionType] || actionType;
  }

  getResourceTypeLabel(resourceType?: string): string {
    if (!resourceType) return '-';
    return this.resourceTypeLabels[resourceType] || resourceType;
  }

  getHttpMethodLabel(method?: string): string {
    if (!method) return '-';
    return this.httpMethodLabels[method] || method;
  }

  isCriticalAction(actionType: string): boolean {
    return this.criticalActionTypes.includes(actionType);
  }

  getActionChipColor(actionType: string): string {
    if (this.isCriticalAction(actionType)) {
      return 'warn';
    }
    if (actionType.startsWith('FAILED')) {
      return 'warn';
    }
    if (['CREATE', 'UPDATE'].includes(actionType)) {
      return 'primary';
    }
    if (actionType === 'DELETE') {
      return 'accent';
    }
    return 'basic';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getResourceDisplay(log: AuditLogResponse): string {
    if (!log.targetResourceType) return '-';
    const type = this.getResourceTypeLabel(log.targetResourceType);
    const id = log.targetResourceId ? ` #${log.targetResourceId}` : '';
    return `${type}${id}`;
  }
}
