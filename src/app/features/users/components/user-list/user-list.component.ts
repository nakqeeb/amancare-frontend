// ===================================================================
// src/app/features/users/components/user-list/user-list.component.ts - UPDATED
// Enhanced with Spring Boot Integration while maintaining backward compatibility
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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

// Services & Models - Updated imports
import { UserService, ClinicUserStats } from '../../services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { SystemAdminService } from '../../../../core/services/system-admin.service';
import { User, UserRole, UserFilters } from '../../models/user.model';

@Component({
  selector: 'app-user-list',
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
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {

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
  // COMPONENT STATE - Enhanced with new Spring Boot data
  // ===================================================================

  // Loading and error states
  loading = computed(() => this.userService.loading());
  error = computed(() => this.userService.error());

  // Data signals - integrated with new backend
  clinicUsers = computed(() => this.userService.clinicUsers());
  doctors = computed(() => this.userService.doctors());
  clinicStats = computed(() => this.userService.clinicUserStats());
  selectedUser = computed(() => this.userService.selectedUser());

  // Legacy users signal for backward compatibility
  users = signal<User[]>([]);

  // UI state
  selectedTab = signal(0);
  viewMode = signal<'table' | 'cards'>('table');
  showFilters = signal(false);

  // ===================================================================
  // COMPUTED PROPERTIES
  // ===================================================================
  currentUser = computed(() => this.authService.currentUser());
  isSystemAdmin = computed(() => this.currentUser()?.role === 'SYSTEM_ADMIN');
  canManageUsers = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'SYSTEM_ADMIN' || role === 'ADMIN';
  });

  // Convert clinic users to legacy User format for backward compatibility
  legacyUsers = computed(() => {
    return this.clinicUsers().map(clinicUser => ({
      id: clinicUser.id,
      username: clinicUser.username,
      email: clinicUser.email,
      firstName: clinicUser.firstName,
      lastName: clinicUser.lastName,
      fullName: clinicUser.fullName,
      phone: clinicUser.phone,
      role: clinicUser.role,
      specialization: clinicUser.specialization,
      isActive: clinicUser.isActive,
      clinicId: clinicUser.clinicId,
      clinicName: clinicUser.clinicName,
      createdAt: clinicUser.createdAt,
      updatedAt: clinicUser.updatedAt,
      lastLogin: clinicUser.lastLogin
    } as User));
  });

  // Filter functionality
  filteredUsers = computed(() => {
    const searchTerm = this.filtersForm.get('search')?.value?.toLowerCase() || '';
    const roleFilter = this.filtersForm.get('role')?.value;
    const statusFilter = this.filtersForm.get('isActive')?.value;

    let filtered = this.clinicUsers();

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.username.toLowerCase().includes(searchTerm)
      );
    }

    if (roleFilter && roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== null && statusFilter !== undefined) {
      filtered = filtered.filter(user => user.isActive === statusFilter);
    }

    return filtered;
  });

  // Statistics
  totalUsers = computed(() => this.clinicUsers().length);
  activeUsers = computed(() => this.clinicUsers().filter(u => u.isActive).length);
  inactiveUsers = computed(() => this.clinicUsers().filter(u => !u.isActive).length);
  totalDoctors = computed(() => this.doctors().length);

  // ===================================================================
  // FORMS AND TABLE SETUP
  // ===================================================================
  filtersForm: FormGroup;
  dataSource = new MatTableDataSource<User>([]);
  selection = new SelectionModel<User>(true, []);

  displayedColumns: string[] = [
    'select',
    'user',
    'role',
    'specialization',
    'status',
    'lastLogin',
    'actions'
  ];

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
      isActive: [true],
      specialization: ['']
    });
  }

  // ===================================================================
  // LIFECYCLE HOOKS
  // ===================================================================
  ngOnInit(): void {
    this.initializeComponent();
    this.setupFormSubscriptions();
    this.loadAllData();
  }

  ngAfterViewInit(): void {
    this.setupTable();
  }

  // ===================================================================
  // INITIALIZATION
  // ===================================================================
  private initializeComponent(): void {
    // Subscribe to service data changes
    this.userService.clinicUsers$.subscribe(clinicUsers => {
      this.dataSource.data = clinicUsers;
      // Update legacy users signal for backward compatibility
      const legacyUsers = clinicUsers.map(cu => this.convertToLegacyUser(cu));
      this.users.set(legacyUsers);
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
             data.email.toLowerCase().includes(searchTerm) ||
             data.username.toLowerCase().includes(searchTerm);
    };
  }

  // ===================================================================
  // DATA LOADING - Enhanced with new Spring Boot endpoints
  // ===================================================================
  async loadAllData(): Promise<void> {
    try {
      // Load all data concurrently using new endpoints
      await Promise.all([
        this.loadClinicUsers(),
        this.loadDoctors(),
        this.loadUserStats()
      ]);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  private async loadClinicUsers(): Promise<void> {
    const filters = this.filtersForm.value;
    return new Promise((resolve, reject) => {
      this.userService.getClinicUsers(
        undefined, // clinicId handled by service
        filters.role !== 'all' ? filters.role : undefined,
        filters.isActive
      ).subscribe({
        next: (response) => resolve(),
        error: (error) => reject(error)
      });
    });
  }

  private async loadDoctors(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.userService.getDoctors().subscribe({
        next: (response) => resolve(),
        error: (error) => reject(error)
      });
    });
  }

  private async loadUserStats(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.userService.getClinicUserStats().subscribe({
        next: (response) => resolve(),
        error: (error) => reject(error)
      });
    });
  }

  // ===================================================================
  // USER ACTIONS - Enhanced with new backend integration
  // ===================================================================

  viewUser(user: User): void {
    this.router.navigate(['/users/profile', user.id]);
  }

  editUser(user: User): void {
    this.router.navigate(['/users/edit', user.id]);
  }

  async toggleUserStatus(user: User): Promise<void> {
    const action = user.isActive ? 'تعطيل' : 'تفعيل';
    const message = `هل أنت متأكد من ${action} المستخدم ${user.fullName}؟`;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: `${action} المستخدم`,
        message: message,
        confirmText: action,
        cancelText: 'إلغاء'
      }
    });

    const confirmed = await dialogRef.afterClosed().toPromise();
    if (confirmed) {
      this.userService.toggleUserStatus(user.id, !user.isActive).subscribe({
        next: () => {
          // Data will be updated automatically via service subscription
        },
        error: (error) => {
          console.error('Error toggling user status:', error);
        }
      });
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

    // Reload data with new filters
    this.loadClinicUsers();
  }

  clearFilters(): void {
    this.filtersForm.reset({
      search: '',
      role: 'all',
      isActive: true,
      specialization: ''
    });
  }

  toggleFilters(): void {
    this.showFilters.set(!this.showFilters());
  }

  // ===================================================================
  // TABLE SELECTION - Enhanced
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
  // BULK OPERATIONS - New functionality
  // ===================================================================

  async bulkActivateUsers(): Promise<void> {
    await this.bulkToggleStatus(true);
  }

  async bulkDeactivateUsers(): Promise<void> {
    await this.bulkToggleStatus(false);
  }

  private async bulkToggleStatus(activate: boolean): Promise<void> {
    const selectedUsers = this.selection.selected;
    if (selectedUsers.length === 0) {
      this.notificationService.warning('يرجى تحديد مستخدمين أولاً');
      return;
    }

    const action = activate ? 'تفعيل' : 'تعطيل';
    const message = `هل أنت متأكد من ${action} ${selectedUsers.length} مستخدم؟`;

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
      const promises = selectedUsers.map(user =>
        this.userService.toggleUserStatus(user.id, activate).toPromise()
      );

      try {
        await Promise.all(promises);
        this.notificationService.success(`تم ${action} المستخدمين بنجاح`);
        this.selection.clear();
      } catch (error) {
        console.error('Error in bulk operation:', error);
        this.notificationService.error('حدث خطأ في العملية');
      }
    }
  }

  // ===================================================================
  // UTILITY METHODS - Enhanced with new data
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
  // BACKWARD COMPATIBILITY METHODS
  // ===================================================================

  /**
   * Convert User to legacy User format for backward compatibility
   */
  private convertToLegacyUser(clinicUser: User): User {
    return {
      id: clinicUser.id,
      username: clinicUser.username,
      email: clinicUser.email,
      firstName: clinicUser.firstName,
      lastName: clinicUser.lastName,
      fullName: clinicUser.fullName,
      phone: clinicUser.phone,
      role: clinicUser.role,
      specialization: clinicUser.specialization,
      isActive: clinicUser.isActive,
      clinicId: clinicUser.clinicId,
      clinicName: clinicUser.clinicName,
      createdAt: clinicUser.createdAt,
      updatedAt: clinicUser.updatedAt,
      lastLogin: clinicUser.lastLogin
    };
  }

  /**
   * Legacy method - use loadClinicUsers instead
   * @deprecated
   */
  loadUsers(): void {
    this.loadClinicUsers();
  }

  /**
   * Legacy method - maintained for compatibility
   * @deprecated Use filteredUsers computed property instead
   */
  getFilteredUsers(): User[] {
    return this.legacyUsers().filter(user => {
      const filters = this.filtersForm.value;
      let matches = true;

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        matches = matches && (
          user.fullName?.toLowerCase().includes(searchTerm) ||
          user.email?.toLowerCase().includes(searchTerm) ||
          user.username?.toLowerCase().includes(searchTerm)
        );
      }

      if (filters.role && filters.role !== 'all') {
        matches = matches && user.role === filters.role;
      }

      if (filters.isActive !== null && filters.isActive !== undefined) {
        matches = matches && user.isActive === filters.isActive;
      }

      return matches;
    });
  }

  // ===================================================================
  // NAVIGATION AND REFRESH
  // ===================================================================

  navigateToCreateUser(): void {
    this.router.navigate(['/users/create']);
  }

  async refresh(): Promise<void> {
    await this.loadAllData();
  }

  // ===================================================================
  // TAB FUNCTIONALITY
  // ===================================================================

  onTabChange(index: number): void {
    this.selectedTab.set(index);

    // Load specific data based on tab
    switch (index) {
      case 0: // All Users
        this.loadClinicUsers();
        break;
      case 1: // Doctors Only
        this.loadDoctors();
        break;
      case 2: // Statistics
        this.loadUserStats();
        break;
    }
  }

  // ===================================================================
  // CLEANUP
  // ===================================================================

  ngOnDestroy(): void {
    this.userService.clearState();
    this.selection.clear();
  }
}
