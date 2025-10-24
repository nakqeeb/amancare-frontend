import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { Observable, startWith, map } from 'rxjs';

import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { ScheduleService } from '../../services/schedule.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  CreateDoctorScheduleRequest,
  UpdateDoctorScheduleRequest,
  DayOfWeek,
  ScheduleType,
  DurationConfigType,
  DAY_OF_WEEK_ARABIC,
  SCHEDULE_TYPE_ARABIC,
  DURATION_CONFIG_TYPE_ARABIC,
} from '../../models/schedule.model';
import { UserService } from '../../../users/services/user.service';
import { User } from '../../../users/models/user.model';
import { getDayOfWeekLabel } from '../../../guest-booking/models/guest-booking.model';

const DEFAULT_WORKING_HOURS = {
  START: '08:00',
  END: '16:00',
  BREAK_START: '12:00',
  BREAK_END: '13:00'
};

@Component({
  selector: 'app-schedule-form',
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
    MatStepperModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatTooltipModule,
    MatExpansionModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './schedule-form.component.html',
  styleUrl: './schedule-form.component.scss'
})
export class ScheduleFormComponent implements OnInit {
  private readonly scheduleService = inject(ScheduleService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  // Component state
  public readonly isEditMode = signal(false);
  public readonly scheduleId = signal<number | null>(null);
  public readonly loading = signal(false);
  public readonly submitting = signal(false);
  public readonly selectedDoctor = signal<User | null>(null);
  public readonly selectedDays = signal<DayOfWeek[]>([]);

  // Available doctors
  public readonly doctors = signal<User[]>([]);

  // Calculated values
  public readonly calculatedDuration = signal<number | null>(null);
  public readonly expectedTokens = signal<number | null>(null);
  public readonly availableMinutes = signal<number | null>(null);

  // Warning flags
  public readonly hasExistingAppointments = signal(false);
  public readonly showEditWarning = signal(false);

  // Forms
  public doctorForm = this.fb.group({
    doctorSearch: [''],
    doctorId: [null as number | null, Validators.required]
  });

  public daysForm = this.fb.group({
    workingDays: [[] as DayOfWeek[], Validators.required]
  });

  public hoursForm = this.fb.group({
    startTime: [DEFAULT_WORKING_HOURS.START, Validators.required],
    endTime: [DEFAULT_WORKING_HOURS.END, Validators.required],
    hasBreak: [true],
    breakStartTime: [DEFAULT_WORKING_HOURS.BREAK_START],
    breakEndTime: [DEFAULT_WORKING_HOURS.BREAK_END]
  });

  public durationForm = this.fb.group({
    durationConfigType: [DurationConfigType.DIRECT, Validators.required],
    durationMinutes: [30, [Validators.min(5), Validators.max(240)]],
    targetTokensPerDay: [null as number | null, [Validators.min(1), Validators.max(100)]]
  });

  public settingsForm = this.fb.group({
    scheduleType: [ScheduleType.REGULAR, Validators.required],
    effectiveDate: [null as Date | null],
    endDate: [null as Date | null],
    notes: ['']
  });

  // Available options
  public availableDays = Object.entries(DAY_OF_WEEK_ARABIC).map(([value, label]) => ({
    value: value as DayOfWeek,
    label
  }));

  public scheduleTypes = Object.entries(SCHEDULE_TYPE_ARABIC).map(([value, label]) => ({
    value: value as ScheduleType,
    label
  }));

  public durationConfigTypes = Object.entries(DURATION_CONFIG_TYPE_ARABIC).map(([value, label]) => ({
    value: value as DurationConfigType,
    label
  }));

  // Filtered doctors for autocomplete
  public filteredDoctors$!: Observable<User[]>;

  // Computed properties
  public readonly pageTitle = computed(() => {
    return this.isEditMode() ? 'تعديل جدول طبيب' : 'إنشاء جدول جديد';
  });

  public readonly pageSubtitle = computed(() => {
    return this.isEditMode() ? 'تحديث بيانات الجدول' : 'إضافة جدول عمل جديد للطبيب';
  });

  public readonly submitButtonText = computed(() => {
    return this.isEditMode() ? 'حفظ التغييرات' : 'إنشاء الجدول';
  });

  ngOnInit(): void {
    this.loadDoctors();
    this.setupDoctorAutocomplete();
    this.setupDurationCalculation();
    this.checkEditMode();
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.scheduleId.set(parseInt(id, 10));
      this.loadSchedule(parseInt(id, 10));
    }
  }

  private loadSchedule(scheduleId: number): void {
    this.loading.set(true);
    this.scheduleService.getDurationInfo(scheduleId).subscribe({
      next: (schedule) => {
        // Set edit mode warning
        this.showEditWarning.set(true);

        // Populate doctor form
        this.doctorForm.patchValue({
          doctorId: schedule.doctorId,
          doctorSearch: schedule.doctorName
        });

        // Set selected doctor
        this.selectedDoctor.set({
          id: schedule.doctorId,
          fullName: schedule.doctorName,
          specialization: schedule.doctorSpecialization
        } as User);

        // Disable doctor selection in edit mode
        this.doctorForm.get('doctorId')?.disable();
        this.doctorForm.get('doctorSearch')?.disable();

        // Populate days form (single day in edit mode)
        this.daysForm.patchValue({
          workingDays: [schedule.dayOfWeek as DayOfWeek]
        });
        this.selectedDays.set([schedule.dayOfWeek as DayOfWeek]);

        // Populate hours form
        this.hoursForm.patchValue({
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          hasBreak: !!(schedule.breakStartTime && schedule.breakEndTime),
          breakStartTime: schedule.breakStartTime || DEFAULT_WORKING_HOURS.BREAK_START,
          breakEndTime: schedule.breakEndTime || DEFAULT_WORKING_HOURS.BREAK_END
        });

        // Populate duration form
        const configType = schedule.durationConfigType === 'TOKEN_BASED'
          ? DurationConfigType.TOKEN_BASED
          : DurationConfigType.DIRECT;

        this.durationForm.patchValue({
          durationConfigType: configType,
          durationMinutes: schedule.durationMinutes || 30,
          targetTokensPerDay: schedule.targetTokensPerDay || null
        });

        // Populate settings form
        this.settingsForm.patchValue({
          scheduleType: schedule.scheduleType as ScheduleType,
          effectiveDate: schedule.effectiveDate ? new Date(schedule.effectiveDate) : null,
          endDate: schedule.endDate ? new Date(schedule.endDate) : null,
          notes: schedule.notes || ''
        });

        // Trigger calculations
        this.calculateAvailableMinutes();
        this.calculateDurationPreview();
        this.calculateExpectedTokens();

        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading schedule:', error);
        this.notificationService.error('فشل في تحميل بيانات الجدول');
        this.loading.set(false);
        this.router.navigate(['/schedules']);
      }
    });
  }

  private loadDoctors(): void {
    this.userService.getDoctors().subscribe({
      next: (res) => {
        this.doctors.set(res.data || []);
      },
      error: (error) => {
        console.error('Error loading doctors:', error);
        this.notificationService.error('فشل في تحميل قائمة الأطباء');
      }
    });
  }

  private setupDoctorAutocomplete(): void {
    this.filteredDoctors$ = this.doctorForm.get('doctorSearch')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterDoctors(value || ''))
    );
  }

  private _filterDoctors(value: string): User[] {
    const filterValue = value.toLowerCase();
    return this.doctors().filter(doctor => {
      const fullName = doctor.fullName.toLowerCase();
      const specialization = doctor.specialization?.toLowerCase() || '';
      return fullName.includes(filterValue) || specialization.includes(filterValue);
    });
  }

  public displayDoctor(doctor: User): string {
    if (!doctor) return '';
    return doctor.specialization
      ? `${doctor.fullName} - ${doctor.specialization}`
      : doctor.fullName;
  }

  public onDoctorSelected(event: any): void {
    const doctor = event.option.value;
    this.doctorForm.patchValue({ doctorId: doctor.id });
    this.selectedDoctor.set(doctor);
  }

  public onDayToggle(day: DayOfWeek): void {
    const currentDays = this.selectedDays();
    if (currentDays.includes(day)) {
      this.selectedDays.set(currentDays.filter(d => d !== day));
    } else {
      this.selectedDays.set([...currentDays, day]);
    }
    this.daysForm.patchValue({ workingDays: this.selectedDays() });
  }

  public isDaySelected(day: DayOfWeek): boolean {
    return this.selectedDays().includes(day);
  }

  public getDayLabel(day: DayOfWeek): string {
    return getDayOfWeekLabel(day);
  }

  private setupDurationCalculation(): void {
    // Watch for changes in duration config type
    this.durationForm.get('durationConfigType')?.valueChanges.subscribe(type => {
      if (type === DurationConfigType.DIRECT) {
        // Enable durationMinutes, disable targetTokensPerDay
        this.durationForm.get('durationMinutes')?.enable();
        this.durationForm.get('durationMinutes')?.setValidators([
          Validators.required,
          Validators.min(5),
          Validators.max(240)
        ]);
        this.durationForm.get('targetTokensPerDay')?.disable();
        this.durationForm.get('targetTokensPerDay')?.clearValidators();
        this.calculatedDuration.set(null);
      } else if (type === DurationConfigType.TOKEN_BASED) {
        // Enable targetTokensPerDay, disable durationMinutes
        this.durationForm.get('durationMinutes')?.disable();
        this.durationForm.get('durationMinutes')?.clearValidators();
        this.durationForm.get('targetTokensPerDay')?.enable();
        this.durationForm.get('targetTokensPerDay')?.setValidators([
          Validators.required,
          Validators.min(1),
          Validators.max(100)
        ]);
        this.expectedTokens.set(null);
      }
      this.durationForm.get('durationMinutes')?.updateValueAndValidity();
      this.durationForm.get('targetTokensPerDay')?.updateValueAndValidity();

      this.calculateDurationPreview();
    });

    // Watch for changes in hours form to recalculate
    this.hoursForm.valueChanges.subscribe(() => {
      this.calculateAvailableMinutes();
      this.calculateDurationPreview();
    });

    // Watch for changes in target tokens
    this.durationForm.get('targetTokensPerDay')?.valueChanges.subscribe(() => {
      this.calculateDurationPreview();
    });

    // Watch for changes in direct duration
    this.durationForm.get('durationMinutes')?.valueChanges.subscribe(() => {
      this.calculateExpectedTokens();
    });
  }

  private calculateAvailableMinutes(): void {
    const startTime = this.hoursForm.get('startTime')?.value;
    const endTime = this.hoursForm.get('endTime')?.value;
    const hasBreak = this.hoursForm.get('hasBreak')?.value;
    const breakStart = this.hoursForm.get('breakStartTime')?.value;
    const breakEnd = this.hoursForm.get('breakEndTime')?.value;

    if (!startTime || !endTime) {
      this.availableMinutes.set(null);
      return;
    }

    // Parse times
    const start = this.parseTime(startTime);
    const end = this.parseTime(endTime);
    let totalMinutes = (end.hours * 60 + end.minutes) - (start.hours * 60 + start.minutes);

    // Subtract break time if exists
    if (hasBreak && breakStart && breakEnd) {
      const bStart = this.parseTime(breakStart);
      const bEnd = this.parseTime(breakEnd);
      const breakMinutes = (bEnd.hours * 60 + bEnd.minutes) - (bStart.hours * 60 + bStart.minutes);
      totalMinutes -= breakMinutes;
    }

    this.availableMinutes.set(totalMinutes);
  }

  private calculateDurationPreview(): void {
    const configType = this.durationForm.get('durationConfigType')?.value;

    if (configType === DurationConfigType.TOKEN_BASED) {
      const targetTokens = this.durationForm.get('targetTokensPerDay')?.value;
      const availableMinutes = this.availableMinutes();

      if (targetTokens && availableMinutes && targetTokens > 0) {
        const calculated = Math.round((availableMinutes / targetTokens) / 5) * 5; // Round to nearest 5
        this.calculatedDuration.set(calculated);
      } else {
        this.calculatedDuration.set(null);
      }
    }
  }

  private calculateExpectedTokens(): void {
    const configType = this.durationForm.get('durationConfigType')?.value;

    if (configType === DurationConfigType.DIRECT) {
      const duration = this.durationForm.get('durationMinutes')?.value;
      const availableMinutes = this.availableMinutes();

      if (duration && availableMinutes && duration > 0) {
        const expected = Math.floor(availableMinutes / duration);
        this.expectedTokens.set(expected);
      } else {
        this.expectedTokens.set(null);
      }
    }
  }

  private parseTime(timeStr: string): { hours: number; minutes: number } {
    const parts = timeStr.split(':');
    return {
      hours: parseInt(parts[0], 10),
      minutes: parseInt(parts[1], 10)
    };
  }

  public onSubmit(): void {
    // Validate all forms
    if (this.doctorForm.invalid || this.daysForm.invalid ||
        this.hoursForm.invalid || this.settingsForm.invalid ||
        this.durationForm.invalid) {
      this.notificationService.error('يرجى ملء جميع الحقول المطلوبة');

      // Mark all as touched to show errors
      this.doctorForm.markAllAsTouched();
      this.daysForm.markAllAsTouched();
      this.hoursForm.markAllAsTouched();
      this.durationForm.markAllAsTouched();
      this.settingsForm.markAllAsTouched();
      return;
    }

    // Get doctor ID (handle disabled state in edit mode)
    const doctorId = this.isEditMode()
      ? this.doctorForm.getRawValue().doctorId
      : this.doctorForm.get('doctorId')?.value;

    if (!doctorId) {
      this.notificationService.error('يرجى اختيار الطبيب');
      return;
    }

    this.submitting.set(true);

    const durationConfigType = this.durationForm.get('durationConfigType')?.value!;

    if (this.isEditMode()) {
      // Update existing schedule
      this.updateSchedule(doctorId, durationConfigType);
    } else {
      // Create new schedule
      this.createSchedule(doctorId, durationConfigType);
    }
  }

  private createSchedule(doctorId: number, durationConfigType: DurationConfigType): void {
    const request: CreateDoctorScheduleRequest = {
      doctorId: doctorId,
      workingDays: this.daysForm.get('workingDays')?.value || [],
      startTime: this.hoursForm.get('startTime')?.value!,
      endTime: this.hoursForm.get('endTime')?.value!,
      breakStartTime: this.hoursForm.get('hasBreak')?.value ?
        this.hoursForm.get('breakStartTime')?.value! : undefined,
      breakEndTime: this.hoursForm.get('hasBreak')?.value ?
        this.hoursForm.get('breakEndTime')?.value! : undefined,
      scheduleType: this.settingsForm.get('scheduleType')?.value!,
      effectiveDate: this.settingsForm.get('effectiveDate')?.value?.toISOString().split('T')[0],
      endDate: this.settingsForm.get('endDate')?.value?.toISOString().split('T')[0],
      notes: this.settingsForm.get('notes')?.value || undefined,

      // Duration configuration
      durationConfigType: durationConfigType,
      durationMinutes: durationConfigType === DurationConfigType.DIRECT ?
        this.durationForm.get('durationMinutes')?.value! : undefined,
      targetTokensPerDay: durationConfigType === DurationConfigType.TOKEN_BASED ?
        this.durationForm.get('targetTokensPerDay')?.value! : undefined
    };

    this.scheduleService.createDoctorSchedule(request).subscribe({
      next: () => {
        this.notificationService.success('تم إنشاء الجدول بنجاح');
        this.router.navigate(['/schedules']);
      },
      error: (error) => {
        console.error('Error creating schedule:', error);
        this.submitting.set(false);
      }
    });
  }

  private updateSchedule(doctorId: number, durationConfigType: DurationConfigType): void {
    const request: UpdateDoctorScheduleRequest = {
      startTime: this.hoursForm.get('startTime')?.value!,
      endTime: this.hoursForm.get('endTime')?.value!,
      breakStartTime: this.hoursForm.get('hasBreak')?.value ?
        this.hoursForm.get('breakStartTime')?.value! : undefined,
      breakEndTime: this.hoursForm.get('hasBreak')?.value ?
        this.hoursForm.get('breakEndTime')?.value! : undefined,
      scheduleType: this.settingsForm.get('scheduleType')?.value!,
      effectiveDate: this.settingsForm.get('effectiveDate')?.value?.toISOString().split('T')[0],
      endDate: this.settingsForm.get('endDate')?.value?.toISOString().split('T')[0],
      notes: this.settingsForm.get('notes')?.value || undefined,

      // Duration configuration
      durationConfigType: durationConfigType,
      durationMinutes: durationConfigType === DurationConfigType.DIRECT ?
        this.durationForm.get('durationMinutes')?.value! : undefined,
      targetTokensPerDay: durationConfigType === DurationConfigType.TOKEN_BASED ?
        this.durationForm.get('targetTokensPerDay')?.value! : undefined
    };

    this.scheduleService.updateSchedule(this.scheduleId()!, request).subscribe({
      next: () => {
        this.notificationService.success('تم تحديث الجدول بنجاح');
        this.router.navigate(['/schedules']);
      },
      error: (error) => {
        console.error('Error updating schedule:', error);
        this.submitting.set(false);
      }
    });
  }

  public onCancel(): void {
    if (confirm('هل أنت متأكد من إلغاء العملية؟ سيتم فقدان جميع التغييرات.')) {
      this.router.navigate(['/schedules']);
    }
  }
}
