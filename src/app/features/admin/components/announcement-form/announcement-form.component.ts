// ===================================================================
// src/app/features/admin/components/announcement-form/announcement-form.component.ts
// UPDATED - With Clinic and Doctor Dropdowns
// ===================================================================

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { AnnouncementManagementService } from '../../services/announcement-management.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ClinicService } from '../../../clinics/services/clinic.service';
import { UserService } from '../../../users/services/user.service';
import {
  CreateAnnouncementRequest,
  UpdateAnnouncementRequest
} from '../../models/announcement-management.model';
import { AnnouncementPriority, AnnouncementType } from './../../../../public/models/announcement.model';

import { Clinic } from '../../../clinics/models/clinic.model';
import { User } from '../../../users/models/user.model';
import { HeaderComponent } from "../../../../shared/components/header/header.component";
import { SidebarComponent } from "../../../../shared/components/sidebar/sidebar.component";

@Component({
  selector: 'app-announcement-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './announcement-form.component.html',
  styleUrls: ['./announcement-form.component.scss']
})
export class AnnouncementFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private announcementService = inject(AnnouncementManagementService);
  private notificationService = inject(NotificationService);
  private clinicService = inject(ClinicService);
  private userService = inject(UserService);

  announcementForm!: FormGroup;
  loading = signal(false);
  isEditMode = signal(false);
  announcementId: number | null = null;

  // Data signals
  clinics = signal<Clinic[]>([]);
  doctors = signal<User[]>([]);
  filteredDoctors = signal<User[]>([]);
  loadingClinics = signal(false);
  loadingDoctors = signal(false);

  // Enum options
  announcementTypes = Object.values(AnnouncementType);
  announcementPriorities = Object.values(AnnouncementPriority);

  typeLabels = {
    [AnnouncementType.DOCTOR_AVAILABLE]: 'طبيب متاح',
    [AnnouncementType.CLINIC_HOURS]: 'ساعات العمل',
    [AnnouncementType.SPECIAL_OFFER]: 'عرض خاص',
    [AnnouncementType.HEALTH_TIP]: 'نصيحة صحية',
    [AnnouncementType.EMERGENCY]: 'طوارئ',
    [AnnouncementType.GENERAL]: 'إعلان عام'
  };

  priorityLabels = {
    [AnnouncementPriority.LOW]: 'منخفض',
    [AnnouncementPriority.MEDIUM]: 'متوسط',
    [AnnouncementPriority.HIGH]: 'عالي',
    [AnnouncementPriority.URGENT]: 'عاجل'
  };

  // Computed properties
  selectedClinic = computed(() => {
    const clinicId = this.announcementForm?.get('clinicId')?.value;
    return this.clinics().find(c => c.id === clinicId);
  });

  isDoctorAvailableType = computed(() => {
    return this.announcementForm?.get('type')?.value === AnnouncementType.DOCTOR_AVAILABLE;
  });

  ngOnInit(): void {
    this.initForm();
    this.loadClinics();
    this.loadDoctors();
    this.checkEditMode();
    this.setupFormListeners();
  }

  private initForm(): void {
    this.announcementForm = this.fb.group({
      type: [AnnouncementType.GENERAL, Validators.required],
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
      priority: [AnnouncementPriority.MEDIUM, Validators.required],
      startDate: [new Date(), Validators.required],
      endDate: [null],
      isActive: [true],
      imageUrl: ['', Validators.maxLength(500)],
      actionUrl: ['', Validators.maxLength(500)],
      actionText: ['', Validators.maxLength(100)],
      clinicId: [null],
      doctorId: [null]
    });
  }

  // ... (keep all other code above unchanged)

  private setupFormListeners(): void {
    // Listen for clinic changes to filter doctors
    this.announcementForm.get('clinicId')?.valueChanges.subscribe(clinicId => {
      // Fixed: Reload doctors from API instead of filtering local array
      this.loadDoctorsByClinic(clinicId);
      // Reset doctor selection when clinic changes
      this.announcementForm.patchValue({ doctorId: null }, { emitEvent: false });
    });

    // Listen for type changes
    this.announcementForm.get('type')?.valueChanges.subscribe(type => {
      if (type === AnnouncementType.DOCTOR_AVAILABLE) {
        // Make clinic and doctor required for doctor availability announcements
        this.announcementForm.get('clinicId')?.setValidators(Validators.required);
        this.announcementForm.get('doctorId')?.setValidators(Validators.required);
      } else {
        // Make them optional for other types
        this.announcementForm.get('clinicId')?.clearValidators();
        this.announcementForm.get('doctorId')?.clearValidators();
      }
      this.announcementForm.get('clinicId')?.updateValueAndValidity();
      this.announcementForm.get('doctorId')?.updateValueAndValidity();
    });
  }

  private loadClinics(): void {
    this.loadingClinics.set(true);
    this.clinicService.getClinics().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.clinics.set(response.data);
        }
        this.loadingClinics.set(false);
      },
      error: (error) => {
        this.notificationService.error('فشل في تحميل قائمة العيادات');
        console.error('Error loading clinics:', error);
        this.loadingClinics.set(false);
      }
    });
  }

  private loadDoctors(): void {
    // Fixed: Load all doctors initially (without clinic filter)
    this.loadingDoctors.set(true);
    this.userService.getDoctors().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.doctors.set(response.data);
          // Fixed: Initialize filtered doctors with all doctors
          this.filteredDoctors.set(response.data);
        }
        this.loadingDoctors.set(false);
      },
      error: (error) => {
        this.notificationService.error('فشل في تحميل قائمة الأطباء');
        console.error('Error loading doctors:', error);
        this.loadingDoctors.set(false);
      }
    });
  }

  // Fixed: New method to load doctors by specific clinic from API
  private loadDoctorsByClinic(clinicId: number | null): void {
    if (clinicId) {
      // Fixed: Reload doctors from API with clinic filter
      this.loadingDoctors.set(true);
      this.userService.getDoctors(clinicId).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // Fixed: Update filtered doctors with clinic-specific doctors
            this.filteredDoctors.set(response.data);
          }
          this.loadingDoctors.set(false);
        },
        error: (error) => {
          this.notificationService.error('فشل في تحميل أطباء العيادة');
          console.error('Error loading clinic doctors:', error);
          // Fixed: Clear filtered doctors on error
          this.filteredDoctors.set([]);
          this.loadingDoctors.set(false);
        }
      });
    } else {
      // Fixed: If no clinic selected, show all doctors
      this.filteredDoctors.set(this.doctors());
    }
  }

  // Fixed: Remove old filterDoctorsByClinic method - no longer needed
  // The loadDoctorsByClinic method above replaces it

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.announcementId = parseInt(id);
      this.loadAnnouncement(this.announcementId);
    }
  }

  // ... (keep all other code below unchanged)

  private loadAnnouncement(id: number): void {
    this.loading.set(true);
    this.announcementService.getAnnouncementById(id).subscribe({
      next: (response) => {
        if (response) {
          const announcement = response;
          this.announcementForm.patchValue({
            type: announcement.type,
            title: announcement.title,
            message: announcement.message,
            priority: announcement.priority,
            startDate: new Date(announcement.startDate),
            endDate: announcement.endDate ? new Date(announcement.endDate) : null,
            isActive: announcement.isActive,
            imageUrl: announcement.imageUrl,
            actionUrl: announcement.actionUrl,
            actionText: announcement.actionText,
            clinicId: announcement.clinicId,
            doctorId: announcement.doctorId
          });
        }
        this.loading.set(false);
      },
      error: (error) => {
        this.notificationService.error('فشل في تحميل الإعلان');
        console.error('Error loading announcement:', error);
        this.loading.set(false);
        this.router.navigate(['/admin/announcements']);
      }
    });
  }

  onSubmit(): void {
    if (this.announcementForm.valid) {
      this.loading.set(true);

      const formValue = this.announcementForm.value;
      const request: CreateAnnouncementRequest | UpdateAnnouncementRequest = {
        ...formValue,
        startDate: this.formatDate(formValue.startDate),
        endDate: formValue.endDate ? this.formatDate(formValue.endDate) : undefined
      };

      const action = this.isEditMode()
        ? this.announcementService.updateAnnouncement(this.announcementId!, request as UpdateAnnouncementRequest)
        : this.announcementService.createAnnouncement(request as CreateAnnouncementRequest);

      action.subscribe({
        next: (response) => {
          if (response) {
            this.notificationService.success(
              this.isEditMode() ? 'تم تحديث الإعلان بنجاح' : 'تم إنشاء الإعلان بنجاح'
            );
            this.router.navigate(['/admin/announcements']);
          }
          this.loading.set(false);
        },
        error: (error) => {
          this.notificationService.error(
            this.isEditMode() ? 'فشل في تحديث الإعلان' : 'فشل في إنشاء الإعلان'
          );
          console.error('Error saving announcement:', error);
          this.loading.set(false);
        }
      });
    } else {
      this.notificationService.error('يرجى ملء جميع الحقول المطلوبة');
      this.announcementForm.markAllAsTouched();
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/announcements']);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Helper method to get doctor display name
  getDoctorDisplayName(doctor: User): string {
    return `${doctor.fullName}${doctor.specialization ? ` - ${doctor.specialization}` : ''}`;
  }

  get selectedDoctorName(): string | undefined {
    const doctorId = this.announcementForm.get('doctorId')?.value;
    const doctor = this.filteredDoctors().find(d => d.id === doctorId);
    return doctor?.fullName;
  }

  get selectedClinicName(): string | undefined {
    const clinicId = this.announcementForm.get('clinicId')?.value;
    const clinic = this.clinics().find(c => c.id === clinicId);
    return clinic?.name;
  }

  get selectedDoctorSpecialization(): string | undefined {
    const doctorId = this.announcementForm.get('doctorId')?.value;
    const doctor = this.filteredDoctors().find(d => d.id === doctorId);
    return doctor?.specialization;
  }
}
