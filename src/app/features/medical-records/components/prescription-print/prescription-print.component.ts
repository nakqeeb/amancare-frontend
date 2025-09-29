// ===================================================================
// src/app/features/medical-records/components/prescription-print/prescription-print.component.ts
// Prescription Print Component - Print view for prescriptions
// ===================================================================

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';

import { MedicalRecordService } from '../../services/medical-record.service';
import { PatientService } from '../../../patients/services/patient.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

import { MedicalRecord, Prescription, MedicationRoute } from '../../models/medical-record.model';
import { Patient } from '../../../patients/models/patient.model';

@Component({
  selector: 'app-prescription-print',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule
  ],
  templateUrl: './prescription-print.component.html',
  styleUrl: './prescription-print.component.scss'
})
export class PrescriptionPrintComponent implements OnInit {
  private medicalRecordService = inject(MedicalRecordService);
  private patientService = inject(PatientService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // State
  loading = signal(false);
  medicalRecord = signal<MedicalRecord | null>(null);
  patient = signal<Patient | null>(null);
  printMode = signal(false);

  ngOnInit(): void {
    const recordId = this.route.snapshot.paramMap.get('id');
    if (recordId) {
      this.loadData(parseInt(recordId));
    } else {
      this.router.navigate(['/medical-records']);
    }
  }

  private loadData(recordId: number): void {
    this.loading.set(true);

    // Load medical record
    this.medicalRecordService.getMedicalRecordById(recordId).subscribe({
      next: (record) => {
        this.medicalRecord.set(record);

        // Load patient data
        if (record.patientId) {
          this.loadPatient(record.patientId);
        }
      },
      error: () => {
        this.notificationService.error('خطأ في تحميل البيانات');
        this.router.navigate(['/medical-records']);
      }
    });
  }

  private loadPatient(patientId: number): void {
    this.patientService.getPatientById(patientId).subscribe({
      next: (response) => {
        this.patient.set(response.data!);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  calculateAge(): number {
    const patient = this.patient();
    if (!patient?.dateOfBirth) return 0;

    const today = new Date();
    const birthDate = new Date(patient.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  getRouteLabel(route: MedicationRoute): string {
    const labels: Record<MedicationRoute, string> = {
      [MedicationRoute.ORAL]: 'عن طريق الفم',
      [MedicationRoute.TOPICAL]: 'موضعي',
      [MedicationRoute.INJECTION]: 'حقن',
      [MedicationRoute.INTRAVENOUS]: 'وريدي',
      [MedicationRoute.INTRAMUSCULAR]: 'عضلي',
      [MedicationRoute.SUBCUTANEOUS]: 'تحت الجلد',
      [MedicationRoute.INHALATION]: 'استنشاق',
      [MedicationRoute.RECTAL]: 'شرجي',
      [MedicationRoute.SUBLINGUAL]: 'تحت اللسان',
      [MedicationRoute.NASAL]: 'أنفي',
      [MedicationRoute.OPHTHALMIC]: 'عيني',
      [MedicationRoute.OTIC]: 'أذني',
    };

    return labels[route] || route;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-SA');
  }

  getCurrentYear(): number {
    return new Date().getFullYear();
  }

  getCurrentDateTime(): string {
    return new Date().toLocaleString('ar-SA');
  }

  onPrint(): void {
    this.printMode.set(true);
    setTimeout(() => {
      window.print();
      this.printMode.set(false);
    }, 100);
  }

  onDownloadPDF(): void {
    const recordId = this.medicalRecord()?.id;
    if (recordId) {
      this.medicalRecordService.exportMedicalRecordAsPdf(recordId).subscribe({
        next: (blob) => {
          const filename = `prescription-${recordId}.pdf`;
          this.medicalRecordService.downloadPdf(blob, filename);
        }
      });
    }
  }

  onBack(): void {
    const recordId = this.route.snapshot.paramMap.get('id');
    if (recordId) {
      this.router.navigate(['/medical-records', recordId]);
    } else {
      this.router.navigate(['/medical-records']);
    }
  }
}
