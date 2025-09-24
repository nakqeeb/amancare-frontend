// ===================================================================
// src/app/features/users/components/clinic-users/clinic-users.component.ts
// New Standalone Component for Clinic Users Management
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
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatBadgeModule } from '@angular/material/badge';
import { SelectionModel } from '@angular/cdk/collections';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

// Services & Models
import { UserService, ClinicUserStats } from '../../services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { SystemAdminService } from '../../../../core/services/system-admin.service';
import { User, UserRole } from '../../models/user.model';

@Component({
  selector: 'app-clinic-users',
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
    MatTabsModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatDialogModule,
    MatCheckboxModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatSlideToggleModule,
    MatBadgeModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './clinic-users.component.html',
  styleUrls: ['./clinic-users.component.scss']
})
export class ClinicUsersComponent implements OnInit {

  // ===================================================================
  // DEPENDENCY INJECTION
  // ===================================================================
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private systemAdminService = inject(SystemAdminService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  // ===================================================================
  // VIEWCHILD REFERENCES
  // ===================================================================
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // ===================================================================
  // COMPONENT STATE - SIGNALS
  // ===================================================================
  loading = signal(false);
  error = signal<string | null>(null);
  selectedTab = signal(0);

  // Data signals
  clinicUsers = signal<User[]>([]);
  doctors = signal<User[]>([]);
  clinicStats = signal<ClinicUserStats | null>(null);
  selectedUser = signal<User | null>(null);

  // UI state signals
  showFilters = signal(false);
  viewMode = signal<'table' | 'grid'>('table');

  // ===================================================================
  // COMPUTED PROPERTIES
  // ===================================================================
  currentUser = computed(() => this.authService.currentUser());
  isSystemAdmin = computed(() => this.currentUser()?.role === 'SYSTEM_ADMIN');
  canManageUsers = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'SYSTEM_ADMIN' || role === 'ADMIN';
  });

  // Filter computed values
  filteredUsers = computed(() => {
    let users = this.clinicUsers();
    const filters = this.filtersForm.value;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      users = users.filter(user =>
        user.fullName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.username.toLowerCase().includes(searchLower)
      );
    }

    if (filters.role && filters.role !== 'all') {
      users = users.filter(user => user.role === filters.role);
    }

    if (filters.activeOnly !== undefined) {
      users = users.filter(user => user.isActive === filters.activeOnly);
    }

    return users;
  });

  // Statistics computed values
  activeUsersCount = computed(() =>
    this.clinicUsers().filter(user => user.isActive).length
  );

  inactiveUsersCount = computed(() =>
    this.clinicUsers().filter(user => !user.isActive).length
  );

  roleDistribution = computed(() => {
    const users = this.clinicUsers();
    const roles = {
      ADMIN: 0,
      DOCTOR: 0,
      NURSE: 0,
      RECEPTIONIST: 0
    };

    users.forEach(user => {
      if (roles.hasOwnProperty(user.role)) {
        roles[user.role as keyof typeof roles]++;
      }
    });

    return roles;
  });

  // ===================================================================
  // FORMS
  // ===================================================================
  filtersForm: FormGroup;

  // ===================================================================
  // TABLE CONFIGURATION
  // ===================================================================
  displayedColumns: string[] = [
    'select',
    'user',
    'role',
    'specialization',
    'status',
    'lastLogin',
    'actions'
  ];

  dataSource = new MatTableDataSource<User>([]);
  selection = new SelectionModel<User>(true, []);

  // Role options for filtering
  roleOptions = [
    { value: 'all', label: 'جميع الأدوار', icon: 'group' },
    { value: UserRole.ADMIN, label: 'مدير العيادة', icon: 'manage_accounts' },
    { value: UserRole.DOCTOR, label: 'طبيب', icon: 'medical_services' },
    { value: UserRole.NURSE, label: 'ممرض/ممرضة', icon: 'health_and_safety' },
    { value: UserRole.RECEPTIONIST, label: 'موظف استقبال', icon: 'support_agent' }
  ];

  constructor() {
    // Initialize filters form
    this.filtersForm = this.fb.group({
      search: [''],
      role: ['all'],
      activeOnly: [true],
      specialization: ['']
    });
  }

  // ===================================================================
  // LIFECYCLE HOOKS
  // ===================================================================
  ngOnInit(): void {
    this.initializeComponent();
    this.setupFormSubscriptions();
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Custom filter predicate
    this.dataSource.filterPredicate = (data: User, filter: string) => {
      return data.fullName.toLowerCase().includes(filter.toLowerCase()) ||
             data.email.toLowerCase().includes(filter.toLowerCase()) ||
             data.username.toLowerCase().includes(filter.toLowerCase());
    };
  }

  // ===================================================================
  // INITIALIZATION
  // ===================================================================
  private initializeComponent(): void {
    // Set up reactive data binding
    this.userService.clinicUsers$.subscribe(users => {
      this.clinicUsers.set(users);
      this.dataSource.data = users;
    });

    this.userService.doctors$.subscribe(doctors => {
      this.doctors.set(doctors);
    });
  }

  private setupFormSubscriptions(): void {
    // React to filter changes
    this.filtersForm.valueChanges.subscribe(filters => {
      this.applyFilters(filters);
    });
  }

  // ===================================================================
  // DATA LOADING
  // ===================================================================
  async loadData(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Load all data concurrently
      await Promise.all([
        this.loadClinicUsers(),
        this.loadDoctors(),
        this.loadClinicStats()
      ]);
    } catch (error: any) {
      console.error('Error loading clinic users data:', error);
      this.error.set('خطأ في تحميل بيانات المستخدمين');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadClinicUsers(): Promise<void> {
    const filters = this.filtersForm.value;
    return new Promise((resolve, reject) => {
      this.userService.getClinicUsers(
        undefined, // clinicId will be handled by service
        filters.role !== 'all' ? filters.role : undefined,
        filters.activeOnly
      ).subscribe({
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
  }

  private async loadDoctors(): Promise<void> {
    return new Promise((resolve, reject) => {
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
  }

  private async loadClinicStats(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.userService.getClinicUserStats().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.clinicStats.set(response.data);
            resolve();
          } else {
            reject(new Error(response.message));
          }
        },
        error: (error) => reject(error)
      });
    });
  }

  // ===================================================================
  // FILTERING & SEARCH
  // ===================================================================
  applyFilters(filters: any): void {
    // Apply text search
    if (filters.search) {
      this.dataSource.filter = filters.search.trim().toLowerCase();
    } else {
      this.dataSource.filter = '';
    }

    // Re-load data with new filters
    this.loadClinicUsers();
  }

  clearFilters(): void {
    this.filtersForm.reset({
      search: '',
      role: 'all',
      activeOnly: true,
      specialization: ''
    });
  }

  toggleFilters(): void {
    this.showFilters.set(!this.showFilters());
  }

  // ===================================================================
  // USER ACTIONS
  // ===================================================================
  viewUser(user: User): void {
    this.selectedUser.set(user);
    this.router.navigate(['/users/profile', user.id]);
  }

  editUser(user: User): void {
    this.router.navigate(['/users/edit', user.id]);
  }

  async toggleUserStatus(user: User): Promise<void> {
    const action = user.isActive ? 'تعطيل' : 'تفعيل';
    const confirmMessage = `هل أنت متأكد من ${action} المستخدم ${user.fullName}؟`;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: `${action} المستخدم`,
        message: confirmMessage,
        confirmText: action,
        cancelText: 'إلغاء'
      }
    });

    const confirmed = await dialogRef.afterClosed().toPromise();
    if (confirmed) {
      this.userService.toggleUserStatus(user.id, !user.isActive).subscribe({
        next: (response) => {
          if (response.success) {
            // Data will be updated via service subscription
            this.notificationService.success(`تم ${action} المستخدم بنجاح`);
          }
        },
        error: (error) => {
          console.error('Error toggling user status:', error);
        }
      });
    }
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
    const selectedUsers = this.selection.selected;
    if (selectedUsers.length === 0) {
      this.notificationService.warning('يرجى تحديد مستخدمين أولاً');
      return;
    }

    const action = activate ? 'تفعيل' : 'تعطيل';
    const confirmMessage = `هل أنت متأكد من ${action} ${selectedUsers.length} مستخدم؟`;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: `${action} متعدد`,
        message: confirmMessage,
        confirmText: action,
        cancelText: 'إلغاء'
      }
    });

    const confirmed = await dialogRef.afterClosed().toPromise();
    if (confirmed) {
      this.loading.set(true);

      const promises = selectedUsers.map(user =>
        this.userService.toggleUserStatus(user.id, activate).toPromise()
      );

      try {
        await Promise.all(promises);
        this.notificationService.success(`تم ${action} المستخدمين بنجاح`);
        this.selection.clear();
        await this.loadData();
      } catch (error) {
        console.error('Error in bulk operation:', error);
        this.notificationService.error('حدث خطأ في العملية');
      } finally {
        this.loading.set(false);
      }
    }
  }

  // ===================================================================
  // UI UTILITY METHODS
  // ===================================================================
  getRoleDisplayName(role: UserRole): string {
    return this.userService.getRoleDisplayName(role);
  }

  getRoleIcon(role: UserRole): string {
    return this.userService.getRoleIcon(role);
  }

  getRoleColor(role: UserRole): string {
    return this.userService.getRoleColor(role);
  }

  getStatusColor(isActive: boolean): string {
    return isActive ? 'primary' : 'warn';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'نشط' : 'معطل';
  }

  getStatusIcon(isActive: boolean): string {
    return isActive ? 'check_circle' : 'cancel';
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-SA');
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return 'لم يسجل دخول';
    return new Date(dateString).toLocaleString('ar-SA');
  }

  // ===================================================================
  // NAVIGATION
  // ===================================================================
  navigateToUserForm(): void {
    this.router.navigate(['/users/create']);
  }

  navigateToUserProfile(userId: number): void {
    this.router.navigate(['/users/profile', userId]);
  }

  // ===================================================================
  // REFRESH & CLEANUP
  // ===================================================================
  async refresh(): Promise<void> {
    await this.loadData();
  }

  onDestroy(): void {
    this.userService.clearState();
    this.selection.clear();
  }
}
