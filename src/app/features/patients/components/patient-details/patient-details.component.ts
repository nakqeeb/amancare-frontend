// ===================================================================
// src/app/features/patients/components/patient-details/patient-details.component.ts
// ===================================================================
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

// Services & Models
import { PatientService } from '../../services/patient.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Patient } from '../../models/patient.model';

@Component({
  selector: 'app-patient-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatMenuModule,
    MatChipsModule,
    MatBadgeModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './patient-details.component.html',
  styleUrl: './patient-details.component.scss'
})

export class PatientDetailsComponent implements OnInit {
  // Services
  private patientService = inject(PatientService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);

  // Signals
  patient = signal<Patient | null>(null);
  loading = signal(false);

  // Mock data
  mockAppointments = [
    {
      id: 1,
      date: '2024-08-20',
      time: '10:30',
      status: 'COMPLETED',
      type: 'استشارة عامة',
      doctor: 'أحمد محمد',
      notes: 'فحص دوري - كل شيء طبيعي'
    },
    {
      id: 2,
      date: '2024-08-15',
      time: '14:00',
      status: 'COMPLETED',
      type: 'متابعة',
      doctor: 'أحمد محمد',
      notes: 'متابعة ضغط الدم'
    },
    {
      id: 3,
      date: '2024-07-28',
      time: '09:15',
      status: 'COMPLETED',
      type: 'فحص شامل',
      doctor: 'سارة أحمد',
      notes: ''
    }
  ];

  bloodTypes = this.patientService.getBloodTypes();

  ngOnInit(): void {
    const patientId = this.route.snapshot.paramMap.get('id');
    if (patientId) {
      this.loadPatient(+patientId);
    }
  }

  private loadPatient(id: number): void {
    this.loading.set(true);

    this.patientService.getPatientById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.patient.set(response.data);
        }
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.notificationService.error('حدث خطأ في تحميل بيانات المريض');
      }
    });
  }

  onEditPatient(): void {
    const patient = this.patient();
    if (patient) {
      this.router.navigate(['/patients', patient.id, 'edit']);
    }
  }

  onDeletePatient(): void {
    const patient = this.patient();
    if (!patient) return;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'حذف المريض',
        message: `هل أنت متأكد من حذف المريض "${patient.fullName}"؟`,
        confirmText: 'حذف',
        cancelText: 'إلغاء',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.patientService.deletePatient(patient.id!).subscribe({
          next: () => {
            this.notificationService.success('تم حذف المريض بنجاح');
            this.router.navigate(['/patients']);
          },
          error: () => {
            this.notificationService.error('حدث خطأ في حذف المريض');
          }
        });
      }
    });
  }

  onRestorePatient(): void {
    const patient = this.patient();
    if (!patient) return;

    this.patientService.restorePatient(patient.id!).subscribe({
      next: () => {
        this.notificationService.success('تم إعادة تفعيل المريض بنجاح');
        this.loadPatient(patient.id!);
      },
      error: () => {
        this.notificationService.error('حدث خطأ في إعادة تفعيل المريض');
      }
    });
  }

  onPrintProfile(): void {
    window.print();
  }

  onExportProfile(): void {
    this.notificationService.info('جاري تصدير ملف المريض...');
    // Implement export functionality
  }

  callPatient(phoneNumber: string): void {
    window.location.href = `tel:${phoneNumber}`;
  }

  emailPatient(email: string): void {
    window.location.href = `mailto:${email}`;
  }

  // Helper methods
  getGenderText(gender?: string): string {
    return gender === 'MALE' ? 'ذكر' : gender === 'FEMALE' ? 'أنثى' : '-';
  }

  getBloodTypeLabel(bloodType?: string): string {
    if (!bloodType) return '-';
    const type = this.bloodTypes.find(bt => bt.value === bloodType);
    return type ? type.label : bloodType;
  }

  getAllergiesList(allergies: string): string[] {
    return allergies.split(/[,،\n]/).map(a => a.trim()).filter(a => a.length > 0);
  }

  getDiseasesList(diseases: string): string[] {
    return diseases.split(/[,،\n]/).map(d => d.trim()).filter(d => d.length > 0);
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

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
