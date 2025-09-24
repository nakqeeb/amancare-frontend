// ===================================================================
// src/app/features/schedules/components/schedule-form/schedule-form.component.ts
// Schedule Form Component - Standalone with new control flow syntax
// ===================================================================
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
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
  CreateDoctorScheduleRequest,
  DayOfWeek,
  ScheduleType,
  DAY_OF_WEEK_ARABIC,
  SCHEDULE_TYPE_ARABIC,
  DEFAULT_WORKING_HOURS
} from '../../models/schedule.model';

interface Doctor {
  id: number;
  fullName: string;
  specialization?: string;
}

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
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './schedule-form.component.html',
  styleUrl: './schedule-form.component.scss'
})
export class ScheduleFormComponent implements OnInit {
  readonly scheduleService = inject(ScheduleService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  // Component state
  public readonly isEditMode = signal(false);
  public readonly scheduleId = signal<number | null>(null);
  public readonly selectedDoctor = signal<Doctor | null>(null);
  public readonly selectedDays = signal<DayOfWeek[]>([]);

  // Available doctors
  public readonly doctors = signal<Doctor[]>([]);

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

  // Filtered doctors for autocomplete
  public filteredDoctors$!: Observable<Doctor[]>;

  // Computed properties
  public totalWorkingHours = computed(() => {
    const startTime = this.hoursForm.get('startTime')?.value;
    const endTime = this.hoursForm.get('endTime')?.value;

    if (!startTime || !endTime) return 0;

    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);

    let totalMinutes = end - start;

    // Subtract break time if applicable
    if (this.hoursForm.get('hasBreak')?.value) {
      const breakStart = this.hoursForm.get('breakStartTime')?.value;
      const breakEnd = this.hoursForm.get('breakEndTime')?.value;

      if (breakStart && breakEnd) {
        const breakStartMin = this.timeToMinutes(breakStart);
        const breakEndMin = this.timeToMinutes(breakEnd);
        totalMinutes -= (breakEndMin - breakStartMin);
      }
    }

    return Math.max(0, Math.round(totalMinutes / 60 * 10) / 10);
  });

  public breakDuration = computed(() => {
    if (!this.hoursForm.get('hasBreak')?.value) return 0;

    const breakStart = this.hoursForm.get('breakStartTime')?.value;
    const breakEnd = this.hoursForm.get('breakEndTime')?.value;

    if (!breakStart || !breakEnd) return 0;

    const start = this.timeToMinutes(breakStart);
    const end = this.timeToMinutes(breakEnd);

    return Math.max(0, end - start);
  });

  ngOnInit(): void {
    this.checkEditMode();
    this.loadDoctors();
    this.setupAutocomplete();
    this.setupFormValidation();
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.scheduleId.set(Number(id));
      this.loadScheduleForEdit(Number(id));
    }
  }

  private loadDoctors(): void {
    this.userService.getDoctors().subscribe({
      next: (res) => {
        console.log('loadDoctors', res);
        this.doctors.set(res.data!.map(d => ({
          id: d.id as number,
          fullName: d.fullName as string,
          specialization: d.specialization
        })));
      },
      error: (error) => {
        console.error('Error loading doctors:', error);
        this.notificationService.error('فشل في تحميل قائمة الأطباء');
      }
    });
  }

  // private loadDoctors(): void {
  //   this.userService.getDoctors().subscribe({
  //     next: (doctors) => {
  //       // Filter out doctors without id or fullName, and provide defaults if needed
  //       const validDoctors = doctors
  //         .filter(d => d.id !== undefined && d.fullName !== undefined)
  //         .map(d => ({
  //           id: d.id as number, // Assert that it's not undefined
  //           fullName: d.fullName as string, // Assert that it's not undefined
  //           specialization: d.specialization
  //         }));

  //       this.doctors.set(validDoctors);
  //     },
  //     error: (error) => {
  //       console.error('Error loading doctors:', error);
  //       this.notificationService.error('فشل في تحميل قائمة الأطباء');
  //     }
  //   });
  // }
  private setupAutocomplete(): void {
    this.filteredDoctors$ = this.doctorForm.get('doctorSearch')!.valueChanges.pipe(
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
    // Watch break checkbox changes
    this.hoursForm.get('hasBreak')?.valueChanges.subscribe(hasBreak => {
      const breakStart = this.hoursForm.get('breakStartTime');
      const breakEnd = this.hoursForm.get('breakEndTime');

      if (hasBreak) {
        breakStart?.setValidators([Validators.required]);
        breakEnd?.setValidators([Validators.required]);
      } else {
        breakStart?.clearValidators();
        breakEnd?.clearValidators();
      }

      breakStart?.updateValueAndValidity();
      breakEnd?.updateValueAndValidity();
    });
  }

  private loadScheduleForEdit(id: number): void {
    // Implementation would load existing schedule data
    // For now, this is a placeholder
    this.notificationService.info('تحميل بيانات الجدولة للتعديل...');
  }

  public displayDoctorFn = (doctor: Doctor): string => {
    return doctor ? doctor.fullName : '';
  };

  public onDoctorSelected(event: any): void {
    const doctor = event.option.value as Doctor;
    this.selectedDoctor.set(doctor);
    this.doctorForm.get('doctorId')?.setValue(doctor.id);
  }

  public toggleDay(day: DayOfWeek, selected: boolean): void {
    const currentDays = this.selectedDays();

    if (selected) {
      if (!currentDays.includes(day)) {
        this.selectedDays.set([...currentDays, day]);
      }
    } else {
      this.selectedDays.set(currentDays.filter(d => d !== day));
    }

    // Update form control
    this.daysForm.get('workingDays')?.setValue(this.selectedDays());
  }

  public isDaySelected(day: DayOfWeek): boolean {
    return this.selectedDays().includes(day);
  }

  public getDayLabel(day: DayOfWeek): string {
    return DAY_OF_WEEK_ARABIC[day] || day;
  }

  public getDayCheckboxColor(day: DayOfWeek): string {
    return day === DayOfWeek.FRIDAY || day === DayOfWeek.SATURDAY ? 'accent' : 'primary';
  }

  public getDayChipColor(day: DayOfWeek): string {
    return day === DayOfWeek.FRIDAY || day === DayOfWeek.SATURDAY ? 'accent' : 'primary';
  }

  public getScheduleTypeLabel(): string {
    const type = this.settingsForm.get('scheduleType')?.value;
    return type ? SCHEDULE_TYPE_ARABIC[type] : '';
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  public saveSchedule(): void {
    if (!this.selectedDoctor() || this.selectedDays().length === 0) {
      this.notificationService.error('يرجى التأكد من اختيار الطبيب وأيام العمل');
      return;
    }

    const request: CreateDoctorScheduleRequest = {
      doctorId: this.selectedDoctor()!.id,
      workingDays: this.selectedDays(),
      startTime: this.hoursForm.get('startTime')!.value!,
      endTime: this.hoursForm.get('endTime')!.value!,
      breakStartTime: this.hoursForm.get('hasBreak')?.value ? this.hoursForm.get('breakStartTime')?.value! : undefined,
      breakEndTime: this.hoursForm.get('hasBreak')?.value ? this.hoursForm.get('breakEndTime')?.value! : undefined,
      scheduleType: this.settingsForm.get('scheduleType')!.value!,
      effectiveDate: this.settingsForm.get('effectiveDate')?.value?.toISOString().split('T')[0],
      endDate: this.settingsForm.get('endDate')?.value?.toISOString().split('T')[0],
      notes: this.settingsForm.get('notes')?.value || undefined
    };

    this.scheduleService.createDoctorSchedule(request).subscribe({
      next: () => {
        this.notificationService.success('تم حفظ الجدولة بنجاح');
        this.router.navigate(['/schedules']);
      },
      error: (error) => {
        console.error('Error saving schedule:', error);
      }
    });
  }
}
