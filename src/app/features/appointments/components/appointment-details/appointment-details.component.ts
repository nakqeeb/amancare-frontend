// ===================================================================
// 2. APPOINTMENT DETAILS COMPONENT
// src/app/features/appointments/components/appointment-details/appointment-details.component.ts
// ===================================================================
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

// Services & Models
import { AppointmentService } from '../../services/appointment.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  Appointment,
  AppointmentStatus,
  AppointmentType
} from '../../models/appointment.model';

@Component({
  selector: 'app-appointment-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatMenuModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './appointment-details.component.html',
  styleUrl: './appointment-details.component.scss'
})
export class AppointmentDetailsComponent implements OnInit {
  // Services
  private appointmentService = inject(AppointmentService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);

  // Signals
  appointment = signal<Appointment | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadAppointment(+id);
    } else {
      this.router.navigate(['/appointments']);
    }
  }

  private loadAppointment(id: number): void {
    this.loading.set(true);
    this.appointmentService.getAppointmentById(id).subscribe({
      next: (appointment) => {
        this.appointment.set(appointment);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading appointment:', error);
        this.notificationService.error('حدث خطأ في تحميل بيانات الموعد');
        this.loading.set(false);
        this.router.navigate(['/appointments']);
      }
    });
  }

  onEdit(): void {
    if (this.appointment()?.id) {
      this.router.navigate(['/appointments', this.appointment()!.id, 'edit']);
    }
  }

  onConfirm(): void {
    if (!this.appointment()?.id) return;

    this.loading.set(true);
    this.appointmentService.updateAppointmentStatus(
      this.appointment()!.id!,
      AppointmentStatus.CONFIRMED
    ).subscribe({
      next: (updated) => {
        this.appointment.set(updated);
        this.notificationService.success('تم تأكيد الموعد بنجاح');
        this.loading.set(false);
      },
      error: () => {
        this.notificationService.error('حدث خطأ في تأكيد الموعد');
        this.loading.set(false);
      }
    });
  }

  onCheckIn(): void {
    if (!this.appointment()?.id) return;

    this.loading.set(true);
    this.appointmentService.updateAppointmentStatus(
      this.appointment()!.id!,
      AppointmentStatus.CHECKED_IN
    ).subscribe({
      next: (updated) => {
        this.appointment.set(updated);
        this.notificationService.success('تم تسجيل حضور المريض');
        this.loading.set(false);
      },
      error: () => {
        this.notificationService.error('حدث خطأ في تسجيل الحضور');
        this.loading.set(false);
      }
    });
  }

  onStartConsultation(): void {
    if (!this.appointment()?.id) return;

    this.loading.set(true);
    this.appointmentService.updateAppointmentStatus(
      this.appointment()!.id!,
      AppointmentStatus.IN_PROGRESS
    ).subscribe({
      next: (updated) => {
        this.appointment.set(updated);
        this.notificationService.success('تم بدء الاستشارة');
        // Navigate to medical record creation
        this.router.navigate(['/medical-records/new'], {
          queryParams: {
            appointmentId: this.appointment()!.id,
            patientId: this.appointment()!.patientId
          }
        });
        this.loading.set(false);
      },
      error: () => {
        this.notificationService.error('حدث خطأ في بدء الاستشارة');
        this.loading.set(false);
      }
    });
  }

  onComplete(): void {
    if (!this.appointment()?.id) return;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'إكمال الموعد',
        message: 'هل أنت متأكد من إكمال هذا الموعد؟',
        confirmText: 'إكمال',
        cancelText: 'إلغاء',
        type: 'success'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading.set(true);
        this.appointmentService.updateAppointmentStatus(
          this.appointment()!.id!,
          AppointmentStatus.COMPLETED
        ).subscribe({
          next: (updated) => {
            this.appointment.set(updated);
            this.notificationService.success('تم إكمال الموعد بنجاح');
            this.loading.set(false);
          },
          error: () => {
            this.notificationService.error('حدث خطأ في إكمال الموعد');
            this.loading.set(false);
          }
        });
      }
    });
  }

  onCancel(): void {
    if (!this.appointment()?.id) return;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'إلغاء الموعد',
        message: 'هل أنت متأكد من إلغاء هذا الموعد؟',
        confirmText: 'إلغاء الموعد',
        cancelText: 'رجوع',
        type: 'warning'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading.set(true);
        this.appointmentService.cancelAppointment(this.appointment()!.id!).subscribe({
          next: () => {
            this.notificationService.success('تم إلغاء الموعد');
            this.router.navigate(['/appointments']);
            this.loading.set(false);
          },
          error: () => {
            this.notificationService.error('حدث خطأ في إلغاء الموعد');
            this.loading.set(false);
          }
        });
      }
    });
  }

  onReschedule(): void {
    // Open reschedule dialog
    this.notificationService.info('سيتم فتح نافذة إعادة الجدولة');
  }

  onSendReminder(): void {
    if (!this.appointment()?.id) return;

    this.loading.set(true);
    this.appointmentService.sendAppointmentReminder(this.appointment()!.id!).subscribe({
      next: () => {
        this.notificationService.success('تم إرسال التذكير بنجاح');
        this.loading.set(false);
      },
      error: () => {
        this.notificationService.error('حدث خطأ في إرسال التذكير');
        this.loading.set(false);
      }
    });
  }

  onPrint(): void {
    window.print();
  }

  onCreateInvoice(): void {
    if (this.appointment()) {
      this.router.navigate(['/invoices/new'], {
        queryParams: {
          appointmentId: this.appointment()!.id,
          patientId: this.appointment()!.patientId
        }
      });
    }
  }

  onViewPatient(): void {
    if (this.appointment()?.patientId) {
      this.router.navigate(['/patients', this.appointment()!.patientId]);
    }
  }

  // Helper methods
  getStatusLabel(status: AppointmentStatus): string {
    const labels: Record<AppointmentStatus, string> = {
      [AppointmentStatus.SCHEDULED]: 'مجدول',
      [AppointmentStatus.CONFIRMED]: 'مؤكد',
      [AppointmentStatus.CHECKED_IN]: 'تم تسجيل الحضور',
      [AppointmentStatus.IN_PROGRESS]: 'جاري',
      [AppointmentStatus.COMPLETED]: 'مكتمل',
      [AppointmentStatus.CANCELLED]: 'ملغي',
      [AppointmentStatus.NO_SHOW]: 'لم يحضر',
      [AppointmentStatus.RESCHEDULED]: 'تم إعادة الجدولة'
    };
    return labels[status] || status;
  }

  getStatusClass(status: AppointmentStatus): string {
    const classes: Record<AppointmentStatus, string> = {
      [AppointmentStatus.SCHEDULED]: 'status-scheduled',
      [AppointmentStatus.CONFIRMED]: 'status-confirmed',
      [AppointmentStatus.CHECKED_IN]: 'status-checked-in',
      [AppointmentStatus.IN_PROGRESS]: 'status-in-progress',
      [AppointmentStatus.COMPLETED]: 'status-completed',
      [AppointmentStatus.CANCELLED]: 'status-cancelled',
      [AppointmentStatus.NO_SHOW]: 'status-no-show',
      [AppointmentStatus.RESCHEDULED]: 'status-rescheduled'
    };
    return classes[status] || '';
  }

  getTypeLabel(type: AppointmentType): string {
    const labels: Record<AppointmentType, string> = {
      [AppointmentType.CONSULTATION]: 'استشارة',
      [AppointmentType.FOLLOW_UP]: 'متابعة',
      [AppointmentType.EMERGENCY]: 'طوارئ',
      [AppointmentType.ROUTINE_CHECK]: 'فحص دوري',
      [AppointmentType.VACCINATION]: 'تطعيم',
      [AppointmentType.LAB_TEST]: 'فحص مخبري'
    };
    return labels[type] || type;
  }

  getTypeIcon(type: AppointmentType): string {
    const icons: Record<AppointmentType, string> = {
      [AppointmentType.CONSULTATION]: 'medical_services',
      [AppointmentType.FOLLOW_UP]: 'update',
      [AppointmentType.EMERGENCY]: 'emergency',
      [AppointmentType.ROUTINE_CHECK]: 'fact_check',
      [AppointmentType.VACCINATION]: 'vaccines',
      [AppointmentType.LAB_TEST]: 'biotech'
    };
    return icons[type] || 'event';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'مساءً' : 'صباحاً';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  }

  canEdit(): boolean {
    const status = this.appointment()?.status;
    return status === AppointmentStatus.SCHEDULED ||
      status === AppointmentStatus.CONFIRMED;
  }

  canConfirm(): boolean {
    return this.appointment()?.status === AppointmentStatus.SCHEDULED;
  }

  canCheckIn(): boolean {
    return this.appointment()?.status === AppointmentStatus.CONFIRMED;
  }

  canStartConsultation(): boolean {
    return this.appointment()?.status === AppointmentStatus.CHECKED_IN;
  }

  canComplete(): boolean {
    return this.appointment()?.status === AppointmentStatus.IN_PROGRESS;
  }

  canCancel(): boolean {
    const status = this.appointment()?.status;
    return status !== AppointmentStatus.CANCELLED &&
      status !== AppointmentStatus.COMPLETED;
  }
}
