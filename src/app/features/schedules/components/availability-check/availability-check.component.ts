// ===================================================================
// src/app/features/schedules/components/availability-check/availability-check.component.ts
// Availability Check Component - Standalone with new control flow syntax
// ===================================================================
import { Component, inject, signal, OnInit, computed } from '@angular/core';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Observable, startWith, map } from 'rxjs';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// Services & Models
import { ScheduleService } from '../../services/schedule.service';
import { UserService } from '../../../users/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  DoctorSummaryResponse,
  DayOfWeek,
  DAY_OF_WEEK_ARABIC
} from '../../models/schedule.model';

interface Doctor {
  id: number;
  fullName: string;
  specialization?: string;
}

interface AvailabilityResult {
  doctorId: number;
  doctorName: string;
  date: string;
  time: string;
  isAvailable: boolean;
  conflictReason?: string;
  nextAvailableTime?: string;
  availableSlots: string[];
}

@Component({
  selector: 'app-availability-check',
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
    MatProgressSpinnerModule,
    MatDividerModule,
    MatChipsModule,
    MatExpansionModule,
    MatAutocompleteModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './availability-check.component.html',
  styleUrl: './availability-check.component.scss'
})
export class AvailabilityCheckComponent implements OnInit {
  readonly scheduleService = inject(ScheduleService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  // Component state
  public readonly selectedDoctor = signal<Doctor | null>(null);
  public readonly availabilityResult = signal<AvailabilityResult | null>(null);
  public readonly availableTimeSlots = this.scheduleService.availableTimeSlots;
  public readonly availableDoctorsForTime = this.scheduleService.availableDoctors;

  // Available doctors
  public readonly doctors = signal<Doctor[]>([]);

  // Form
  public checkForm = this.fb.group({
    doctorSearch: [''],
    doctorId: [null as number | null, Validators.required],
    date: [null as Date | null, Validators.required],
    time: ['', Validators.required],
    duration: [30, Validators.required]
  });

  // Filtered doctors for autocomplete
  public filteredDoctors$!: Observable<Doctor[]>;

  // Date constraints
  public minDate = new Date();

  // Computed properties
  public selectedDateTime = computed(() => {
    const date = this.checkForm.get('date')?.value;
    const time = this.checkForm.get('time')?.value;

    if (!date || !time) return '';

    return this.formatDateTime(date.toISOString().split('T')[0], time);
  });

  ngOnInit(): void {
    this.checkPreselectedDoctor();
    this.loadDoctors();
    this.setupAutocomplete();
  }

  private checkPreselectedDoctor(): void {
    const doctorId = this.route.snapshot.paramMap.get('doctorId') ||
      this.route.snapshot.queryParamMap.get('doctorId');

    if (doctorId) {
      this.checkForm.get('doctorId')?.setValue(Number(doctorId));
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
        const preselectedId = this.checkForm.get('doctorId')?.value;
        if (preselectedId) {
          const preselectedDoctor = doctorList.find(d => d.id === preselectedId);
          if (preselectedDoctor) {
            this.selectedDoctor.set(preselectedDoctor);
            this.checkForm.get('doctorSearch')?.setValue(preselectedDoctor.fullName);
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
    this.filteredDoctors$ = this.checkForm.get('doctorSearch')!.valueChanges.pipe(
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

  public displayDoctorFn = (doctor: Doctor): string => {
    return doctor ? doctor.fullName : '';
  };

  public onDoctorSelected(event: any): void {
    const doctor = event.option.value as Doctor;
    this.selectedDoctor.set(doctor);
    this.checkForm.get('doctorId')?.setValue(doctor.id);
  }

  public checkAvailability(): void {
    if (this.checkForm.invalid || !this.selectedDoctor()) {
      this.notificationService.error('يرجى التأكد من صحة البيانات المدخلة');
      return;
    }

    const formValue = this.checkForm.value;
    const doctorId = this.selectedDoctor()!.id;
    const date = formValue.date!.toISOString().split('T')[0];
    const time = formValue.time!;

    // Clear previous results
    this.availabilityResult.set(null);
    this.scheduleService.availableTimeSlots.set([]);
    this.scheduleService.availableDoctors.set([]);

    this.scheduleService.checkDoctorAvailability(doctorId, date, time).subscribe({
      next: (isAvailable) => {
        const result: AvailabilityResult = {
          doctorId,
          doctorName: this.selectedDoctor()!.fullName,
          date,
          time,
          isAvailable,
          conflictReason: isAvailable ? undefined : 'الطبيب غير متاح في هذا الوقت',
          availableSlots: []
        };

        this.availabilityResult.set(result);

        if (isAvailable) {
          this.notificationService.success('الطبيب متاح في الوقت المحدد');
        } else {
          this.notificationService.warning('الطبيب غير متاح في الوقت المحدد');
          // Also get available doctors for this time
          this.getAvailableDoctorsForTime();
        }
      },
      error: (error) => {
        console.error('Error checking availability:', error);
      }
    });
  }

  public checkBulkAvailability(): void {
    if (!this.selectedDoctor() || !this.checkForm.get('date')?.value) {
      this.notificationService.error('يرجى اختيار الطبيب والتاريخ');
      return;
    }

    const doctorId = this.selectedDoctor()!.id;
    const date = this.checkForm.get('date')!.value!.toISOString().split('T')[0];
    const duration = this.checkForm.get('duration')?.value || 30;

    // Clear previous results
    this.availabilityResult.set(null);
    this.scheduleService.availableDoctors.set([]);

    this.scheduleService.getAvailableTimeSlots(doctorId, date, duration).subscribe({
      next: () => {
        const slots = this.scheduleService.availableTimeSlots();
        if (slots.length > 0) {
          this.notificationService.success(`تم العثور على ${slots.length} فترة متاحة`);
        } else {
          this.notificationService.warning('لا توجد فترات متاحة في التاريخ المحدد');
        }
      },
      error: (error) => {
        console.error('Error getting available slots:', error);
      }
    });
  }

  private getAvailableDoctorsForTime(): void {
    const formValue = this.checkForm.value;
    if (!formValue.date || !formValue.time) return;

    const date = formValue.date.toISOString().split('T')[0];
    const time = formValue.time;

    this.scheduleService.getAvailableDoctors(date, time).subscribe({
      next: () => {
        const availableDoctors = this.scheduleService.availableDoctors();
        if (availableDoctors.length > 0) {
          this.notificationService.info(`يوجد ${availableDoctors.length} أطباء متاحين في هذا الوقت`);
        }
      },
      error: (error) => {
        console.error('Error getting available doctors:', error);
      }
    });
  }

  public selectTimeSlot(slot: string): void {
    this.checkForm.get('time')?.setValue(slot);
    this.notificationService.info(`تم اختيار الوقت: ${this.formatTime(slot)}`);
  }

  public checkDoctorAvailability(doctorId: number): void {
    const doctor = this.doctors().find(d => d.id === doctorId);
    if (doctor) {
      this.selectedDoctor.set(doctor);
      this.checkForm.get('doctorId')?.setValue(doctorId);
      this.checkForm.get('doctorSearch')?.setValue(doctor.fullName);

      if (this.checkForm.get('date')?.value && this.checkForm.get('time')?.value) {
        this.checkAvailability();
      }
    }
  }

  public formatTime(time: string): string {
    return time.substring(0, 5); // Format HH:MM
  }

  public formatDateTime(date: string, time: string): string {
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formattedTime = this.formatTime(time);

    return `${formattedDate} الساعة ${formattedTime}`;
  }
}
