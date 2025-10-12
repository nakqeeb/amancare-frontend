// ===================================================================
// Activity Feed Component - Displays Recent Activities
// src/app/shared/components/activity-feed/activity-feed.component.ts
// ===================================================================

import { Component, Input, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';

// Services & Models
import { ActivityService } from '../../../core/services/activity.service';
import {
  Activity,
  ActivityType,
  ActivityFilter,
  ActivityPriority,
  ACTIVITY_CONFIG
} from '../../models/activity.model';

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatDividerModule,
    MatMenuModule,
    MatBadgeModule
  ],
  templateUrl: './activity-feed.component.html',
  styleUrl: './activity-feed.component.scss'
})
export class ActivityFeedComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private activityService = inject(ActivityService);

  // Inputs
  @Input() limit: number = 10;
  @Input() showHeader: boolean = true;
  @Input() showFilters: boolean = false;
  @Input() compact: boolean = false;
  @Input() filter?: ActivityFilter;
  @Input() refreshInterval?: number; // in seconds

  // State
  activities = signal<Activity[]>([]);
  loading = signal(false);
  selectedFilter = signal<'all' | 'high' | 'today'>('all');

  // Computed values
  filteredActivities = computed(() => {
    const allActivities = this.activities();
    const filter = this.selectedFilter();

    switch (filter) {
      case 'high':
        return allActivities.filter(a =>
          a.priority === ActivityPriority.HIGH ||
          a.priority === ActivityPriority.CRITICAL
        );
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return allActivities.filter(a =>
          new Date(a.timestamp) >= today
        );
      default:
        return allActivities;
    }
  });

  hasNewActivities = computed(() => {
    const activities = this.activities();
    if (activities.length === 0) return false;

    // Check if any activity is less than 5 minutes old
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return activities.some(a => new Date(a.timestamp) > fiveMinutesAgo);
  });

  groupedActivities = computed(() => {
    const activities = this.filteredActivities();
    const groups: Map<string, Activity[]> = new Map();

    activities.forEach(activity => {
      const dateKey = this.getDateGroupKey(new Date(activity.timestamp));
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(activity);
    });

    return Array.from(groups.entries()).map(([date, activities]) => ({
      label: date,
      activities
    }));
  });

  ngOnInit(): void {
    this.loadActivities();

    // Auto-refresh if interval is set
    if (this.refreshInterval) {
      this.setupAutoRefresh();
    }

    // Subscribe to real-time activity updates
    this.activityService.activities$
      .pipe(takeUntil(this.destroy$))
      .subscribe(activities => {
        this.activities.set(activities.slice(0, this.limit));
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===================================================================
  // PUBLIC METHODS
  // ===================================================================

  loadActivities(): void {
    this.loading.set(true);

    const filter: ActivityFilter = {
      ...this.filter,
      limit: this.limit
    };

    this.activityService.getActivities(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (activities) => {
          this.activities.set(activities);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading activities:', error);
          this.loading.set(false);
        }
      });
  }

  refresh(): void {
    this.loadActivities();
  }

  clearAll(): void {
    this.activities.set([]);
  }

  setFilter(filter: 'all' | 'high' | 'today'): void {
    this.selectedFilter.set(filter);
  }

  getActivityIcon(activity: Activity): string {
    return activity.icon || ACTIVITY_CONFIG[activity.type].icon;
  }

  getActivityColor(activity: Activity): string {
    return activity.iconColor || ACTIVITY_CONFIG[activity.type].color;
  }

  getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return 'الآن';
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `قبل ${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`;
    }
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return `قبل ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`;
    }
    const days = Math.floor(seconds / 86400);
    if (days === 1) return 'أمس';
    if (days < 7) return `قبل ${days} أيام`;
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return `قبل ${weeks} ${weeks === 1 ? 'أسبوع' : 'أسابيع'}`;
    }
    const months = Math.floor(days / 30);
    return `قبل ${months} ${months === 1 ? 'شهر' : 'شهور'}`;
  }

  getFormattedTime(timestamp: Date): string {
    return new Date(timestamp).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getFormattedDate(timestamp: Date): string {
    return new Date(timestamp).toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getPriorityClass(priority: ActivityPriority): string {
    return `priority-${priority.toLowerCase()}`;
  }

  getPriorityLabel(priority: ActivityPriority): string {
    const labels: Record<ActivityPriority, string> = {
      [ActivityPriority.LOW]: 'عادي',
      [ActivityPriority.MEDIUM]: 'متوسط',
      [ActivityPriority.HIGH]: 'مهم',
      [ActivityPriority.CRITICAL]: 'حرج'
    };
    return labels[priority];
  }

  // ===================================================================
  // PRIVATE METHODS
  // ===================================================================

  private setupAutoRefresh(): void {
    if (!this.refreshInterval) return;

    // Create an interval that refreshes activities
    const intervalMs = this.refreshInterval * 1000;
    setInterval(() => {
      this.loadActivities();
    }, intervalMs);
  }

  private getDateGroupKey(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const activityDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (activityDate.getTime() === today.getTime()) {
      return 'اليوم';
    } else if (activityDate.getTime() === yesterday.getTime()) {
      return 'أمس';
    } else if (activityDate > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
      return 'هذا الأسبوع';
    } else if (activityDate > new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)) {
      return 'هذا الشهر';
    } else {
      return 'أقدم';
    }
  }
}
