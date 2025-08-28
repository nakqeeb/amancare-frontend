// ===================================================================
// src/app/features/dashboard/components/recent-activities/recent-activities.component.ts
// ===================================================================
import { Component, Input, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-recent-activities',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './recent-activities.component.html',
  styleUrl: './recent-activities.component.scss'
})

export class RecentActivitiesComponent implements OnInit {
  @Input() loading = false;

  private dashboardService = inject(DashboardService);

  activities = signal<any[]>([]);

  ngOnInit(): void {
    this.loadActivities();
  }

  private loadActivities(): void {
    this.dashboardService.getRecentActivities().subscribe(activities => {
      this.activities.set(activities);
    });
  }

  trackByActivity(index: number, activity: any): number {
    return activity.id;
  }
}
