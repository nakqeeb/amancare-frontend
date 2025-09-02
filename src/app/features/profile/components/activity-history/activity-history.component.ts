// ===================================================================
// Activity History Component
// src/app/features/profile/components/activity-history/activity-history.component.ts
// ===================================================================

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// Services
import { ProfileService } from '../../services/profile.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ActivityHistory, ActivityCategory } from '../../models/profile.model';

@Component({
  selector: 'app-activity-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './activity-history.component.html',
  styleUrl: './activity-history.component.scss'
})
export class ActivityHistoryComponent implements OnInit {
  private profileService = inject(ProfileService);
  private notificationService = inject(NotificationService);

  loading = this.profileService.loading;
  activityHistory = this.profileService.activityHistory;

  // Filters
  searchControl = new FormControl('');
  categoryControl = new FormControl('');
  startDateControl = new FormControl<Date | null>(null);
  endDateControl = new FormControl<Date | null>(null);
  quickFilter = signal<string>('');

  // Pagination
  pageSize = signal(25);
  pageIndex = signal(0);

  // Selected activity for context menu
  selectedActivity = signal<ActivityHistory | null>(null);

  // Table columns
  displayedColumns = ['status', 'action', 'description', 'category', 'ipAddress', 'device', 'timestamp', 'actions'];

  // Filtered and paginated data
  filteredActivities = signal<ActivityHistory[]>([]);
  paginatedActivities = signal<ActivityHistory[]>([]);
  totalActivities = signal(0);

  // Mock expanded data
  private mockActivities: ActivityHistory[] = [
    {
      id: 1,
      action: 'LOGIN',
      description: 'تسجيل دخول ناجح',
      category: ActivityCategory.AUTHENTICATION,
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.100',
      deviceType: 'desktop',
      location: 'الرياض، السعودية',
      success: true,
      metadata: { browser: 'Chrome 120', os: 'Windows 11' }
    },
    {
      id: 2,
      action: 'PATIENT_CREATE',
      description: 'إضافة مريض جديد: محمد أحمد',
      category: ActivityCategory.PATIENT,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      ipAddress: '192.168.1.100',
      deviceType: 'desktop',
      success: true,
      metadata: { patientId: 1234 }
    },
    {
      id: 3,
      action: 'APPOINTMENT_CREATE',
      description: 'إنشاء موعد جديد',
      category: ActivityCategory.APPOINTMENT,
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      ipAddress: '192.168.1.101',
      deviceType: 'mobile',
      success: true,
      metadata: { appointmentId: 5678, patientId: 1234 }
    },
    {
      id: 4,
      action: 'PROFILE_UPDATE',
      description: 'تحديث معلومات الملف الشخصي',
      category: ActivityCategory.PROFILE,
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      ipAddress: '192.168.1.100',
      deviceType: 'desktop',
      success: true
    },
    {
      id: 5,
      action: 'PASSWORD_CHANGE',
      description: 'تغيير كلمة المرور',
      category: ActivityCategory.SECURITY,
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      ipAddress: '192.168.1.102',
      deviceType: 'tablet',
      success: true
    },
    {
      id: 6,
      action: 'INVOICE_CREATE',
      description: 'إنشاء فاتورة جديدة #INV-2024-001',
      category: ActivityCategory.INVOICE,
      timestamp: new Date(Date.now() - 259200000).toISOString(),
      ipAddress: '192.168.1.100',
      deviceType: 'desktop',
      success: true,
      metadata: { invoiceId: 'INV-2024-001', amount: 500 }
    },
    {
      id: 7,
      action: 'LOGIN_FAILED',
      description: 'محاولة تسجيل دخول فاشلة',
      category: ActivityCategory.AUTHENTICATION,
      timestamp: new Date(Date.now() - 345600000).toISOString(),
      ipAddress: '192.168.1.105',
      deviceType: 'mobile',
      success: false,
      metadata: { reason: 'Invalid password' }
    },
    {
      id: 8,
      action: 'REPORT_GENERATE',
      description: 'توليد تقرير المرضى الشهري',
      category: ActivityCategory.REPORT,
      timestamp: new Date(Date.now() - 432000000).toISOString(),
      ipAddress: '192.168.1.100',
      deviceType: 'desktop',
      success: true,
      metadata: { reportType: 'monthly_patients', format: 'pdf' }
    }
  ];

  ngOnInit() {
    this.loadActivityHistory();
    this.setupFilters();
  }

  loadActivityHistory() {
    // Use mock data for now
    this.activityHistory.set(this.mockActivities);
    this.applyFilters();
  }

  setupFilters() {
    // Listen to filter changes
    this.searchControl.valueChanges.subscribe(() => this.applyFilters());
    this.categoryControl.valueChanges.subscribe(() => this.applyFilters());
    this.startDateControl.valueChanges.subscribe(() => this.applyFilters());
    this.endDateControl.valueChanges.subscribe(() => this.applyFilters());
  }

  applyFilters() {
    let filtered = [...this.activityHistory()];

    // Search filter
    const searchTerm = this.searchControl.value?.toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter(activity =>
        activity.description.toLowerCase().includes(searchTerm) ||
        activity.action.toLowerCase().includes(searchTerm)
      );
    }

    // Category filter
    const category = this.categoryControl.value;
    if (category) {
      filtered = filtered.filter(activity => activity.category === category);
    }

    // Date filters
    const startDate = this.startDateControl.value;
    if (startDate) {
      filtered = filtered.filter(activity =>
        new Date(activity.timestamp) >= startDate
      );
    }

    const endDate = this.endDateControl.value;
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(activity =>
        new Date(activity.timestamp) <= end
      );
    }

    this.filteredActivities.set(filtered);
    this.totalActivities.set(filtered.length);
    this.updatePagination();
  }

  resetFilters() {
    this.searchControl.setValue('');
    this.categoryControl.setValue('');
    this.startDateControl.setValue(null);
    this.endDateControl.setValue(null);
    this.quickFilter.set('');
    this.applyFilters();
  }

  setQuickFilter(filter: string) {
    this.quickFilter.set(filter);
    const now = new Date();

    switch (filter) {
      case 'today':
        this.startDateControl.setValue(new Date(now.setHours(0, 0, 0, 0)));
        this.endDateControl.setValue(new Date());
        break;
      case 'week':
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        this.startDateControl.setValue(weekAgo);
        this.endDateControl.setValue(new Date());
        break;
      case 'month':
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        this.startDateControl.setValue(monthAgo);
        this.endDateControl.setValue(new Date());
        break;
      case 'year':
        const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
        this.startDateControl.setValue(yearAgo);
        this.endDateControl.setValue(new Date());
        break;
    }

    this.applyFilters();
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.updatePagination();
  }

  updatePagination() {
    const start = this.pageIndex() * this.pageSize();
    const end = start + this.pageSize();
    this.paginatedActivities.set(this.filteredActivities().slice(start, end));
  }

  getCategoryIcon(category: ActivityCategory): string {
    const icons: Record<ActivityCategory, string> = {
      [ActivityCategory.AUTHENTICATION]: 'lock',
      [ActivityCategory.PROFILE]: 'person',
      [ActivityCategory.SECURITY]: 'security',
      [ActivityCategory.PATIENT]: 'people',
      [ActivityCategory.APPOINTMENT]: 'event',
      [ActivityCategory.MEDICAL_RECORD]: 'medical_services',
      [ActivityCategory.INVOICE]: 'receipt',
      [ActivityCategory.REPORT]: 'assessment',
      [ActivityCategory.SYSTEM]: 'settings'
    };
    return icons[category] || 'info';
  }

  getCategoryName(category: ActivityCategory): string {
    const names: Record<ActivityCategory, string> = {
      [ActivityCategory.AUTHENTICATION]: 'المصادقة',
      [ActivityCategory.PROFILE]: 'الملف الشخصي',
      [ActivityCategory.SECURITY]: 'الأمان',
      [ActivityCategory.PATIENT]: 'المرضى',
      [ActivityCategory.APPOINTMENT]: 'المواعيد',
      [ActivityCategory.MEDICAL_RECORD]: 'السجلات الطبية',
      [ActivityCategory.INVOICE]: 'الفواتير',
      [ActivityCategory.REPORT]: 'التقارير',
      [ActivityCategory.SYSTEM]: 'النظام'
    };
    return names[category] || category;
  }

  getCategoryColor(category: ActivityCategory): string {
    const colors: Record<ActivityCategory, string> = {
      [ActivityCategory.AUTHENTICATION]: '#3f51b5',
      [ActivityCategory.PROFILE]: '#009688',
      [ActivityCategory.SECURITY]: '#f44336',
      [ActivityCategory.PATIENT]: '#ff9800',
      [ActivityCategory.APPOINTMENT]: '#4caf50',
      [ActivityCategory.MEDICAL_RECORD]: '#9c27b0',
      [ActivityCategory.INVOICE]: '#795548',
      [ActivityCategory.REPORT]: '#607d8b',
      [ActivityCategory.SYSTEM]: '#333333'
    };
    return colors[category] || '#666666';
  }

  getDeviceIcon(deviceType: string): string {
    switch (deviceType) {
      case 'desktop': return 'computer';
      case 'mobile': return 'smartphone';
      case 'tablet': return 'tablet';
      default: return 'devices';
    }
  }

  getDeviceName(deviceType: string): string {
    switch (deviceType) {
      case 'desktop': return 'كمبيوتر';
      case 'mobile': return 'جوال';
      case 'tablet': return 'تابلت';
      default: return 'جهاز';
    }
  }

  formatDate(timestamp: string): string {
    return new Date(timestamp).toLocaleDateString('ar-SA');
  }

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  exportData(format: 'csv' | 'excel' | 'pdf') {
    this.notificationService.info(`جاري تصدير البيانات بصيغة ${format.toUpperCase()}...`);
    // Implementation for data export
  }

  viewActivityDetails() {
    const activity = this.selectedActivity();
    if (activity) {
      // Open dialog with activity details
      this.notificationService.info('عرض تفاصيل النشاط');
    }
  }

  copyActivityId() {
    const activity = this.selectedActivity();
    if (activity) {
      navigator.clipboard.writeText(activity.id.toString());
      this.notificationService.success('تم نسخ المعرف');
    }
  }

  viewMetadata() {
    const activity = this.selectedActivity();
    if (activity?.metadata) {
      console.log('Metadata:', activity.metadata);
      this.notificationService.info('تم عرض البيانات الوصفية في وحدة التحكم');
    }
  }
}
