// ===================================================================
// src/app/features/dashboard/components/stats-cards/stats-cards.component.ts
// ===================================================================
import { Component, Input, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';

import { DashboardService } from '../../services/dashboard.service';

interface StatCard {
  title: string;
  value: number;
  icon: string;
  color: string;
  trend: number;
  route: string;
  loading?: boolean;
}

@Component({
  selector: 'app-stats-cards',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule
  ],
  templateUrl: './stats-cards.component.html',
  styleUrl: './stats-cards.component.scss'
})

export class StatsCardsComponent implements OnInit {
  @Input() loading = false;

  private dashboardService = inject(DashboardService);

  statsCards = signal<StatCard[]>([]);

  ngOnInit(): void {
    this.loadStats();
  }

  private loadStats(): void {
    this.dashboardService.getDashboardStats().subscribe(stats => {
      const cards: StatCard[] = [
        {
          title: 'إجمالي المرضى',
          value: stats.totalPatients,
          icon: 'people',
          color: 'primary',
          trend: 12.5,
          route: '/patients'
        },
        {
          title: 'مواعيد هذا الشهر',
          value: stats.totalAppointments,
          icon: 'event',
          color: 'info',
          trend: 8.3,
          route: '/appointments'
        },
        {
          title: 'الإيرادات الشهرية',
          value: stats.monthlyRevenue,
          icon: 'attach_money',
          color: 'success',
          trend: 15.2,
          route: '/reports/financial'
        },
        {
          title: 'المدفوعات المعلقة',
          value: stats.pendingPayments,
          icon: 'payment',
          color: 'warning',
          trend: -3.1,
          route: '/invoices'
        }
      ];

      this.statsCards.set(cards);
    });
  }

  formatNumber(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'م';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'ك';
    }
    return value.toLocaleString('ar-SA');
  }

  formatTrend(trend: number): string {
    return Math.abs(trend) + '%';
  }

  getTrendIcon(trend: number): string {
    return trend >= 0 ? 'trending_up' : 'trending_down';
  }

  getTrendClass(trend: number): string {
    return trend >= 0 ? 'positive' : 'negative';
  }
}
