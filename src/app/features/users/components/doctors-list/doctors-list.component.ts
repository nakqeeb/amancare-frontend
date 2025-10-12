// ===================================================================
// src/app/features/users/components/doctors-list/doctors-list.component.ts
// Specialized Component for Doctors Management using /users/doctors endpoint
// ===================================================================
import { Component, inject, signal, OnInit, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

// Angular Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatBadgeModule } from '@angular/material/badge';
import { MatListModule } from '@angular/material/list';
import { SelectionModel } from '@angular/cdk/collections';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

// Services & Models
import { UserService } from '../../services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { SystemAdminService } from '../../../../core/services/system-admin.service';
import { User, UserRole } from '../../models/user.model';

@Component({
  selector: 'app-doctors-list',
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
    MatProgressSpinnerModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatDialogModule,
    MatCheckboxModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatBadgeModule,
    MatListModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './doctors-list.component.html',
  styleUrls: ['./doctors-list.component.scss']
})
export class DoctorsListComponent implements OnInit {

  // ===================================================================
  // DEPENDENCY INJECTION
  // ===================================================================
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private systemAdminService = inject(SystemAdminService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);

  // ===================================================================
  // VIEWCHILD REFERENCES
  // ===================================================================
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // ===================================================================
  // COMPONENT STATE
  // ===================================================================
  loading = computed(() => this.userService.loading());
  error = computed(() => this.userService.error());

  // Data signals
  doctors = computed(() => this.userService.doctors());
  selectedDoctor = signal<User | null>(null);

  // UI state
  viewMode = signal<'table' | 'cards'>('table');
  showFilters = signal(false);

  // ===================================================================
  // COMPUTED PROPERTIES
  // ===================================================================
  currentUser = computed(() => this.authService.currentUser());
  isSystemAdmin = computed(() => this.currentUser()?.role === 'SYSTEM_ADMIN');
  canManageDoctors = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'SYSTEM_ADMIN' || role === 'ADMIN';
  });

  // Filter functionality
  filteredDoctors = computed(() => {
    const searchTerm = this.filtersForm.get('search')?.value?.toLowerCase() || '';
    const specializationFilter = this.filtersForm.get('specialization')?.value;
    const statusFilter = this.filtersForm.get('isActive')?.value;

    let filtered = this.doctors();

    if (searchTerm) {
      filtered = filtered.filter(doctor =>
        doctor.fullName.toLowerCase().includes(searchTerm) ||
        doctor.email?.toLowerCase().includes(searchTerm) ||
        doctor.username.toLowerCase().includes(searchTerm) ||
        doctor.specialization?.toLowerCase().includes(searchTerm)
      );
    }

    if (specializationFilter) {
      filtered = filtered.filter(doctor =>
        doctor.specialization?.toLowerCase().includes(specializationFilter.toLowerCase())
      );
    }

    if (statusFilter !== null && statusFilter !== undefined) {
      filtered = filtered.filter(doctor => doctor.isActive === statusFilter);
    }

    return filtered;
  });

  // Statistics
  totalDoctors = computed(() => this.doctors().length);
  activeDoctors = computed(() => this.doctors().filter(d => d.isActive).length);
  inactiveDoctors = computed(() => this.doctors().filter(d => !d.isActive).length);

  // Get unique specializations for filtering
  specializations = computed(() => {
    const specs = this.doctors()
      .map(doctor => doctor.specialization)
      .filter((spec): spec is string => !!spec);
    return [...new Set(specs)].sort();
  });

  // ===================================================================
  // FORMS AND TABLE SETUP
  // ===================================================================
  filtersForm: FormGroup;
  dataSource = new MatTableDataSource<User>([]);
  selection = new SelectionModel<User>(true, []);

  displayedColumns: string[] = [
    'select',
    'doctor',
    'specialization',
    'contact',
    'status',
    'clinic',
    'actions'
  ];

  constructor() {
    // Initialize filters form
    this.filtersForm = this.fb.group({
      search: [''],
      specialization: [''],
      isActive: [true]
    });
  }

  // ===================================================================
  // LIFECYCLE HOOKS
  // ===================================================================
  ngOnInit(): void {
    this.initializeComponent();
    this.setupFormSubscriptions();
    this.loadDoctors();
  }

  ngAfterViewInit(): void {
    this.setupTable();
  }

  // ===================================================================
  // INITIALIZATION
  // ===================================================================
  private initializeComponent(): void {
    // Subscribe to service data changes
    this.userService.doctors$.subscribe(doctors => {
      this.dataSource.data = doctors;
    });
  }

  private setupFormSubscriptions(): void {
    // React to filter changes
    this.filtersForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  private setupTable(): void {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }

    // Custom filter predicate
    this.dataSource.filterPredicate = (data: User, filter: string) => {
      const searchTerm = filter.toLowerCase();
      return data.fullName.toLowerCase().includes(searchTerm) ||
        (data.email?.toLowerCase().includes(searchTerm) || false) ||
        data.username.toLowerCase().includes(searchTerm) ||
        (data.specialization?.toLowerCase().includes(searchTerm) || false);
    };
  }

  // ===================================================================
  // DATA LOADING
  // ===================================================================
  async loadDoctors(): Promise<void> {
    try {
      await new Promise<void>((resolve, reject) => {
        this.userService.getDoctors().subscribe({
          next: (response) => {
            if (response.success) {
              resolve();
            } else {
              reject(new Error(response.message));
            }
          },
          error: (error) => reject(error)
        });
      });
    } catch (error) {
      console.error('Error loading doctors:', error);
      this.notificationService.error('خطأ في تحميل قائمة الأطباء');
    }
  }

  // ===================================================================
  // DOCTOR ACTIONS
  // ===================================================================
  viewDoctor(doctor: User): void {
    this.selectedDoctor.set(doctor);
    this.router.navigate(['/users/profile', doctor.id]);
  }

  editDoctor(doctor: User): void {
    this.router.navigate(['/users/edit', doctor.id]);
  }

  async toggleDoctorStatus(doctor: User): Promise<void> {
    const action = doctor.isActive ? 'تعطيل' : 'تفعيل';
    const message = `هل أنت متأكد من ${action} الطبيب ${doctor.fullName}؟`;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: `${action} الطبيب`,
        message: message,
        confirmText: action,
        cancelText: 'إلغاء'
      }
    });

    const confirmed = await dialogRef.afterClosed().toPromise();
    if (confirmed) {
      this.userService.toggleUserStatus(doctor.id, !doctor.isActive).subscribe({
        next: () => {
          // Data will be updated automatically via service subscription
          this.notificationService.success(`تم ${action} الطبيب بنجاح`);
        },
        error: (error) => {
          console.error('Error toggling doctor status:', error);
        }
      });
    }
  }

  contactDoctor(doctor: User, method: 'email' | 'phone'): void {
    if (method === 'email' && doctor.email) {
      window.open(`mailto:${doctor.email}`, '_blank');
    } else if (method === 'phone' && doctor.phone) {
      window.open(`tel:${doctor.phone}`, '_blank');
    } else {
      this.notificationService.warning('معلومات الاتصال غير متوفرة');
    }
  }

  // ===================================================================
  // FILTERING AND SEARCH
  // ===================================================================
  applyFilters(): void {
    const filters = this.filtersForm.value;

    // Apply text search to table
    if (filters.search) {
      this.dataSource.filter = filters.search.trim().toLowerCase();
    } else {
      this.dataSource.filter = '';
    }
  }

  clearFilters(): void {
    this.filtersForm.reset({
      search: '',
      specialization: '',
      isActive: true
    });
  }

  toggleFilters(): void {
    this.showFilters.set(!this.showFilters());
  }

  filterBySpecialization(specialization: string): void {
    this.filtersForm.patchValue({ specialization });
  }

  // ===================================================================
  // TABLE SELECTION
  // ===================================================================
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.dataSource.data.forEach(row => this.selection.select(row));
    }
  }

  checkboxLabel(row?: User): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.id}`;
  }

  // ===================================================================
  // BULK OPERATIONS
  // ===================================================================
  async bulkToggleStatus(activate: boolean): Promise<void> {
    const selectedDoctors = this.selection.selected;
    if (selectedDoctors.length === 0) {
      this.notificationService.warning('يرجى تحديد أطباء أولاً');
      return;
    }

    const action = activate ? 'تفعيل' : 'تعطيل';
    const message = `هل أنت متأكد من ${action} ${selectedDoctors.length} طبيب؟`;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: `${action} متعدد`,
        message: message,
        confirmText: action,
        cancelText: 'إلغاء'
      }
    });

    const confirmed = await dialogRef.afterClosed().toPromise();
    if (confirmed) {
      const promises = selectedDoctors.map(doctor =>
        this.userService.toggleUserStatus(doctor.id, activate).toPromise()
      );

      try {
        await Promise.all(promises);
        this.notificationService.success(`تم ${action} الأطباء بنجاح`);
        this.selection.clear();
        await this.loadDoctors();
      } catch (error) {
        console.error('Error in bulk operation:', error);
        this.notificationService.error('حدث خطأ في العملية');
      }
    }
  }

  // ===================================================================
  // VIEW MODE MANAGEMENT
  // ===================================================================
  switchViewMode(mode: 'table' | 'cards'): void {
    this.viewMode.set(mode);
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================
  getStatusColor(isActive: boolean): string {
    return isActive ? 'primary' : 'warn';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'نشط' : 'معطل';
  }

  getStatusIcon(isActive: boolean): string {
    return isActive ? 'check_circle' : 'cancel';
  }

  getDoctorInitials(doctor: User): string {
    const firstInitial = doctor.firstName?.charAt(0) || '';
    const lastInitial = doctor.lastName?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase();
  }

  getSpecializationColor(specialization?: string): string {
    if (!specialization) return 'primary';

    // Generate consistent color based on specialization
    const colors = ['primary', 'accent', 'warn'];
    const hash = specialization.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  }

  formatPhoneNumber(phone?: string): string {
    if (!phone) return '';
    // Simple phone formatting - adjust based on your locale
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  }

  getDoctorsCountBySpec(spec: string): number {
    return this.doctors().filter(d => d.specialization === spec).length;
  }
  // ===================================================================
  // EXPORT FUNCTIONALITY
  // ===================================================================
  exportDoctors(): void {
    const doctors = this.filteredDoctors();

    if (doctors.length === 0) {
      this.notificationService.warning('لا توجد بيانات للتصدير');
      return;
    }

    const exportData = doctors.map(doctor => ({
      name: doctor.fullName,
      username: doctor.username,
      email: doctor.email || '',
      phone: doctor.phone || '',
      specialization: doctor.specialization || '',
      status: doctor.isActive ? 'نشط' : 'معطل',
      clinic: doctor.clinicName
    }));

    // Convert to CSV
    const headers = ['الاسم', 'اسم المستخدم', 'البريد الإلكتروني', 'الهاتف', 'التخصص', 'الحالة', 'العيادة'];
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `doctors-list-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    this.notificationService.success('تم تصدير قائمة الأطباء بنجاح');
  }

  // ===================================================================
  // NAVIGATION
  // ===================================================================
  navigateToCreateDoctor(): void {
    this.router.navigate(['/users/create'], {
      queryParams: { role: 'DOCTOR' }
    });
  }

  navigateToDoctorSchedule(doctorId: number): void {
    this.router.navigate(['/schedules/doctor', doctorId]);
  }

  navigateToDoctorAppointments(doctorId: number): void {
    this.router.navigate(['/appointments'], {
      queryParams: { doctorId }
    });
  }

  // ===================================================================
  // REFRESH AND CLEANUP
  // ===================================================================
  async refresh(): Promise<void> {
    await this.loadDoctors();
  }

  ngOnDestroy(): void {
    this.selection.clear();
    this.selectedDoctor.set(null);
  }
}
