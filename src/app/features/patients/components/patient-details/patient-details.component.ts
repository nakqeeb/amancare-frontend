// src/app/features/patients/components/patient-details/patient-details.component.ts

import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Angular Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTableModule } from '@angular/material/table';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import {
  DeleteConfirmationDialogComponent,
  DeleteDialogData
} from '../../../../shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';

// Services
import { PatientService } from '../../services/patient.service';
import { AppointmentService } from '../../../appointments/services/appointment.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';

// Models
import { calculateAge, getBloodTypeLabel, getGenderLabel, Patient } from '../../models/patient.model';
import {
  AppointmentSummaryResponse,
  AppointmentStatus,
  AppointmentType,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_TYPE_LABELS
} from '../../../appointments/models/appointment.model';

@Component({
  selector: 'app-patient-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDialogModule,
    MatTooltipModule,
    MatBadgeModule,
    MatTableModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './patient-details.component.html',
  styleUrl: './patient-details.component.scss'
})
export class PatientDetailsComponent implements OnInit, OnDestroy {
  // Services
  private readonly patientService = inject(PatientService);
  private readonly appointmentService = inject(AppointmentService);
  private readonly notificationService = inject(NotificationService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);

  // Destroy subject for cleanup
  private readonly destroy$ = new Subject<void>();

  // ===================================================================
  // STATE MANAGEMENT
  // ===================================================================

  // UI State
  loading = signal(false);
  loadingAppointments = signal(false);
  patientId = signal<number | null>(null);
  patient = signal<Patient | null>(null);
  activeTabIndex = signal(0);

  // Data signals
  upcomingAppointments = signal<AppointmentSummaryResponse[]>([]);
  appointmentsCount = computed(() => this.upcomingAppointments().length);
  medicalRecordsCount = signal(0);
  invoicesCount = signal(0);
  outstandingBalance = signal(0);

  // Table configuration
  appointmentsDisplayedColumns = ['appointmentDate', 'appointmentTime', 'doctor', 'type', 'status', 'actions'];

  // Labels
  appointmentStatusLabels = APPOINTMENT_STATUS_LABELS;
  appointmentTypeLabels = APPOINTMENT_TYPE_LABELS;

  // Current user
  currentUser = this.authService.currentUser;

  // ===================================================================
  // COMPUTED PERMISSIONS
  // ===================================================================

  canPermanentlyDelete = computed(() => {
    const user = this.currentUser();
    const patient = this.patient();
    return !!user && !!patient && user.role === 'SYSTEM_ADMIN' && !patient.active;
  });

  canReactivatePatient = computed(() => {
    const user = this.currentUser();
    const patient = this.patient();
    return !!user && !!patient && (user.role === 'ADMIN' || user.role === 'SYSTEM_ADMIN') && !patient.active;
  });

  canViewMedicalRecords = computed(() => {
    const user = this.currentUser();
    return user?.role === 'SYSTEM_ADMIN' || user?.role === 'ADMIN' || user?.role === 'DOCTOR';
  });

  canCreateInvoice = computed(() => {
    const user = this.currentUser();
    return user?.role === 'SYSTEM_ADMIN' || user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST';
  });

  canCreateAppointment(): boolean {
    const user = this.currentUser();
    return !!(user && ['SYSTEM_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST'].includes(user.role));
  }

  canDeletePatient(): boolean {
    const user = this.currentUser();
    return !!(user && ['SYSTEM_ADMIN', 'ADMIN', 'DOCTOR'].includes(user.role));
  }

  canEditPatient(): boolean {
    const user = this.currentUser();
    return !!(user && ['SYSTEM_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'].includes(user.role));
  }

  // ===================================================================
  // LIFECYCLE HOOKS
  // ===================================================================

  ngOnInit(): void {
    // Load patient from route params
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = +params['id'];
        if (id) {
          this.patientId.set(id);
          this.loadPatientDetails(id);
        }
      });

    // Handle tab navigation
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(queryParams => {
        const tab = queryParams['tab'];
        if (tab) {
          const tabIndex = ['overview', 'appointments', 'medical-records', 'invoices'].indexOf(tab);
          if (tabIndex !== -1) {
            this.activeTabIndex.set(tabIndex);
            if (tabIndex === 1) {
              this.loadUpcomingAppointments();
            }
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===================================================================
  // DATA LOADING
  // ===================================================================

  private loadPatientDetails(patientId: number): void {
    if (this.loading()) return;

    this.loading.set(true);
    this.patientService.getPatientById(patientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const patient = response.data!;
          this.patient.set(patient);
          this.loading.set(false);

          // Load appointments if on that tab
          if (this.activeTabIndex() === 1) {
            this.loadUpcomingAppointments();
          }
        },
        error: (error) => {
          console.error('Error loading patient:', error);
          this.notificationService.error('فشل في تحميل بيانات المريض');
          this.loading.set(false);
          this.router.navigate(['/patients']);
        }
      });
  }

  private loadUpcomingAppointments(): void {
    const patientId = this.patientId();
    if (!patientId || this.loadingAppointments()) return;

    this.loadingAppointments.set(true);
    this.appointmentService.getPatientUpcomingAppointments(patientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (appointments) => {
          const now = new Date();
          const futureAppointments = appointments
            .filter(appointment => {
              const appointmentDateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
              return appointmentDateTime > now;
            })
            .sort((a, b) => {
              const dateA = new Date(`${a.appointmentDate}T${a.appointmentTime}`);
              const dateB = new Date(`${b.appointmentDate}T${b.appointmentTime}`);
              return dateA.getTime() - dateB.getTime();
            });

          this.upcomingAppointments.set(futureAppointments);
          this.loadingAppointments.set(false);
        },
        error: (error) => {
          console.error('Error loading appointments:', error);
          if (error.status !== 404) {
            this.notificationService.error('فشل في تحميل المواعيد');
          }
          this.upcomingAppointments.set([]);
          this.loadingAppointments.set(false);
        }
      });
  }

  // ===================================================================
  // UI HELPERS
  // ===================================================================

  getPatientAge(): string {
    const patient = this.patient();
    if (patient?.dateOfBirth) {
      return `${calculateAge(patient.dateOfBirth)} سنة`;
    }
    return '-';
  }

  getGenderLabel(): string {
    const patient = this.patient();
    return patient?.gender ? getGenderLabel(patient.gender, 'ar') : '-';
  }

  getBloodTypeLabel(): string {
    const patient = this.patient();
    return patient?.bloodType ? getBloodTypeLabel(patient.bloodType, 'ar') : 'غير محدد';
  }

  getPatientStatus(): { label: string; color: string; icon: string } {
    const patient = this.patient();
    return patient?.active
      ? { label: 'نشط', color: 'primary', icon: 'check_circle' }
      : { label: 'غير نشط', color: 'warn', icon: 'cancel' };
  }

  getInitials(): string {
    const patient = this.patient();
    if (patient) {
      return `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`.toUpperCase();
    }
    return '';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ar-SA');
  }

  formatPhone(phone: string): string {
    return phone || '-';
  }

  getLastVisitText(): string {
    const patient = this.patient();
    return patient?.lastVisit ? this.formatDate(patient.lastVisit) : 'لا توجد زيارات سابقة';
  }

  formatAppointmentDate(date: string): string {
    const appointmentDate = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return appointmentDate.toLocaleDateString('ar-SA', options);
  }

  formatAppointmentTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'م' : 'ص';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  }

  getAppointmentTypeLabel(type: AppointmentType): string {
    return this.appointmentTypeLabels[type] || type;
  }

  getAppointmentStatusLabel(status: AppointmentStatus): string {
    return this.appointmentStatusLabels[status] || status;
  }

  getAppointmentStatusColor(status: AppointmentStatus): 'primary' | 'accent' | 'warn' | undefined {
    switch (status) {
      case AppointmentStatus.SCHEDULED:
        return 'primary';
      case AppointmentStatus.CONFIRMED:
      case AppointmentStatus.COMPLETED:
        return 'accent';
      case AppointmentStatus.IN_PROGRESS:
      case AppointmentStatus.CANCELLED:
      case AppointmentStatus.NO_SHOW:
        return 'warn';
      default:
        return undefined;
    }
  }

  // ===================================================================
  // ACTIONS
  // ===================================================================

  onBackToPatients(): void {
    this.router.navigate(['/patients']);
  }

  onEditPatient(): void {
    const patientId = this.patientId();
    if (patientId) {
      this.router.navigate(['/patients/edit', patientId]);
    }
  }

  onReactivatePatient(): void {
    const patient = this.patient();
    if (!patient) return;

    const confirmMessage = `هل أنت متأكد من إعادة تفعيل المريض ${patient.firstName} ${patient.lastName}؟`;

    if (confirm(confirmMessage)) {
      this.loading.set(true);
      this.patientService.reactivatePatient(patient.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.data) {
              this.patient.set(response.data);
              this.notificationService.success('تم تفعيل المريض بنجاح');
            }
            this.loading.set(false);
          },
          error: (error) => {
            console.error('Error reactivating patient:', error);
            this.notificationService.error('فشل في تفعيل المريض');
            this.loading.set(false);
          }
        });
    }
  }

  onDeletePatient(permanent: boolean = false): void {
    const patient = this.patient();
    if (!patient) return;

    // Prepare dialog data
    const dialogData: DeleteDialogData = {
      type: permanent ? 'permanent' : 'soft',
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientNumber: patient.patientNumber,
      stats: permanent ? {
        medicalRecords: this.medicalRecordsCount() || 16, // Use actual count or default
        appointments: this.appointmentsCount() || 8,
        documents: 4, // TODO: Get actual count
        invoices: this.invoicesCount() || 4
      } : undefined
    };

    // Open dialog
    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
      width: '600px',
      data: dialogData,
      disableClose: true,
      panelClass: 'delete-dialog-container'
    });

    // Handle dialog result
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.performDelete(patient.id, permanent);
      }
    });
  }

  private performDelete(patientId: number, permanent: boolean): void {
    this.loading.set(true);

    if (permanent) {
      this.patientService.permanentlyDeletePatient(patientId, 'DELETE-CONFIRM')
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.success('تم حذف المريض نهائياً');
            this.router.navigate(['/patients']);
          },
          error: (error) => {
            console.error('Error permanently deleting patient:', error);
            this.notificationService.error('فشل في حذف المريض نهائياً');
            this.loading.set(false);
          }
        });
    } else {
      this.patientService.deletePatient(patientId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.success('تم حذف المريض بنجاح');
            this.router.navigate(['/patients']);
          },
          error: (error) => {
            console.error('Error deleting patient:', error);
            this.notificationService.error('فشل في حذف المريض');
            this.loading.set(false);
          }
        });
    }
  }

  onCreateAppointment(): void {
    const patientId = this.patientId();
    if (patientId) {
      this.router.navigate(['/appointments/new'], { queryParams: { patientId } });
    }
  }

  onNewAppointment(): void {
    this.onCreateAppointment();
  }

  onViewMedicalHistory(): void {
    const patientId = this.patientId();
    if (patientId) {
      this.router.navigate(['/medical-records'], { queryParams: { patientId } });
    }
  }

  onCreateInvoice(): void {
    const patientId = this.patientId();
    if (patientId) {
      this.router.navigate(['/invoices/new'], { queryParams: { patientId } });
    }
  }

  onPrintPatientCard(): void {
    this.notificationService.info('طباعة بطاقة المريض - قيد التطوير');
  }

  onExportPatientData(): void {
    this.notificationService.info('تصدير بيانات المريض قريباً...');
  }

  onViewAppointment(appointmentId: number): void {
    this.router.navigate(['/appointments', appointmentId]);
  }

  onRescheduleAppointment(appointmentId: number): void {
    this.router.navigate(['/appointments/edit', appointmentId]);
  }

  onCancelAppointment(appointment: AppointmentSummaryResponse): void {
    const confirmMessage = `هل أنت متأكد من إلغاء موعد يوم ${this.formatAppointmentDate(appointment.appointmentDate)} الساعة ${this.formatAppointmentTime(appointment.appointmentTime)}؟`;

    if (confirm(confirmMessage)) {
      this.loadingAppointments.set(true);
      this.appointmentService.cancelAppointment(appointment.id, 'إلغاء من قبل المريض')
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.success('تم إلغاء الموعد بنجاح');
            this.loadUpcomingAppointments();
          },
          error: (error) => {
            console.error('Error canceling appointment:', error);
            this.notificationService.error('فشل في إلغاء الموعد');
            this.loadingAppointments.set(false);
          }
        });
    }
  }

  onTabChange(index: number): void {
    this.activeTabIndex.set(index);
    const tabs = ['overview', 'appointments', 'medical-records', 'invoices'];
    const tab = tabs[index];

    // Update URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });

    // Load data for specific tabs
    if (tab === 'appointments' && this.upcomingAppointments().length === 0 && !this.loadingAppointments()) {
      this.loadUpcomingAppointments();
    }
  }

  refreshAppointments(): void {
    this.loadUpcomingAppointments();
  }
}
