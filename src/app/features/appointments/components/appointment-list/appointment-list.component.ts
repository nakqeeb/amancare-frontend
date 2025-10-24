// src/app/features/appointments/components/appointment-list/appointment-list.component.ts
import { Component, inject, signal, OnInit, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

// Services & Models
import { AppointmentService } from '../../services/appointment.service';
import { UserService } from '../../../users/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  AppointmentResponse,
  AppointmentStatus,
  AppointmentType,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_TYPE_LABELS,
  APPOINTMENT_STATUS_COLORS
} from '../../models/appointment.model';
import { MatDividerModule } from '@angular/material/divider';
import { TokenBadgeComponent } from "../../../../shared/components/token-badge/token-badge.component";

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    MatDividerModule,
    HeaderComponent,
    SidebarComponent,
    TokenBadgeComponent
],
  templateUrl: './appointment-list.component.html',
  styleUrl: './appointment-list.component.scss'
})
export class AppointmentListComponent implements OnInit, OnDestroy {
  appointmentStatus = AppointmentStatus;
  readonly appointmentService = inject(AppointmentService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  // Component state
  appointments = this.appointmentService.appointments;  // FIXED: Keep signal reference
  loading = this.appointmentService.loading;
  currentPage = this.appointmentService.currentPage;
  pageSize = this.appointmentService.pageSize;
  totalElements = this.appointmentService.totalElements;

  // Filter form
  filterForm = this.fb.group({
    date: [null as Date | null],
    doctorId: [null as number | null],
    status: [null as AppointmentStatus | null],
    searchTerm: ['']
  });

  // Table configuration
  // displayedColumns = [
  //   'patientName',
  //   'doctorName',
  //   'dateTime',
  //   'type',
  //   'status',
  //   'actions'
  // ];
  // Update displayedColumns to include token
  displayedColumns: string[] = [
    'patientName',
    'doctorName',
    'date',
    'time',
    'token', // **NEW COLUMN**
    'type',
    'status',
    'actions'
  ];

  // Dropdown options
  statusOptions = Object.values(AppointmentStatus);
  typeOptions = Object.values(AppointmentType);
  doctors = signal<any[]>([]);

  // Labels
  statusLabels = APPOINTMENT_STATUS_LABELS;
  typeLabels = APPOINTMENT_TYPE_LABELS;
  statusColors = APPOINTMENT_STATUS_COLORS;

  // Sort configuration
  sortBy = signal('appointmentDate');
  sortDirection = signal<'asc' | 'desc'>('desc');

  ngOnInit(): void {
    this.loadAppointments();
    this.loadDoctors();
    this.setupFilterSubscription();
  }

  ngOnDestroy(): void {
    this.appointmentService.clearAppointments();
  }


  private setupFilterSubscription(): void {
    this.filterForm.valueChanges.subscribe(() => {
      this.currentPage.set(0);
      this.loadAppointments();
    });
  }

  loadAppointments(): void {
    const filters = this.filterForm.value;
    const date = filters.date ? this.formatDate(filters.date) : undefined;

    this.appointmentService.getAllAppointments(
      date,
      filters.doctorId || undefined,
      filters.status || undefined,
      this.currentPage(),
      this.pageSize(),
      this.sortBy(),
      this.sortDirection()
    ).subscribe();
  }

  loadDoctors(): void {
    this.userService.getDoctors().subscribe({
      next: (res) => {
        this.doctors.set(res.data!);
      },
      error: (error) => {
        console.error('Error loading doctors:', error);
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadAppointments();
  }

  onSortChange(sort: Sort): void {
    this.sortBy.set(sort.active);
    this.sortDirection.set(sort.direction as 'asc' | 'desc' || 'asc');
    this.loadAppointments();
  }

  viewAppointment(appointment: AppointmentResponse): void {
    this.router.navigate(['/appointments', appointment.id]);
  }

  editAppointment(appointment: AppointmentResponse): void {
    this.router.navigate(['/appointments', appointment.id, 'edit']);
  }

  updateStatus(appointment: AppointmentResponse, status: AppointmentStatus): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'تأكيد تغيير الحالة',
        message: `هل تريد تغيير حالة الموعد إلى ${this.statusLabels[status]}؟`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.appointmentService.updateAppointmentStatus(appointment.id, status).subscribe({
          next: () => {
            this.loadAppointments();
          }
        });
      }
    });
  }

  cancelAppointment(appointment: AppointmentResponse): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'إلغاء الموعد',
        message: 'هل تريد إلغاء هذا الموعد؟',
        showReasonInput: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.appointmentService.cancelAppointment(appointment.id, result.reason).subscribe({
          next: () => {
            this.loadAppointments();
          }
        });
      }
    });
  }

  clearFilters(): void {
    this.filterForm.reset();
  }

  exportAppointments(): void {
    // TODO: Implement export functionality
    this.notificationService.info('جاري تصدير المواعيد...');
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getStatusColor(status: AppointmentStatus): string {
    return this.statusColors[status] || 'default';
  }

  getStatusLabel(status: AppointmentStatus): string {
    return this.statusLabels[status] || status;
  }

  getTypeLabel(type: AppointmentType): string {
    return this.typeLabels[type] || type;
  }

  // Add these methods to your AppointmentListComponent class

  // Check if the date is today
  isToday(dateString: string): boolean {
    if (!dateString) return false;

    const today = new Date();
    const appointmentDate = new Date(dateString);

    return today.toDateString() === appointmentDate.toDateString();
  }

  // Format the date display
  formatAppointmentDate(dateString: string): string {
    if (!dateString) return '';

    const today = new Date();
    const appointmentDate = new Date(dateString);

    // Check if it's today
    if (today.toDateString() === appointmentDate.toDateString()) {
      return 'اليوم';
    }

    // Check if it's tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (tomorrow.toDateString() === appointmentDate.toDateString()) {
      return 'غداً';
    }

    // Check if it's yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (yesterday.toDateString() === appointmentDate.toDateString()) {
      return 'أمس';
    }

    // Format other dates as DD/MM/YYYY
    const day = appointmentDate.getDate().toString().padStart(2, '0');
    const month = (appointmentDate.getMonth() + 1).toString().padStart(2, '0');
    const year = appointmentDate.getFullYear();

    return `${day}/${month}/${year}`;
  }
}
