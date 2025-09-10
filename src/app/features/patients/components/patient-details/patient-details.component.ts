// ===================================================================
// src/app/features/patients/components/patient-details/patient-details.component.ts
// Patient Profile/Details Component with Spring Boot Integration
// ===================================================================
import { Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { Subject, takeUntil, forkJoin } from 'rxjs';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

// Services & Models
import { PatientService } from '../../services/patient.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  Patient,
  calculateAge,
  getBloodTypeLabel,
  getGenderLabel
} from '../../models/patient.model';
import { UserRole } from '../../../users/models/user.model';
import { PermanentDeleteDialogComponent, PermanentDeleteDialogData } from '../permanent-delete-dialog/permanent-delete-dialog.component';

// Related services (if available)
// import { AppointmentService } from '../../../appointments/services/appointment.service';
// import { MedicalRecordService } from '../../../medical-records/services/medical-record.service';
// import { InvoiceService } from '../../../invoices/services/invoice.service';

interface PatientTab {
  label: string;
  icon: string;
  component?: string;
  count?: number;
}

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
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './patient-details.component.html',
  styleUrl: './patient-details.component.scss'
})
export class PatientDetailsComponent implements OnInit, OnDestroy {
  // Services
  private patientService = inject(PatientService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);

  // Destroy subject
  private destroy$ = new Subject<void>();

  // ===================================================================
  // STATE MANAGEMENT
  // ===================================================================

  // UI State
  loading = signal(false);
  patientId = signal<number | null>(null);
  patient = signal<Patient | null>(null);
  activeTabIndex = signal(0);

  // Data signals
  appointmentsCount = signal(0);
  medicalRecordsCount = signal(0);
  invoicesCount = signal(0);
  outstandingBalance = signal(0);

  // User permissions
  currentUser = this.authService.currentUser;

  // Tab configuration
  tabs: PatientTab[] = [
    {
      label: 'معلومات عامة',
      icon: 'person',
      component: 'overview'
    },
    {
      label: 'المواعيد',
      icon: 'event',
      component: 'appointments'
    },
    {
      label: 'السجلات الطبية',
      icon: 'local_hospital',
      component: 'medical-records'
    },
    {
      label: 'الفواتير',
      icon: 'receipt',
      component: 'invoices'
    }
  ];

  canPermanentlyDelete = computed(() => {
    const user = this.currentUser();
    const patient = this.patient();
    return !!(user && user.role === UserRole.SYSTEM_ADMIN && !patient?.isActive);
  });

  // ===================================================================
  // LIFECYCLE HOOKS
  // ===================================================================

  ngOnInit(): void {
    this.checkPatientId();
    this.loadPatientData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.patientService.clearSelectedPatient();
  }

  // ===================================================================
  // DATA LOADING
  // ===================================================================

  private checkPatientId(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.patientId.set(+id);
    } else {
      this.router.navigate(['/patients']);
    }
  }

  private loadPatientData(): void {
    const id = this.patientId();
    if (!id) return;

    this.loading.set(true);

    this.patientService.getPatientById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.patient.set(response.data!);
            this.updateTabCounts(response.data!);
          } else {
            this.notificationService.error('المريض غير موجود');
            this.router.navigate(['/patients']);
          }
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          this.notificationService.error('فشل في تحميل بيانات المريض');
          this.router.navigate(['/patients']);
        }
      });
  }

  private updateTabCounts(patient: Patient): void {
    // Update tab counts from patient data
    this.appointmentsCount.set(patient.appointmentsCount || 0);
    this.invoicesCount.set(patient.totalInvoices || 0);
    this.outstandingBalance.set(patient.outstandingBalance || 0);

    // Update tabs with counts
    this.tabs = this.tabs.map(tab => {
      switch (tab.component) {
        case 'appointments':
          return { ...tab, count: this.appointmentsCount() };
        case 'invoices':
          return { ...tab, count: this.invoicesCount() };
        default:
          return tab;
      }
    });
  }

  // ===================================================================
  // PATIENT ACTIONS
  // ===================================================================

  onEditPatient(): void {
    const patientId = this.patientId();
    if (patientId) {
      this.router.navigate(['/patients', patientId, 'edit']);
    }
  }

  onDeletePatient(): void {
    const patient = this.patient();
    if (!patient) return;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'تأكيد الحذف',
        message: `هل أنت متأكد من حذف المريض "${patient.fullName}"؟ سيتم إلغاء تفعيل المريض فقط.`,
        confirmText: 'حذف',
        cancelText: 'إلغاء',
        type: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.patientService.deletePatient(patient.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              if (response.success) {
                this.notificationService.success('تم حذف المريض بنجاح');
                this.router.navigate(['/patients']);
              }
            },
            error: (error) => {
              this.notificationService.error('فشل في حذف المريض');
            }
          });
      }
    });
  }

  onReactivatePatient(): void {
    const patient = this.patient();
    if (!patient) return;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'تأكيد إعادة التفعيل',
        message: `هل أنت متأكد من إعادة تفعيل المريض "${patient.fullName}"؟`,
        confirmText: 'إعادة تفعيل',
        cancelText: 'إلغاء',
        type: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.patientService.reactivatePatient(patient.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              if (response.success) {
                this.patient.set(response.data!);
                this.notificationService.success('تم إعادة تفعيل المريض بنجاح');
              }
            },
            error: (error) => {
              this.notificationService.error('فشل في إعادة تفعيل المريض');
            }
          });
      }
    });
  }

  /**
   * Permanently delete patient (SYSTEM_ADMIN only)
   */
  onPermanentlyDeletePatient(): void {
    const patient = this.patient();
    if (!patient) return;

    // First, get deletion preview to show what will be deleted
    this.loading.set(true);
    this.patientService.getPatientDeletionPreview(patient.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);

          if (!response.data?.canDelete && response.data?.blockers?.length) {
            // Show blockers if patient cannot be deleted
            this.dialog.open(ConfirmationDialogComponent, {
              width: '500px',
              data: {
                title: 'لا يمكن حذف المريض',
                message: `لا يمكن حذف المريض نهائياً للأسباب التالية:\n${response.data.blockers.join('\n')}`,
                confirmText: 'حسناً',
                hideCancel: true,
                type: 'error'
              }
            });
            return;
          }

          // Open permanent delete dialog
          this.openPermanentDeleteDialog(patient, response.data?.dataToDelete);
        },
        error: (error) => {
          this.loading.set(false);
          // If preview fails, still allow opening the dialog
          this.openPermanentDeleteDialog(patient);
        }
      });
  }

  private openPermanentDeleteDialog(patient: Patient, dataToDelete?: any): void {
    const dialogData: PermanentDeleteDialogData = {
      patient: patient,
      dataToDelete: dataToDelete
    };

    const dialogRef = this.dialog.open(PermanentDeleteDialogComponent, {
      width: '650px',
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed && result?.confirmationCode) {
        this.performPermanentDelete(patient.id, result.confirmationCode);
      }
    });
  }

  private performPermanentDelete(patientId: number, confirmationCode: string): void {
    this.loading.set(true);

    this.patientService.permanentlyDeletePatient(patientId, confirmationCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.loading.set(false);
            // Navigate to patients list after successful deletion
            this.router.navigate(['/patients']);
          }
        },
        error: (error) => {
          this.loading.set(false);
          // Error handling is done in the service
        }
      });
  }

  onCreateAppointment(): void {
    const patientId = this.patientId();
    if (patientId) {
      this.router.navigate(['/appointments/new'], {
        queryParams: { patientId }
      });
    }
  }

  onViewMedicalHistory(): void {
    const patientId = this.patientId();
    if (patientId) {
      this.router.navigate(['/medical-records'], {
        queryParams: { patientId }
      });
    }
  }

  onCreateInvoice(): void {
    const patientId = this.patientId();
    if (patientId) {
      this.router.navigate(['/invoices/new'], {
        queryParams: { patientId }
      });
    }
  }

  onPrintPatientCard(): void {
    // TODO: Implement patient card printing
    this.notificationService.info('طباعة بطاقة المريض قريباً...');
  }

  onExportPatientData(): void {
    // TODO: Implement patient data export
    this.notificationService.info('تصدير بيانات المريض قريباً...');
  }

  // ===================================================================
  // NAVIGATION & UI
  // ===================================================================

  onTabChange(index: number): void {
    this.activeTabIndex.set(index);
  }

  onBackToPatients(): void {
    this.router.navigate(['/patients']);
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================

  /**
   * Get patient age
   */
  getPatientAge(): string {
    const patient = this.patient();
    if (patient?.dateOfBirth) {
      return `${calculateAge(patient.dateOfBirth)} سنة`;
    }
    return '-';
  }

  /**
   * Get gender label
   */
  getGenderLabel(): string {
    const patient = this.patient();
    if (patient?.gender) {
      return getGenderLabel(patient.gender, 'ar');
    }
    return '-';
  }

  /**
   * Get blood type label
   */
  getBloodTypeLabel(): string {
    const patient = this.patient();
    if (patient?.bloodType) {
      return getBloodTypeLabel(patient.bloodType, 'ar');
    }
    return 'غير محدد';
  }

  /**
   * Get patient status
   */
  getPatientStatus(): { label: string; color: string; icon: string } {
    const patient = this.patient();
    if (patient?.isActive) {
      return {
        label: 'نشط',
        color: 'primary',
        icon: 'check_circle'
      };
    }
    return {
      label: 'غير نشط',
      color: 'warn',
      icon: 'cancel'
    };
  }

  /**
   * Format date
   */
  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA');
  }

  /**
   * Format phone number
   */
  formatPhone(phone: string): string {
    if (!phone) return '-';
    // Add formatting logic if needed
    return phone;
  }

  /**
   * Get initials for avatar
   */
  getInitials(): string {
    const patient = this.patient();
    if (patient) {
      const firstInitial = patient.firstName.charAt(0);
      const lastInitial = patient.lastName.charAt(0);
      return `${firstInitial}${lastInitial}`.toUpperCase();
    }
    return '';
  }

  /**
   * Check if user can edit patient
   */
  canEditPatient(): boolean {
    const user = this.currentUser();
    return !!(user && ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'].includes(user.role));
  }

  /**
   * Check if user can delete patient
   */
  canDeletePatient(): boolean {
    const user = this.currentUser();
    return !!(user && ['ADMIN', 'DOCTOR'].includes(user.role));
  }

  /**
   * Check if user can reactivate patient
   */
  canReactivatePatient(): boolean {
    const user = this.currentUser();
    return !!(user && ['ADMIN'].includes(user.role));
  }

  /**
   * Check if user can create appointments
   */
  canCreateAppointment(): boolean {
    const user = this.currentUser();
    return !!(user && ['ADMIN', 'DOCTOR', 'RECEPTIONIST'].includes(user.role));
  }

  /**
   * Check if user can view medical records
   */
  canViewMedicalRecords(): boolean {
    const user = this.currentUser();
    return !!(user && ['ADMIN', 'DOCTOR'].includes(user.role));
  }

  /**
   * Check if user can create invoices
   */
  canCreateInvoice(): boolean {
    const user = this.currentUser();
    return !!(user && ['ADMIN', 'RECEPTIONIST'].includes(user.role));
  }

  /**
   * Get last visit display text
   */
  getLastVisitText(): string {
    const patient = this.patient();
    if (patient?.lastVisit) {
      return this.formatDate(patient.lastVisit);
    }
    return 'لا توجد زيارات سابقة';
  }

  /**
   * Get outstanding balance color
   */
  // This method is no longer needed since we use CSS classes instead
  // getBalanceColor(): string {
  //   const balance = this.outstandingBalance();
  //   if (balance > 0) {
  //     return 'warn';
  //   }
  //   return 'primary';
  // }
}
