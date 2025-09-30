// ===================================================================
// src/app/features/medical-records/components/medical-record-history/medical-record-history.component.ts
// Medical Record History Component - Shows audit trail and history
// ===================================================================

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';

import { MedicalRecordService } from '../../services/medical-record.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { HeaderComponent } from "../../../../shared/components/header/header.component";
import { SidebarComponent } from "../../../../shared/components/sidebar/sidebar.component";

interface AuditEntry {
  id: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'LOCK' | 'UNLOCK' | 'PRINT';
  performedBy: string;
  performedByRole: string;
  timestamp: Date;
  changes?: FieldChange[];
  description: string;
  ipAddress?: string;
  userAgent?: string;
}

interface FieldChange {
  field: string;
  fieldLabel: string;
  oldValue: any;
  newValue: any;
  changeType: 'ADD' | 'UPDATE' | 'DELETE';
}

@Component({
  selector: 'app-medical-record-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatExpansionModule,
    MatDividerModule,
    HeaderComponent,
    SidebarComponent
],
  templateUrl: './medical-record-history.component.html',
  styleUrl: './medical-record-history.component.scss'
})
export class MedicalRecordHistoryComponent implements OnInit {
  private medicalRecordService = inject(MedicalRecordService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // State
  loading = signal(false);
  auditEntries = signal<AuditEntry[]>([]);
  expandedEntry = signal<number | null>(null);

  // Statistics
  totalChanges = signal(0);
  uniqueUsers = signal(0);
  daysSinceCreation = signal(0);
  totalViews = signal(0);
  totalRecords = signal(0);

  // Pagination
  pageSize = 25;
  currentPage = 0;

  ngOnInit(): void {
    const recordId = this.route.snapshot.paramMap.get('id');
    if (recordId) {
      this.loadHistory(parseInt(recordId));
    } else {
      this.router.navigate(['/medical-records']);
    }
  }

  private loadHistory(recordId: number): void {
    this.loading.set(true);

    // Mock data for demonstration
    const mockData: AuditEntry[] = [
      {
        id: 1,
        action: 'CREATE',
        performedBy: 'د. أحمد محمد',
        performedByRole: 'طبيب',
        timestamp: new Date('2024-01-15T10:30:00'),
        description: 'تم إنشاء السجل الطبي',
        ipAddress: '192.168.1.1'
      },
      {
        id: 2,
        action: 'UPDATE',
        performedBy: 'د. أحمد محمد',
        performedByRole: 'طبيب',
        timestamp: new Date('2024-01-15T10:45:00'),
        description: 'تم تحديث معلومات التشخيص',
        changes: [
          {
            field: 'diagnosis',
            fieldLabel: 'التشخيص',
            oldValue: 'التهاب الجهاز التنفسي',
            newValue: 'التهاب الجهاز التنفسي العلوي الحاد',
            changeType: 'UPDATE'
          },
          {
            field: 'prescription',
            fieldLabel: 'الوصفة الطبية',
            oldValue: null,
            newValue: 'Amoxicillin 500mg',
            changeType: 'ADD'
          }
        ]
      },
      {
        id: 3,
        action: 'VIEW',
        performedBy: 'سارة أحمد',
        performedByRole: 'ممرضة',
        timestamp: new Date('2024-01-16T09:00:00'),
        description: 'تم عرض السجل الطبي',
        ipAddress: '192.168.1.2'
      },
      {
        id: 4,
        action: 'PRINT',
        performedBy: 'محمد علي',
        performedByRole: 'موظف استقبال',
        timestamp: new Date('2024-01-16T14:30:00'),
        description: 'تم طباعة الوصفة الطبية',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        id: 5,
        action: 'LOCK',
        performedBy: 'د. أحمد محمد',
        performedByRole: 'طبيب',
        timestamp: new Date('2024-01-17T16:00:00'),
        description: 'تم قفل السجل الطبي'
      }
    ];

    setTimeout(() => {
      this.auditEntries.set(mockData);
      this.calculateStatistics(mockData);
      this.loading.set(false);
    }, 1000);
  }

  private calculateStatistics(entries: AuditEntry[]): void {
    this.totalChanges.set(entries.filter(e => e.action === 'UPDATE').length);
    this.uniqueUsers.set(new Set(entries.map(e => e.performedBy)).size);
    this.totalViews.set(entries.filter(e => e.action === 'VIEW').length);

    if (entries.length > 0) {
      const firstEntry = entries[0];
      const daysDiff = Math.floor(
        (new Date().getTime() - firstEntry.timestamp.getTime()) / (1000 * 60 * 60 * 24)
      );
      this.daysSinceCreation.set(daysDiff);
    }

    this.totalRecords.set(entries.length);
  }

  toggleExpanded(entryId: number): void {
    this.expandedEntry.set(this.expandedEntry() === entryId ? null : entryId);
  }

  getActionIcon(action: string): string {
    const icons: Record<string, string> = {
      'CREATE': 'add_circle',
      'UPDATE': 'edit',
      'DELETE': 'delete',
      'VIEW': 'visibility',
      'LOCK': 'lock',
      'UNLOCK': 'lock_open',
      'PRINT': 'print'
    };
    return icons[action] || 'history';
  }

  getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      'CREATE': 'إنشاء',
      'UPDATE': 'تحديث',
      'DELETE': 'حذف',
      'VIEW': 'عرض',
      'LOCK': 'قفل',
      'UNLOCK': 'فتح القفل',
      'PRINT': 'طباعة'
    };
    return labels[action] || action;
  }

  getChangeIcon(changeType: string): string {
    const icons: Record<string, string> = {
      'ADD': 'add_circle',
      'UPDATE': 'edit',
      'DELETE': 'remove_circle'
    };
    return icons[changeType] || 'change_circle';
  }

  getChangeTypeLabel(changeType: string): string {
    const labels: Record<string, string> = {
      'ADD': 'إضافة',
      'UPDATE': 'تعديل',
      'DELETE': 'حذف'
    };
    return labels[changeType] || changeType;
  }

  formatValue(value: any): string {
    if (value === null || value === undefined) {
      return 'غير محدد';
    }
    if (typeof value === 'boolean') {
      return value ? 'نعم' : 'لا';
    }
    if (value instanceof Date) {
      return value.toLocaleDateString('ar-SA');
    }
    return value.toString();
  }

  formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('ar-SA', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  }

  getTruncatedUserAgent(userAgent: string): string {
    if (userAgent.length > 30) {
      return userAgent.substring(0, 30) + '...';
    }
    return userAgent;
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    // Reload data with new pagination
  }

  onExportHistory(): void {
    this.notificationService.info('جاري تصدير سجل التعديلات...');
  }

  onRefresh(): void {
    const recordId = this.route.snapshot.paramMap.get('id');
    if (recordId) {
      this.loadHistory(parseInt(recordId));
    }
  }

  onBack(): void {
    const recordId = this.route.snapshot.paramMap.get('id');
    this.router.navigate(['/medical-records', recordId]);
  }
}
