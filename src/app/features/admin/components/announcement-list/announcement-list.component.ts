// ===================================================================
// src/app/features/admin/components/announcement-list/announcement-list.component.ts
// Announcement List Component for SYSTEM_ADMIN
// ===================================================================

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { AnnouncementManagementService } from '../../services/announcement-management.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  Announcement,
  AnnouncementType,
  AnnouncementPriority
} from '../../models/announcement-management.model';
import {
  getAnnouncementTypeLabel,
  getAnnouncementTypeColor
} from '../../../../public/models/announcement.model';
import { HeaderComponent } from "../../../../shared/components/header/header.component";
import { SidebarComponent } from "../../../../shared/components/sidebar/sidebar.component";

@Component({
  selector: 'app-announcement-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatMenuModule,
    HeaderComponent,
    SidebarComponent
],
  templateUrl: './announcement-list.component.html',
  styleUrls: ['./announcement-list.component.scss']
})
export class AnnouncementListComponent implements OnInit {
  private announcementService = inject(AnnouncementManagementService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  // Signals
  announcements = this.announcementService.announcements;
  loading = this.announcementService.loading;

  // Pagination
  pageSize = signal(10);
  pageIndex = signal(0);
  totalElements = signal(0);

  // Table columns
  displayedColumns = ['type', 'title', 'priority', 'dates', 'status', 'actions'];

  ngOnInit(): void {
    this.loadAnnouncements();
  }

  loadAnnouncements(): void {
    this.announcementService.getAnnouncements(
      this.pageIndex(),
      this.pageSize(),
      'createdAt',
      'DESC'
    ).subscribe({
      next: (response) => {
        if (response.content!) {
          this.totalElements.set(response.totalElements);
        }
      },
      error: (error) => {
        this.notificationService.error('فشل في تحميل الإعلانات');
        console.error('Error loading announcements:', error);
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadAnnouncements();
  }

  getTypeLabel(type: AnnouncementType): string {
    return getAnnouncementTypeLabel(type);
  }

  getTypeColor(type: AnnouncementType): string {
    return getAnnouncementTypeColor(type);
  }

  getPriorityLabel(priority: AnnouncementPriority): string {
    const labels = {
      LOW: 'منخفض',
      MEDIUM: 'متوسط',
      HIGH: 'عالي',
      URGENT: 'عاجل'
    };
    return labels[priority];
  }

  getPriorityColor(priority: AnnouncementPriority): string {
    const colors = {
      LOW: '#9e9e9e',
      MEDIUM: '#2196f3',
      HIGH: '#ff9800',
      URGENT: '#f44336'
    };
    return colors[priority];
  }

  createAnnouncement(): void {
    this.router.navigate(['/admin/announcements/create']);
  }

  editAnnouncement(announcement: Announcement): void {
    this.router.navigate(['/admin/announcements/edit', announcement.id]);
  }

  toggleStatus(announcement: Announcement): void {
    const action = announcement.isActive ? 'deactivate' : 'activate';
    const service = announcement.isActive
      ? this.announcementService.deactivateAnnouncement(announcement.id)
      : this.announcementService.activateAnnouncement(announcement.id);

    service.subscribe({
      next: (response) => {
        if (response) {
          this.notificationService.success(
            announcement.isActive ? 'تم إلغاء تفعيل الإعلان' : 'تم تفعيل الإعلان'
          );
          this.loadAnnouncements();
        }
      },
      error: (error) => {
        this.notificationService.error('فشل في تغيير حالة الإعلان');
        console.error('Error toggling announcement status:', error);
      }
    });
  }

  deleteAnnouncement(announcement: Announcement): void {
    if (confirm(`هل أنت متأكد من حذف الإعلان "${announcement.title}"؟`)) {
      this.announcementService.deleteAnnouncement(announcement.id).subscribe({
        next: (response) => {
          if (response) {
            this.notificationService.success('تم حذف الإعلان بنجاح');
            this.loadAnnouncements();
          }
        },
        error: (error) => {
          this.notificationService.error('فشل في حذف الإعلان');
          console.error('Error deleting announcement:', error);
        }
      });
    }
  }
}
