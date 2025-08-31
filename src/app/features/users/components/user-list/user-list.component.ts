// ===================================================================
// User List Component - Clean Version
// src/app/features/users/components/user-list/user-list.component.ts
// ===================================================================
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
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
import { SelectionModel } from '@angular/cdk/collections';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

// Services & Models
import { UserService } from '../../services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { User, UserRole, UserFilters, UserStatsDto } from '../../models/user.model';

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
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent implements OnInit {
  // Services
  userService = inject(UserService); // Public for template access
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // Signals
  users = this.userService.users;
  loading = this.userService.loading;
  userStats = this.userService.userStats;
  currentUser = this.authService.currentUser;
  totalUsers = signal(0);

  // Computed values for stats cards
  activeUsersCount = computed(() => this.userStats()?.activeUsers || 0);
  inactiveUsersCount = computed(() => this.userStats()?.inactiveUsers || 0);
  doctorsCount = computed(() => this.userStats()?.doctorsCount || 0);
  nursesCount = computed(() => this.userStats()?.nursesCount || 0);

  // Selection
  selection = new SelectionModel<User>(true, []);

  // Filter form
  filterForm!: FormGroup;

  // Role options
  roleOptions = [
    { value: '', label: 'جميع الأدوار' },
    { value: UserRole.ADMIN, label: 'مدير العيادة' },
    { value: UserRole.DOCTOR, label: 'طبيب' },
    { value: UserRole.NURSE, label: 'ممرض/ممرضة' },
    { value: UserRole.RECEPTIONIST, label: 'موظف استقبال' }
  ];

  // Status options
  statusOptions = [
    { value: '', label: 'جميع الحالات' },
    { value: 'true', label: 'نشط' },
    { value: 'false', label: 'غير نشط' }
  ];

  ngOnInit(): void {
    this.initializeForm();
    this.loadUsers();
    this.loadUserStats();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      search: [''],
      role: [''],
      isActive: [''],
      sortBy: ['fullName'],
      sortDirection: ['ASC']
    });

    // Subscribe to form changes for real-time filtering
    this.filterForm.valueChanges.subscribe(() => {
      this.onFilterChange();
    });
  }

  private loadUsers(): void {
    const filters: UserFilters = {
      ...this.filterForm.value
    };

    this.userService.getUsers(filters).subscribe({
      next: (response) => {
        this.totalUsers.set(response.totalElements);
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
  }

  private loadUserStats(): void {
    this.userService.getUserStats().subscribe({
      error: (error) => {
        console.error('Error loading user stats:', error);
      }
    });
  }

  // Public method for template access
  refreshUsers(): void {
    this.loadUsers();
  }

  onFilterChange(): void {
    this.loadUsers();
  }

  onSelectionChange(user: User): void {
    this.selection.toggle(user);
  }

  onSelectAll(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.users().forEach(user => {
        if (user.id !== this.currentUser()?.id) {
          this.selection.select(user);
        }
      });
    }
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.users().filter(user => user.id !== this.currentUser()?.id).length;
    return numSelected === numRows;
  }

  // Navigation methods
  onNewUser(): void {
    this.router.navigate(['/users/new']);
  }

  onViewUser(user: User): void {
    this.router.navigate(['/users/profile', user.id]);
  }

  onEditUser(user: User): void {
    this.router.navigate(['/users/edit', user.id]);
  }

  // User actions
  onResetPassword(user: User): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'إعادة تعيين كلمة المرور',
        message: `هل أنت متأكد من إعادة تعيين كلمة المرور للمستخدم "${user.firstName} ${user.lastName}"؟`,
        confirmText: 'إعادة تعيين',
        cancelText: 'إلغاء',
        type: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userService.resetUserPassword(user.id!).subscribe({
          next: (response) => {
            this.snackBar.open(
              `تم إعادة تعيين كلمة المرور. كلمة المرور المؤقتة: ${response.temporaryPassword}`,
              'إغلاق',
              { duration: 10000 }
            );
          }
        });
      }
    });
  }

  onToggleStatus(user: User): void {
    const action = user.isActive ? 'إلغاء تفعيل' : 'تفعيل';
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: `${action} المستخدم`,
        message: `هل أنت متأكد من ${action} المستخدم "${user.firstName} ${user.lastName}"؟`,
        confirmText: action,
        cancelText: 'إلغاء',
        type: user.isActive ? 'warn' : 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const operation = user.isActive ?
          this.userService.deactivateUser(user.id!) :
          this.userService.activateUser(user.id!);

        operation.subscribe({
          next: () => {
            this.loadUsers();
            this.loadUserStats();
          }
        });
      }
    });
  }

  // Bulk operations
  onBulkActivate(): void {
    const selectedIds = this.selection.selected.map(user => user.id!);
    this.userService.bulkActivateUsers(selectedIds).subscribe({
      next: () => {
        this.selection.clear();
        this.loadUsers();
        this.loadUserStats();
      }
    });
  }

  onBulkDeactivate(): void {
    const selectedIds = this.selection.selected.map(user => user.id!);
    this.userService.bulkDeactivateUsers(selectedIds).subscribe({
      next: () => {
        this.selection.clear();
        this.loadUsers();
        this.loadUserStats();
      }
    });
  }

  // Permission checks
  canEdit(user: User): boolean {
    return user.id !== this.currentUser()?.id;
  }

  canResetPassword(user: User): boolean {
    return user.id !== this.currentUser()?.id;
  }

  canToggleStatus(user: User): boolean {
    return user.id !== this.currentUser()?.id;
  }

  // Utility methods
  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      role: '',
      isActive: '',
      sortBy: 'fullName',
      sortDirection: 'ASC'
    });
  }

  exportUsers(): void {
    // TODO: Implement export functionality
    this.notificationService.info('ميزة التصدير ستتوفر قريباً');
  }

  hasSelectedUsers(): boolean {
    return this.selection.selected.length > 0;
  }

  // Utility methods for template
  getUserStatusIcon(user: User): string {
    return user.isActive ? 'block' : 'check_circle';
  }

  getUserStatusLabel(user: User): string {
    return user.isActive ? 'إلغاء التفعيل' : 'تفعيل';
  }

  getUserStatusColor(user: User): 'warn' | 'primary' {
    return user.isActive ? 'warn' : 'primary';
  }
}
