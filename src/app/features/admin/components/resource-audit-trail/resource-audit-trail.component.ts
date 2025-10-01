// ===================================================================
// src/app/features/admin/components/resource-audit-trail/resource-audit-trail.component.ts
// Resource Audit Trail Component - View complete audit history for a resource
// ===================================================================
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// Services & Models
import { AdminService } from '../../services/admin.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  AuditLogResponse,
  AUDIT_ACTION_TYPE_LABELS,
  AUDIT_RESOURCE_TYPE_LABELS,
  CRITICAL_ACTION_TYPES
} from '../../models/audit.model';

@Component({
  selector: 'app-resource-audit-trail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    MatExpansionModule,
    MatListModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './resource-audit-trail.component.html',
  styleUrls: ['./resource-audit-trail.component.scss']
})
export class ResourceAuditTrailComponent implements OnInit {
  // Services
  private adminService = inject(AdminService);
  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);

  // ===================================================================
  // STATE MANAGEMENT
  // ===================================================================

  auditTrail = signal<AuditLogResponse[]>([]);
  loading = signal(false);
  resourceType = signal<string>('');
  resourceId = signal<number>(0);

  // Labels
  actionTypeLabels = AUDIT_ACTION_TYPE_LABELS;
  resourceTypeLabels = AUDIT_RESOURCE_TYPE_LABELS;
  criticalActionTypes = CRITICAL_ACTION_TYPES;

  // ===================================================================
  // COMPUTED PROPERTIES
  // ===================================================================

  hasData = computed(() => this.auditTrail().length > 0);
  isEmpty = computed(() => !this.loading() && this.auditTrail().length === 0);

  resourceTypeLabel = computed(() => {
    const type = this.resourceType();
    return this.resourceTypeLabels[type] || type;
  });

  groupedByDate = computed(() => {
    const trail = this.auditTrail();
    const grouped: { [key: string]: AuditLogResponse[] } = {};

    trail.forEach(log => {
      const date = new Date(log.createdAt).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(log);
    });

    return Object.entries(grouped).map(([date, logs]) => ({
      date,
      logs
    }));
  });

  // ===================================================================
  // LIFECYCLE HOOKS
  // ===================================================================

  ngOnInit(): void {
    // Get route parameters
    this.route.params.subscribe(params => {
      const resourceType = params['resourceType'];
      const resourceId = +params['resourceId'];

      if (resourceType && resourceId) {
        this.resourceType.set(resourceType);
        this.resourceId.set(resourceId);
        this.loadAuditTrail();
      } else {
        this.notificationService.error('معلمات المورد غير صحيحة');
        this.goBack();
      }
    });
  }

  // ===================================================================
  // DATA LOADING
  // ===================================================================

  loadAuditTrail(): void {
    this.loading.set(true);

    this.adminService.getResourceAuditTrail(
      this.resourceType(),
      this.resourceId()
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.auditTrail.set(response.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.error('فشل في تحميل سجل المورد');
      }
    });
  }

  // ===================================================================
  // NAVIGATION
  // ===================================================================

  goBack(): void {
    this.location.back();
  }

  viewAuditLogs(): void {
    this.router.navigate(['/admin/audit/logs']);
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================

  getActionTypeLabel(actionType: string): string {
    return this.actionTypeLabels[actionType] || actionType;
  }

  isCriticalAction(actionType: string): boolean {
    return this.criticalActionTypes.includes(actionType);
  }

  getActionChipClass(actionType: string): string {
    if (this.isCriticalAction(actionType)) {
      return 'critical-chip';
    }
    if (actionType.startsWith('FAILED')) {
      return 'warning-chip';
    }
    if (['CREATE', 'UPDATE'].includes(actionType)) {
      return 'success-chip';
    }
    if (actionType === 'DELETE') {
      return 'danger-chip';
    }
    return 'default-chip';
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  formatFullDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getActionIcon(actionType: string): string {
    if (actionType.includes('CREATE')) return 'add_circle';
    if (actionType.includes('UPDATE')) return 'edit';
    if (actionType.includes('DELETE')) return 'delete';
    if (actionType.includes('VIEW')) return 'visibility';
    if (actionType.includes('EXPORT')) return 'download';
    if (actionType.includes('PAYMENT')) return 'payment';
    return 'info';
  }
}
