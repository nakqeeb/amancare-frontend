// ===================================================================
// src/app/features/schedules/components/unavailability-form/unavailability-form.component.ts
// Unavailability Form Component - Standalone with new control flow syntax
// ===================================================================
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Observable, startWith, map } from 'rxjs';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// Services & Models
import { ScheduleService } from '../../services/schedule.service';
import { UserService } from '../../../users/services/user.service';
import { AuthService, User } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  CreateUnavailabilityRequest,
  UnavailabilityType,
  UNAVAILABILITY_TYPE_ARABIC
} from '../../models/schedule.model';

interface Doctor {
  id: number;
  fullName: string;
  specialization?: string;
}

@Component({
  selector: 'app-unavailability-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatAutocompleteModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './unavailability-form.component.html',
  styleUrl: './unavailability-form.component.scss'
})
export class UnavailabilityFormComponent implements OnInit {
  readonly scheduleService = inject(ScheduleService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  // Component state
  public readonly isEditMode = signal(false);
  public readonly unavailabilityId = signal<number | null>(null);
  public readonly preselectedDoctorId = signal<number | null>(null);
  public readonly selectedDoctor = signal<Doctor | null>(null);

  // Available doctors
  public readonly doctors = signal<Doctor[]>([]);

  // Form
  public unavailabilityForm = this.fb.group({
    doctorSearch: [''],
    doctorId: [null as number | null, Validators.required],
    startDate: [null as Date | null, Validators.required],
    endDate: [null as Date | null, Validators.required],
    isAllDay: [true],
    startTime: [''],
    endTime: [''],
    unavailabilityType: [UnavailabilityType.VACATION, Validators.required],
    reason: ['', [Validators.required, Validators.maxLength(200)]],
    notes: ['', Validators.maxLength(500)]
  });

  // Available options
  public unavailabilityTypes = Object.entries(UNAVAILABILITY_TYPE_ARABIC).map(([value, label]) => ({
    value: value as UnavailabilityType,
    label
  }));

  // Filtered doctors for autocomplete
  public filteredDoctors$!: Observable<Doctor[]>;

  // Date constraints
  public minDate = new Date();

  ngOnInit(): void {
    this.checkEditMode();
    this.checkPreselectedDoctor();
    this.loadDoctors();
    this.setupAutocomplete();
    this.setupFormValidation();
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('unavailabilityId');
    if (id) {
      this.isEditMode.set(true);
      this.unavailabilityId.set(Number(id));
      this.loadUnavailabilityForEdit(Number(id));
    }
  }

  private checkPreselectedDoctor(): void {
    const doctorId = this.route.snapshot.paramMap.get('doctorId') ||
      this.route.snapshot.queryParamMap.get('doctorId');

    if (doctorId) {
      this.preselectedDoctorId.set(Number(doctorId));
      this.unavailabilityForm.get('doctorId')?.setValue(Number(doctorId));
    }
  }

  private loadDoctors(): void {
    this.userService.getDoctors().subscribe({
      next: (doctors) => {
        const doctorList = doctors.map(d => ({
          id: d.id as number,
          fullName: d.fullName as string,
          specialization: d.specialization
        }));

        this.doctors.set(doctorList);

        // Set preselected doctor if available
        const preselectedId = this.preselectedDoctorId();
        if (preselectedId) {
          const preselectedDoctor = doctorList.find(d => d.id === preselectedId);
          if (preselectedDoctor) {
            this.selectedDoctor.set(preselectedDoctor);
          }
        }
      },
      error: (error) => {
        console.error('Error loading doctors:', error);
        this.notificationService.error('فشل في تحميل قائمة الأطباء');
      }
    });
  }

  private setupAutocomplete(): void {
    this.filteredDoctors$ = this.unavailabilityForm.get('doctorSearch')!.valueChanges.pipe(
      startWith(''),
      map(value => {
        if (typeof value === 'string') {
          return this.filterDoctors(value);
        }
        return this.doctors();
      })
    );
  }

  private filterDoctors(value: string): Doctor[] {
    if (!value) return this.doctors();

    const filterValue = value.toLowerCase();
    return this.doctors().filter(doctor =>
      doctor.fullName.toLowerCase().includes(filterValue) ||
      doctor.specialization?.toLowerCase().includes(filterValue)
    );
  }

  private setupFormValidation(): void {
    // Watch isAllDay changes
    this.unavailabilityForm.get('isAllDay')?.valueChanges.subscribe(isAllDay => {
      const startTime = this.unavailabilityForm.get('startTime');
      const endTime = this.unavailabilityForm.get('endTime');

      if (isAllDay) {
        startTime?.clearValidators();
        endTime?.clearValidators();
        startTime?.setValue('');
        endTime?.setValue('');
      } else {
        startTime?.setValidators([Validators.required]);
        endTime?.setValidators([Validators.required]);
      }

      startTime?.updateValueAndValidity();
      endTime?.updateValueAndValidity();
    });
  }

  private loadUnavailabilityForEdit(id: number): void {
    // Implementation would load existing unavailability data
    // For now, this is a placeholder
    this.notificationService.info('تحميل بيانات فترة عدم التوفر للتعديل...');
  }

  public displayDoctorFn = (doctor: Doctor): string => {
    return doctor ? doctor.fullName : '';
  };

  public onDoctorSelected(event: any): void {
    const doctor = event.option.value as Doctor;
    this.selectedDoctor.set(doctor);
    this.unavailabilityForm.get('doctorId')?.setValue(doctor.id);
  }

  public selectedPeriodDuration(): number {
    const startDate = this.unavailabilityForm.get('startDate')?.value;
    const endDate = this.unavailabilityForm.get('endDate')?.value;

    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return diffDays;
  }

  public selectedTimeDuration(): number {
    if (this.unavailabilityForm.get('isAllDay')?.value) return 0;

    const startTime = this.unavailabilityForm.get('startTime')?.value;
    const endTime = this.unavailabilityForm.get('endTime')?.value;

    if (!startTime || !endTime) return 0;

    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    const diffMinutes = end - start;

    return Math.max(0, Math.round(diffMinutes / 60 * 10) / 10);
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  public goBack(): void {
    const doctorId = this.preselectedDoctorId();
    if (doctorId) {
      this.router.navigate(['/schedules/doctor', doctorId]);
    } else {
      this.router.navigate(['/schedules']);
    }
  }

  public saveUnavailability(): void {
    if (this.unavailabilityForm.invalid || !this.selectedDoctor()) {
      this.notificationService.error('يرجى التأكد من صحة البيانات المدخلة');
      return;
    }

    const formValue = this.unavailabilityForm.value;

    const request: CreateUnavailabilityRequest = {
      doctorId: this.selectedDoctor()!.id,
      startDate: formValue.startDate!.toISOString().split('T')[0],
      endDate: formValue.endDate!.toISOString().split('T')[0],
      isAllDay: formValue.isAllDay!,
      startTime: formValue.isAllDay ? undefined : formValue.startTime!,
      endTime: formValue.isAllDay ? undefined : formValue.endTime!,
      unavailabilityType: formValue.unavailabilityType!,
      reason: formValue.reason!,
      notes: formValue.notes || undefined
    };

    if (this.isEditMode()) {
      // Implementation for edit mode would go here
      this.notificationService.info('تعديل فترة عدم التوفر...');
    } else {
      this.scheduleService.addUnavailability(request).subscribe({
        next: () => {
          this.notificationService.success('تم حفظ فترة عدم التوفر بنجاح');
          this.goBack();
        },
        error: (error) => {
          console.error('Error saving unavailability:', error);
        }
      });
    }
  }
}
