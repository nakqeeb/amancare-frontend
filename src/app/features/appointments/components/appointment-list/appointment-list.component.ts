// ===================================================================
// 4. APPOINTMENT LIST COMPONENT
// src/app/features/appointments/components/appointment-list/appointment-list.component.ts
// ===================================================================
import { Component, inject, signal, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { PageEvent } from '@angular/material/paginator';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { DataTableComponent, TableColumn, TableAction } from '../../../../shared/components/data-table/data-table.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

// Services & Models
import { AppointmentService } from '../../services/appointment.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoadingService } from '../../../../core/services/loading.service';
import {
  Appointment,
  AppointmentSearchCriteria,
  AppointmentStatus,
  AppointmentType
} from '../../models/appointment.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-appointment-list',
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
    MatChipsModule,
    MatMenuModule,
    MatDialogModule,
    MatDividerModule,
    HeaderComponent,
    SidebarComponent,
    DataTableComponent
  ],
  templateUrl: './appointment-list.component.html',
  styleUrl: './appointment-list.component.scss'
})

export class AppointmentListComponent implements OnInit {
  @ViewChild('dataTable') dataTable!: DataTableComponent;

  // Services
  private appointmentService = inject(AppointmentService);
  private notificationService = inject(NotificationService);
  private loadingService = inject(LoadingService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  // Signals
  appointments = signal<Appointment[]>([]);
  loading = signal(false);
  totalAppointments = signal(0);
  selectedDate = signal<Date | null>(null);

  // Filter Form
  filterForm!: FormGroup;

  // Table Configuration
  columns: TableColumn[] = [
    {
      key: 'appointmentTime',
      label: 'الوقت',
      sortable: true,
      width: '100px'
    },
    {
      key: 'patientName',
      label: 'المريض',
      sortable: true,
      searchable: true
    },
    {
      key: 'doctorName',
      label: 'الطبيب',
      sortable: true
    },
    {
      key: 'type',
      label: 'النوع',
      sortable: true,
      width: '120px',
      cellTemplate: (appointment: Appointment) => this.getAppointmentTypeLabel(appointment.type)
    },
    {
      key: 'chiefComplaint',
      label: 'الشكوى',
      width: '200px'
    },
    {
      key: 'status',
      label: 'الحالة',
      sortable: true,
      width: '120px',
      cellTemplate: (appointment: Appointment) =>
        `<span class="status-chip status-${appointment.status.toLowerCase()}">
          ${this.getStatusLabel(appointment.status)}
        </span>`
    }
  ];

  actions: TableAction[] = [
    {
      icon: 'visibility',
      label: 'عرض',
      color: 'primary',
      action: (appointment: Appointment) => this.onViewAppointment(appointment)
    },
    {
      icon: 'edit',
      label: 'تعديل',
      color: 'accent',
      action: (appointment: Appointment) => this.onEditAppointment(appointment),
      show: (appointment: Appointment) =>
        appointment.status === AppointmentStatus.SCHEDULED ||
        appointment.status === AppointmentStatus.CONFIRMED
    },
    {
      icon: 'check_circle',
      label: 'تأكيد',
      color: 'success',
      action: (appointment: Appointment) => this.onConfirmAppointment(appointment),
      show: (appointment: Appointment) =>
        appointment.status === AppointmentStatus.SCHEDULED
    },
    {
      icon: 'how_to_reg',
      label: 'تسجيل حضور',
      color: 'info',
      action: (appointment: Appointment) => this.onCheckInAppointment(appointment),
      show: (appointment: Appointment) =>
        appointment.status === AppointmentStatus.CONFIRMED
    },
    {
      icon: 'cancel',
      label: 'إلغاء',
      color: 'warn',
      action: (appointment: Appointment) => this.onCancelAppointment(appointment),
      show: (appointment: Appointment) =>
        appointment.status !== AppointmentStatus.CANCELLED &&
        appointment.status !== AppointmentStatus.COMPLETED
    }
  ];

  // Status options
  statusOptions = [
    { value: '', label: 'جميع الحالات' },
    { value: AppointmentStatus.SCHEDULED, label: 'مجدول' },
    { value: AppointmentStatus.CONFIRMED, label: 'مؤكد' },
    { value: AppointmentStatus.CHECKED_IN, label: 'تم تسجيل الحضور' },
    { value: AppointmentStatus.IN_PROGRESS, label: 'جاري' },
    { value: AppointmentStatus.COMPLETED, label: 'مكتمل' },
    { value: AppointmentStatus.CANCELLED, label: 'ملغي' },
    { value: AppointmentStatus.NO_SHOW, label: 'لم يحضر' }
  ];

  // Type options
  typeOptions = [
    { value: '', label: 'جميع الأنواع' },
    { value: AppointmentType.CONSULTATION, label: 'استشارة' },
    { value: AppointmentType.FOLLOW_UP, label: 'متابعة' },
    { value: AppointmentType.EMERGENCY, label: 'طوارئ' },
    { value: AppointmentType.ROUTINE_CHECK, label: 'فحص دوري' },
    { value: AppointmentType.VACCINATION, label: 'تطعيم' },
    { value: AppointmentType.LAB_TEST, label: 'فحص مخبري' }
  ];

  ngOnInit(): void {
    this.initializeFilterForm();
    this.loadAppointments();
    this.checkQueryParams();
  }

  getTodayCount(status: string): number {
    const today = new Date();
    const todayStr = this.formatDate(today);

    return this.appointments().filter(appointment =>
      appointment.status === status &&
      appointment.appointmentDate === todayStr
    ).length;
  }

  onBulkDelete(appointments: Appointment[]): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'حذف متعدد',
        message: `هل أنت متأكد من حذف ${appointments.length} موعد؟`,
        confirmText: 'حذف',
        cancelText: 'إلغاء',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Implement bulk delete logic
        const deleteRequests = appointments.map(appointment =>
          this.appointmentService.cancelAppointment(appointment.id!)
        );

        forkJoin(deleteRequests).subscribe({
          next: () => {
            this.notificationService.success(`تم حذف ${appointments.length} موعد بنجاح`);
            this.loadAppointments();
          },
          error: () => {
            this.notificationService.error('حدث خطأ أثناء حذف المواعيد');
          }
        });
      }
    });
  }

  private initializeFilterForm(): void {
    const today = new Date();
    this.filterForm = this.fb.group({
      searchQuery: [''],
      status: [''],
      type: [''],
      fromDate: [today],
      toDate: [today],
      doctorId: [''],
      patientId: ['']
    });

    // Subscribe to form changes
    this.filterForm.valueChanges.subscribe(() => {
      this.loadAppointments();
    });
  }

  private checkQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      if (params['filter'] === 'today') {
        const today = new Date();
        this.filterForm.patchValue({
          fromDate: today,
          toDate: today
        });
      }
      if (params['patientId']) {
        this.filterForm.patchValue({
          patientId: params['patientId']
        });
      }
      if (params['doctorId']) {
        this.filterForm.patchValue({
          doctorId: params['doctorId']
        });
      }
    });
  }

  loadAppointments(): void {
    this.loading.set(true);

    if (this.dataTable) {
      this.dataTable.setLoading(true);
    }

    const criteria: AppointmentSearchCriteria = {
      ...this.filterForm.value,
      fromDate: this.formatDate(this.filterForm.value.fromDate),
      toDate: this.formatDate(this.filterForm.value.toDate)
    };

    // Remove empty values
    Object.keys(criteria).forEach(key => {
      if (!criteria[key as keyof AppointmentSearchCriteria]) {
        delete criteria[key as keyof AppointmentSearchCriteria];
      }
    });

    this.appointmentService.getAppointments(criteria).subscribe({
      next: (appointments) => {
        this.appointments.set(appointments);
        this.totalAppointments.set(appointments.length);
        this.loading.set(false);

        if (this.dataTable) {
          this.dataTable.setData(appointments);
          this.dataTable.setTotalItems(appointments.length);
          this.dataTable.setLoading(false);
        }
      },
      error: (error) => {
        // ... error handling
        if (this.dataTable) {
          this.dataTable.setLoading(false);
        }
      }
    });
    // this.appointmentService.getAppointments(criteria).subscribe({
    //   next: (appointments) => {
    //     this.appointments.set(appointments);
    //     this.totalAppointments.set(appointments.length);
    //     this.loading.set(false);
    //   },
    //   error: (error) => {
    //     console.error('Error loading appointments:', error);
    //     this.notificationService.error('حدث خطأ في تحميل المواعيد');
    //     this.loading.set(false);
    //   }
    // });
  }

  onViewAppointment(appointment: Appointment): void {
    this.router.navigate(['/appointments', appointment.id]);
  }

  onEditAppointment(appointment: Appointment): void {
    this.router.navigate(['/appointments', appointment.id, 'edit']);
  }

  onConfirmAppointment(appointment: Appointment): void {
    this.appointmentService.updateAppointmentStatus(
      appointment.id!,
      AppointmentStatus.CONFIRMED
    ).subscribe({
      next: () => {
        this.notificationService.success('تم تأكيد الموعد بنجاح');
        this.loadAppointments();
      },
      error: () => {
        this.notificationService.error('حدث خطأ في تأكيد الموعد');
      }
    });
  }

  onCheckInAppointment(appointment: Appointment): void {
    this.appointmentService.updateAppointmentStatus(
      appointment.id!,
      AppointmentStatus.CHECKED_IN
    ).subscribe({
      next: () => {
        this.notificationService.success('تم تسجيل حضور المريض');
        this.loadAppointments();
      },
      error: () => {
        this.notificationService.error('حدث خطأ في تسجيل الحضور');
      }
    });
  }

  onCancelAppointment(appointment: Appointment): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'إلغاء الموعد',
        message: `هل أنت متأكد من إلغاء موعد ${appointment.patientName}؟`,
        confirmText: 'إلغاء الموعد',
        cancelText: 'رجوع',
        type: 'warning'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.appointmentService.cancelAppointment(appointment.id!).subscribe({
          next: () => {
            this.notificationService.success('تم إلغاء الموعد بنجاح');
            this.loadAppointments();
          },
          error: () => {
            this.notificationService.error('حدث خطأ في إلغاء الموعد');
          }
        });
      }
    });
  }

  onBulkStatusUpdate(appointments: Appointment[], status: AppointmentStatus): void {
    // Implement bulk status update logic
    const updatePromises = appointments.map(appointment =>
      this.appointmentService.updateAppointmentStatus(appointment.id!, status).toPromise()
    );

    Promise.all(updatePromises).then(() => {
      this.notificationService.success(`تم تحديث حالة ${appointments.length} موعد`);
      this.loadAppointments();
    }).catch(() => {
      this.notificationService.error('حدث خطأ في تحديث الحالات');
    });
  }

  onExport(event: { format: string }): void {
    this.loadingService.startLoading();

    const criteria: AppointmentSearchCriteria = {
      ...this.filterForm.value,
      fromDate: this.formatDate(this.filterForm.value.fromDate),
      toDate: this.formatDate(this.filterForm.value.toDate)
    };

    this.appointmentService.exportAppointments(
      criteria,
      event.format as 'excel' | 'pdf'
    ).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `appointments.${event.format === 'excel' ? 'xlsx' : 'pdf'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.loadingService.stopLoading();
        this.notificationService.success('تم تصدير البيانات بنجاح');
      },
      error: () => {
        this.loadingService.stopLoading();
        this.notificationService.error('حدث خطأ في تصدير البيانات');
      }
    });
  }

  onRefresh(): void {
    this.loadAppointments();
  }

  onDateChange(date: Date | null): void {
    if (date) {
      this.filterForm.patchValue({
        fromDate: date,
        toDate: date
      });
    }
  }

  onResetFilters(): void {
    const today = new Date();
    this.filterForm.reset({
      searchQuery: '',
      status: '',
      type: '',
      fromDate: today,
      toDate: today,
      doctorId: '',
      patientId: ''
    });
  }

  // Helper methods
  private formatDate(date: Date | string | null): string {
    if (!date) return '';

    if (typeof date === 'string') {
      return date;
    }

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getStatusLabel(status: AppointmentStatus): string {
    const option = this.statusOptions.find(s => s.value === status);
    return option ? option.label : status;
  }

  getAppointmentTypeLabel(type: AppointmentType): string {
    const option = this.typeOptions.find(t => t.value === type);
    return option ? option.label : type;
  }

  getStatusClass(status: AppointmentStatus): string {
    const statusClasses: Record<AppointmentStatus, string> = {
      [AppointmentStatus.SCHEDULED]: 'status-scheduled',
      [AppointmentStatus.CONFIRMED]: 'status-confirmed',
      [AppointmentStatus.CHECKED_IN]: 'status-checked-in',
      [AppointmentStatus.IN_PROGRESS]: 'status-in-progress',
      [AppointmentStatus.COMPLETED]: 'status-completed',
      [AppointmentStatus.CANCELLED]: 'status-cancelled',
      [AppointmentStatus.NO_SHOW]: 'status-no-show',
      [AppointmentStatus.RESCHEDULED]: 'status-rescheduled'
    };
    return statusClasses[status] || '';
  }

  trackByAppointment(index: number, appointment: Appointment): number {
    return appointment.id!;
  }
}
