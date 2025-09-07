// ===================================================================
// src/app/features/dashboard/components/main-dashboard/main-dashboard.component.ts
// ===================================================================
import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// Dashboard Components
import { StatsCardsComponent } from '../stats-cards/stats-cards.component';
import { RecentActivitiesComponent } from '../recent-activities/recent-activities.component';
import { QuickActionsComponent } from '../quick-actions/quick-actions.component';
import { ChartsOverviewComponent } from '../charts-overview/charts-overview.component';

// Services
import { AuthService } from '../../../../core/services/auth.service';
import { MatDividerModule } from '@angular/material/divider';
import { DashboardService } from '../../services/dashboard.service';
import { AppointmentService } from '../../../appointments/services/appointment.service';
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_TYPE_LABELS, AppointmentSummaryResponse } from '../../../appointments/models/appointment.model';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-main-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatGridListModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressBarModule,
    MatTabsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    HeaderComponent,
    SidebarComponent,
    StatsCardsComponent,
    RecentActivitiesComponent,
    QuickActionsComponent,
    ChartsOverviewComponent
  ],
  templateUrl: './main-dashboard.component.html',
  styleUrl: './main-dashboard.component.scss'
})

export class MainDashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);

  private readonly appointmentService = inject(AppointmentService);
  private router = inject(Router);

  // Add these signals
  todayAppointments = signal<AppointmentSummaryResponse[]>([]);
  loadingAppointments = signal(false);

  // Labels
  statusLabels = APPOINTMENT_STATUS_LABELS;
  typeLabels = APPOINTMENT_TYPE_LABELS;

  // Signals
  currentUser = this.authService.currentUser;
  loading = signal(false);
  currentTime = signal('');
  todaysAppointments = signal<any[]>([]);

  private timeInterval?: number;

  ngOnInit(): void {
    this.loadDashboardData();
    this.startClock();
    // this.loadTodaysAppointments();
    this.loadTodayAppointments();
  }

  ngOnDestroy(): void {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  private loadDashboardData(): void {
    this.loading.set(true);

    // Simulate loading dashboard data
    setTimeout(() => {
      this.loading.set(false);
    }, 1500);
  }

  private startClock(): void {
    this.updateTime();
    this.timeInterval = window.setInterval(() => {
      this.updateTime();
    }, 1000);
  }

  private updateTime(): void {
    const now = new Date();
    this.currentTime.set(now.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }));
  }

  // private loadTodaysAppointments(): void {
  //   // Mock data for today's appointments
  //   const mockAppointments = [
  //     {
  //       id: 1,
  //       time: '09:00',
  //       patientName: 'أحمد محمد علي',
  //       type: 'استشارة',
  //       status: 'CONFIRMED'
  //     },
  //     {
  //       id: 2,
  //       time: '10:30',
  //       patientName: 'فاطمة أحمد',
  //       type: 'متابعة',
  //       status: 'SCHEDULED'
  //     },
  //     {
  //       id: 3,
  //       time: '11:00',
  //       patientName: 'محمد حسن',
  //       type: 'فحص دوري',
  //       status: 'IN_PROGRESS'
  //     },
  //     {
  //       id: 4,
  //       time: '14:00',
  //       patientName: 'سارة علي',
  //       type: 'استشارة',
  //       status: 'SCHEDULED'
  //     },
  //     {
  //       id: 5,
  //       time: '15:30',
  //       patientName: 'عبدالله محمد',
  //       type: 'متابعة',
  //       status: 'CONFIRMED'
  //     }
  //   ];

  //   this.todaysAppointments.set(mockAppointments);
  // }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getRoleDisplayName(role?: string): string {
    const roleNames: { [key: string]: string } = {
      'SYSTEM_ADMIN': 'مدير النظام',
      'ADMIN': 'مدير العيادة',
      'DOCTOR': 'طبيب',
      'NURSE': 'ممرض/ممرضة',
      'RECEPTIONIST': 'موظف استقبال'
    };

    return roleNames[role || ''] || 'مستخدم';
  }

  getAppointmentStatusText(status: string): string {
    const statusText: { [key: string]: string } = {
      'SCHEDULED': 'مجدول',
      'CONFIRMED': 'مؤكد',
      'IN_PROGRESS': 'جاري',
      'COMPLETED': 'مكتمل',
      'CANCELLED': 'ملغي',
      'NO_SHOW': 'لم يحضر'
    };

    return statusText[status] || status;
  }

  private loadTodayAppointments(): void {
    this.loadingAppointments.set(true);
    this.appointmentService.getTodayAppointments().subscribe({
      next: (appointments) => {
        this.todayAppointments.set(appointments);
        this.loadingAppointments.set(false);
      },
      error: (error) => {
        console.error('Error loading today appointments:', error);
        this.loadingAppointments.set(false);
      }
    });
  }

  refreshTodayAppointments(): void {
    this.loadTodayAppointments();
  }

  navigateToAppointment(appointmentId: number): void {
    this.router.navigate(['/appointments', appointmentId]);
  }

  navigateToAllTodayAppointments(): void {
    this.router.navigate(['/appointments/today']);
  }
}
