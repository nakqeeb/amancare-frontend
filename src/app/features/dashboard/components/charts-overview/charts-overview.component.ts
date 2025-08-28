// ===================================================================
// src/app/features/dashboard/components/charts-overview/charts-overview.component.ts
// ===================================================================
import { Component, Input, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-charts-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    NgxChartsModule
  ],
  templateUrl: './charts-overview.component.html',
  styleUrl: './charts-overview.component.scss'
})

export class ChartsOverviewComponent implements OnInit {
  @Input() loading = false;

  private dashboardService = inject(DashboardService);

  // Chart data signals
  revenueData = signal<any[]>([{ name: 'الإيرادات', series: [] }]);
  appointmentsData = signal<any[]>([]);
  patientsData = signal<any[]>([]);

  // Chart configuration
  colorScheme = {
    domain: ['#4c51bf', '#48bb78', '#ed8936', '#4299e1', '#9f7aea']
  };

  curve = 'cardinal' as any;

  ngOnInit(): void {
    this.loadChartData();
  }

  private loadChartData(): void {
    // Load revenue data
    this.dashboardService.getChartData('revenue').subscribe(data => {
      this.revenueData.set([{
        name: 'الإيرادات',
        series: data
      }]);
    });

    // Load appointments data
    this.dashboardService.getChartData('appointments').subscribe(data => {
      this.appointmentsData.set(data);
    });

    // Load patients data
    this.dashboardService.getChartData('patients').subscribe(data => {
      this.patientsData.set(data);
    });
  }
}
