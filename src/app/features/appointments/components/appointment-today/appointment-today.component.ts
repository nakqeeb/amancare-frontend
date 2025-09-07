// src/app/features/appointments/components/appointment-today/appointment-today.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatBadgeModule } from '@angular/material/badge';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

// Services & Models
import { AppointmentService } from '../../services/appointment.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  AppointmentSummaryResponse,
  AppointmentStatus,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_TYPE_LABELS,
  APPOINTMENT_STATUS_COLORS
} from '../../models/appointment.model';

@Component({
  selector: 'app-appointment-today',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatMenuModule,
    MatTooltipModule,
    MatDialogModule,
    MatBadgeModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './appointment-today.component.html',
  styleUrl: './appointment-today.component.scss'
})
export class AppointmentTodayComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly notificationService = inject(NotificationService);

  todayDate = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Component state
  todayAppointments = signal<AppointmentSummaryResponse[]>([]);
  loading = signal(false);
  lastRefreshTime = signal<Date>(new Date());

  // Group appointments by status
  groupedAppointments = signal<{
    scheduled: AppointmentSummaryResponse[];
    confirmed: AppointmentSummaryResponse[];
    inProgress: AppointmentSummaryResponse[];
    completed: AppointmentSummaryResponse[];
    cancelled: AppointmentSummaryResponse[];
    noShow: AppointmentSummaryResponse[];
  }>({
    scheduled: [],
    confirmed: [],
    inProgress: [],
    completed: [],
    cancelled: [],
    noShow: []
  });

  // Labels
  statusLabels = APPOINTMENT_STATUS_LABELS;
  typeLabels = APPOINTMENT_TYPE_LABELS;
  statusColors = APPOINTMENT_STATUS_COLORS;

  // Statistics
  totalCount = signal(0);
  completedCount = signal(0);
  pendingCount = signal(0);
  cancelledCount = signal(0);

  ngOnInit(): void {
    this.loadTodayAppointments();
    // Auto-refresh every 5 minutes
    setInterval(() => {
      this.loadTodayAppointments();
    }, 5 * 60 * 1000);
  }

  loadTodayAppointments(): void {
    this.loading.set(true);
    this.appointmentService.getTodayAppointments().subscribe({
      next: (appointments) => {
        console.log('loadTodayAppointments: ', appointments);
        this.todayAppointments.set(appointments);
        this.groupAppointmentsByStatus(appointments);
        this.calculateStatistics(appointments);
        this.lastRefreshTime.set(new Date());
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading today appointments:', error);
        this.notificationService.error('فشل في تحميل مواعيد اليوم');
        this.loading.set(false);
      }
    });
  }

  private groupAppointmentsByStatus(appointments: AppointmentSummaryResponse[]): void {
    const grouped = {
      scheduled: [] as AppointmentSummaryResponse[],
      confirmed: [] as AppointmentSummaryResponse[],
      inProgress: [] as AppointmentSummaryResponse[],
      completed: [] as AppointmentSummaryResponse[],
      cancelled: [] as AppointmentSummaryResponse[],
      noShow: [] as AppointmentSummaryResponse[]
    };

    appointments.forEach(appointment => {
      switch (appointment.status) {
        case AppointmentStatus.SCHEDULED:
          grouped.scheduled.push(appointment);
          break;
        case AppointmentStatus.CONFIRMED:
          grouped.confirmed.push(appointment);
          break;
        case AppointmentStatus.IN_PROGRESS:
          grouped.inProgress.push(appointment);
          break;
        case AppointmentStatus.COMPLETED:
          grouped.completed.push(appointment);
          break;
        case AppointmentStatus.CANCELLED:
          grouped.cancelled.push(appointment);
          break;
        case AppointmentStatus.NO_SHOW:
          grouped.noShow.push(appointment);
          break;
      }
    });

    // Sort each group by time
    Object.keys(grouped).forEach(key => {
      grouped[key as keyof typeof grouped].sort((a, b) =>
        a.appointmentTime.localeCompare(b.appointmentTime)
      );
    });

    this.groupedAppointments.set(grouped);
  }

  private calculateStatistics(appointments: AppointmentSummaryResponse[]): void {
    this.totalCount.set(appointments.length);
    this.completedCount.set(
      appointments.filter(a => a.status === AppointmentStatus.COMPLETED).length
    );
    this.pendingCount.set(
      appointments.filter(a =>
        a.status === AppointmentStatus.SCHEDULED ||
        a.status === AppointmentStatus.CONFIRMED
      ).length
    );
    this.cancelledCount.set(
      appointments.filter(a =>
        a.status === AppointmentStatus.CANCELLED ||
        a.status === AppointmentStatus.NO_SHOW
      ).length
    );
  }

  refresh(): void {
    this.loadTodayAppointments();
    this.notificationService.success('تم تحديث المواعيد');
  }

  viewAppointment(id: number): void {
    this.router.navigate(['/appointments', id]);
  }

  startAppointment(id: number): void {
    this.updateAppointmentStatus(id, AppointmentStatus.IN_PROGRESS);
  }

  completeAppointment(id: number): void {
    this.updateAppointmentStatus(id, AppointmentStatus.COMPLETED);
  }

  confirmAppointment(id: number): void {
    this.updateAppointmentStatus(id, AppointmentStatus.CONFIRMED);
  }

  markAsNoShow(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'تأكيد عدم الحضور',
        message: 'هل تريد تحديد هذا الموعد كـ "لم يحضر"؟',
        type: 'warning'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateAppointmentStatus(id, AppointmentStatus.NO_SHOW);
      }
    });
  }

  private updateAppointmentStatus(id: number, status: AppointmentStatus): void {
    this.appointmentService.updateAppointmentStatus(id, status).subscribe({
      next: () => {
        this.notificationService.success('تم تحديث حالة الموعد');
        this.loadTodayAppointments();
      },
      error: (error) => {
        console.error('Error updating appointment status:', error);
        this.notificationService.error('فشل في تحديث حالة الموعد');
      }
    });
  }

  getStatusColor(status: AppointmentStatus): string {
    return this.statusColors[status] || 'default';
  }

  formatLastRefreshTime(): string {
    const time = this.lastRefreshTime();
    return time.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
