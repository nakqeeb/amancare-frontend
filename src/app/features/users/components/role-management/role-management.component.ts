// ===================================================================
// Role Management Component
// src/app/features/users/components/role-management/role-management.component.ts
// ===================================================================
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

// Services & Models
import { UserService } from '../../services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { User, UserRole } from '../../models/user.model';

// Permission interfaces
interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  isSystemLevel?: boolean;
}

interface RolePermissions {
  [key: string]: boolean;
}

interface RoleConfig {
  role: UserRole;
  name: string;
  description: string;
  icon: string;
  color: string;
  permissions: RolePermissions;
  userCount: number;
  isSystemRole?: boolean;
}

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTableModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatExpansionModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatInputModule,
    MatMenuModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './role-management.component.html',
  styleUrl: './role-management.component.scss'
})
export class RoleManagementComponent implements OnInit {
  // Services
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  // Signals
  loading = signal(false);
  users = this.userService.users;
  currentUser = this.authService.currentUser;
  selectedTab = signal(0);
  selectedRole = signal<UserRole | null>(null);

  filteredUsers = computed(() => {
    const selectedRole = this.selectedRole();
    if (!selectedRole) return [];
    return this.users().filter(u => u.role === selectedRole);
  });

  hasUsersWithRole = computed(() => this.filteredUsers().length > 0);

  // Available permissions
  permissions: Permission[] = [
    // User Management
    {
      id: 'users.view',
      name: 'عرض المستخدمين',
      description: 'عرض قائمة المستخدمين وملفاتهم الشخصية',
      category: 'إدارة المستخدمين',
      icon: 'people'
    },
    {
      id: 'users.create',
      name: 'إضافة المستخدمين',
      description: 'إنشاء حسابات مستخدمين جديدة',
      category: 'إدارة المستخدمين',
      icon: 'person_add'
    },
    {
      id: 'users.edit',
      name: 'تعديل المستخدمين',
      description: 'تعديل بيانات المستخدمين الموجودين',
      category: 'إدارة المستخدمين',
      icon: 'edit'
    },
    {
      id: 'users.delete',
      name: 'حذف المستخدمين',
      description: 'حذف أو إلغاء تفعيل حسابات المستخدمين',
      category: 'إدارة المستخدمين',
      icon: 'delete'
    },
    {
      id: 'users.reset_password',
      name: 'إعادة تعيين كلمة المرور',
      description: 'إعادة تعيين كلمات مرور المستخدمين',
      category: 'إدارة المستخدمين',
      icon: 'key'
    },

    // Patient Management
    {
      id: 'patients.view',
      name: 'عرض المرضى',
      description: 'عرض قائمة المرضى وملفاتهم',
      category: 'إدارة المرضى',
      icon: 'people'
    },
    {
      id: 'patients.create',
      name: 'إضافة المرضى',
      description: 'تسجيل مرضى جدد في النظام',
      category: 'إدارة المرضى',
      icon: 'person_add'
    },
    {
      id: 'patients.edit',
      name: 'تعديل بيانات المرضى',
      description: 'تحديث معلومات المرضى الشخصية',
      category: 'إدارة المرضى',
      icon: 'edit'
    },
    {
      id: 'patients.delete',
      name: 'حذف المرضى',
      description: 'حذف ملفات المرضى من النظام',
      category: 'إدارة المرضى',
      icon: 'delete'
    },

    // Appointments
    {
      id: 'appointments.view',
      name: 'عرض المواعيد',
      description: 'عرض جدول المواعيد والحجوزات',
      category: 'إدارة المواعيد',
      icon: 'event'
    },
    {
      id: 'appointments.create',
      name: 'حجز المواعيد',
      description: 'إنشاء مواعيد جديدة للمرضى',
      category: 'إدارة المواعيد',
      icon: 'event_available'
    },
    {
      id: 'appointments.edit',
      name: 'تعديل المواعيد',
      description: 'تغيير تفاصيل المواعيد الموجودة',
      category: 'إدارة المواعيد',
      icon: 'edit_calendar'
    },
    {
      id: 'appointments.cancel',
      name: 'إلغاء المواعيد',
      description: 'إلغاء أو تأجيل المواعيد',
      category: 'إدارة المواعيد',
      icon: 'event_busy'
    },

    // Medical Records
    {
      id: 'medical_records.view',
      name: 'عرض السجلات الطبية',
      description: 'الاطلاع على السجلات والتشخيصات الطبية',
      category: 'السجلات الطبية',
      icon: 'folder_special'
    },
    {
      id: 'medical_records.create',
      name: 'إنشاء السجلات الطبية',
      description: 'إضافة سجلات طبية جديدة للمرضى',
      category: 'السجلات الطبية',
      icon: 'note_add'
    },
    {
      id: 'medical_records.edit',
      name: 'تعديل السجلات الطبية',
      description: 'تحديث السجلات والتشخيصات الطبية',
      category: 'السجلات الطبية',
      icon: 'edit_note'
    },
    {
      id: 'medical_records.delete',
      name: 'حذف السجلات الطبية',
      description: 'حذف السجلات الطبية (للأطباء فقط)',
      category: 'السجلات الطبية',
      icon: 'delete'
    },

    // Financial Management
    {
      id: 'invoices.view',
      name: 'عرض الفواتير',
      description: 'عرض الفواتير والمدفوعات',
      category: 'الإدارة المالية',
      icon: 'receipt'
    },
    {
      id: 'invoices.create',
      name: 'إنشاء الفواتير',
      description: 'إصدار فواتير جديدة للمرضى',
      category: 'الإدارة المالية',
      icon: 'receipt_long'
    },
    {
      id: 'invoices.edit',
      name: 'تعديل الفواتير',
      description: 'تحديث تفاصيل الفواتير',
      category: 'الإدارة المالية',
      icon: 'edit'
    },
    {
      id: 'payments.manage',
      name: 'إدارة المدفوعات',
      description: 'تسجيل ومتابعة المدفوعات',
      category: 'الإدارة المالية',
      icon: 'payment'
    },

    // Reports
    {
      id: 'reports.view',
      name: 'عرض التقارير',
      description: 'الاطلاع على التقارير والإحصائيات',
      category: 'التقارير والإحصائيات',
      icon: 'assessment'
    },
    {
      id: 'reports.generate',
      name: 'إنشاء التقارير',
      description: 'إنشاء تقارير مخصصة',
      category: 'التقارير والإحصائيات',
      icon: 'bar_chart'
    },
    {
      id: 'reports.export',
      name: 'تصدير التقارير',
      description: 'تصدير التقارير بصيغ مختلفة',
      category: 'التقارير والإحصائيات',
      icon: 'download'
    },

    // System Administration (System level permissions)
    {
      id: 'system.settings',
      name: 'إعدادات النظام',
      description: 'الوصول لإعدادات النظام العامة',
      category: 'إدارة النظام',
      icon: 'settings',
      isSystemLevel: true
    },
    {
      id: 'system.backup',
      name: 'النسخ الاحتياطي',
      description: 'إنشاء واستعادة النسخ الاحتياطية',
      category: 'إدارة النظام',
      icon: 'backup',
      isSystemLevel: true
    },
    {
      id: 'system.audit',
      name: 'سجلات المراجعة',
      description: 'عرض سجلات أنشطة المستخدمين',
      category: 'إدارة النظام',
      icon: 'history',
      isSystemLevel: true
    }
  ];

  // Role configurations with default permissions
  roleConfigs = signal<RoleConfig[]>([
    {
      role: UserRole.SYSTEM_ADMIN,
      name: 'مدير النظام',
      description: 'صلاحيات كاملة لإدارة النظام والعيادات',
      icon: 'admin_panel_settings',
      color: 'warn',
      userCount: 0,
      isSystemRole: true,
      permissions: this.getSystemAdminPermissions()
    },
    {
      role: UserRole.ADMIN,
      name: 'مدير العيادة',
      description: 'إدارة كاملة للعيادة والموظفين',
      icon: 'manage_accounts',
      color: 'primary',
      userCount: 0,
      permissions: this.getAdminPermissions()
    },
    {
      role: UserRole.DOCTOR,
      name: 'طبيب',
      description: 'إدارة المرضى والسجلات الطبية',
      icon: 'local_hospital',
      color: 'accent',
      userCount: 0,
      permissions: this.getDoctorPermissions()
    },
    {
      role: UserRole.NURSE,
      name: 'ممرض/ممرضة',
      description: 'مساعدة الأطباء وإدارة المواعيد',
      icon: 'healing',
      color: 'primary',
      userCount: 0,
      permissions: this.getNursePermissions()
    },
    {
      role: UserRole.RECEPTIONIST,
      name: 'موظف استقبال',
      description: 'إدارة المواعيد والاستقبال',
      icon: 'person',
      color: 'basic',
      userCount: 0,
      permissions: this.getReceptionistPermissions()
    }
  ]);

  // Computed values
  permissionCategories = computed(() => {
    const categories = new Set(this.permissions.map(p => p.category));
    return Array.from(categories);
  });

  selectedRoleConfig = computed(() => {
    const role = this.selectedRole();
    return role ? this.roleConfigs().find(rc => rc.role === role) : null;
  });

  canModifyRoles = computed(() => {
    const currentUser = this.currentUser();
    return currentUser?.role === UserRole.SYSTEM_ADMIN || currentUser?.role === UserRole.ADMIN;
  });

  ngOnInit(): void {
    this.loadUsers();
    this.updateUserCounts();
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.userService.getUsers().subscribe({
      next: () => {
        this.updateUserCounts();
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private updateUserCounts(): void {
    const users = this.users();
    const configs = this.roleConfigs();

    const updatedConfigs = configs.map(config => ({
      ...config,
      userCount: users.filter(user => user.role === config.role).length
    }));

    this.roleConfigs.set(updatedConfigs);
  }

  // Default permission sets
  private getSystemAdminPermissions(): RolePermissions {
    const permissions: RolePermissions = {};
    this.permissions.forEach(p => {
      permissions[p.id] = true; // System admin has all permissions
    });
    return permissions;
  }

  private getAdminPermissions(): RolePermissions {
    return {
      // User Management
      'users.view': true,
      'users.create': true,
      'users.edit': true,
      'users.delete': true,
      'users.reset_password': true,

      // Patient Management
      'patients.view': true,
      'patients.create': true,
      'patients.edit': true,
      'patients.delete': true,

      // Appointments
      'appointments.view': true,
      'appointments.create': true,
      'appointments.edit': true,
      'appointments.cancel': true,

      // Medical Records (limited)
      'medical_records.view': true,

      // Financial Management
      'invoices.view': true,
      'invoices.create': true,
      'invoices.edit': true,
      'payments.manage': true,

      // Reports
      'reports.view': true,
      'reports.generate': true,
      'reports.export': true,

      // No system level permissions
      'system.settings': false,
      'system.backup': false,
      'system.audit': false
    };
  }

  private getDoctorPermissions(): RolePermissions {
    return {
      // User Management (none)
      'users.view': false,
      'users.create': false,
      'users.edit': false,
      'users.delete': false,
      'users.reset_password': false,

      // Patient Management
      'patients.view': true,
      'patients.create': true,
      'patients.edit': true,
      'patients.delete': false,

      // Appointments
      'appointments.view': true,
      'appointments.create': true,
      'appointments.edit': true,
      'appointments.cancel': true,

      // Medical Records (full access)
      'medical_records.view': true,
      'medical_records.create': true,
      'medical_records.edit': true,
      'medical_records.delete': true,

      // Financial Management (limited)
      'invoices.view': true,
      'invoices.create': false,
      'invoices.edit': false,
      'payments.manage': false,

      // Reports (limited)
      'reports.view': true,
      'reports.generate': false,
      'reports.export': false,

      // No system permissions
      'system.settings': false,
      'system.backup': false,
      'system.audit': false
    };
  }

  private getNursePermissions(): RolePermissions {
    return {
      // User Management (none)
      'users.view': false,
      'users.create': false,
      'users.edit': false,
      'users.delete': false,
      'users.reset_password': false,

      // Patient Management
      'patients.view': true,
      'patients.create': false,
      'patients.edit': true,
      'patients.delete': false,

      // Appointments
      'appointments.view': true,
      'appointments.create': true,
      'appointments.edit': true,
      'appointments.cancel': false,

      // Medical Records (limited)
      'medical_records.view': true,
      'medical_records.create': false,
      'medical_records.edit': false,
      'medical_records.delete': false,

      // Financial Management (none)
      'invoices.view': false,
      'invoices.create': false,
      'invoices.edit': false,
      'payments.manage': false,

      // Reports (none)
      'reports.view': false,
      'reports.generate': false,
      'reports.export': false,

      // No system permissions
      'system.settings': false,
      'system.backup': false,
      'system.audit': false
    };
  }

  private getReceptionistPermissions(): RolePermissions {
    return {
      // User Management (none)
      'users.view': false,
      'users.create': false,
      'users.edit': false,
      'users.delete': false,
      'users.reset_password': false,

      // Patient Management
      'patients.view': true,
      'patients.create': true,
      'patients.edit': true,
      'patients.delete': false,

      // Appointments (full access)
      'appointments.view': true,
      'appointments.create': true,
      'appointments.edit': true,
      'appointments.cancel': true,

      // Medical Records (none)
      'medical_records.view': false,
      'medical_records.create': false,
      'medical_records.edit': false,
      'medical_records.delete': false,

      // Financial Management
      'invoices.view': true,
      'invoices.create': true,
      'invoices.edit': true,
      'payments.manage': true,

      // Reports (none)
      'reports.view': false,
      'reports.generate': false,
      'reports.export': false,

      // No system permissions
      'system.settings': false,
      'system.backup': false,
      'system.audit': false
    };
  }

  // Event handlers
  onRoleSelect(role: UserRole): void {
    this.selectedRole.set(role);
  }

  onPermissionToggle(permissionId: string, enabled: boolean): void {
    const configs = this.roleConfigs();
    const roleConfig = configs.find(rc => rc.role === this.selectedRole());

    if (roleConfig) {
      roleConfig.permissions[permissionId] = enabled;
      this.roleConfigs.set([...configs]);
    }
  }

  onSavePermissions(): void {
    const roleConfig = this.selectedRoleConfig();
    if (!roleConfig) return;

    // TODO: Save permissions to backend
    this.notificationService.success(`تم حفظ صلاحيات ${roleConfig.name} بنجاح`);
  }

  onResetToDefaults(): void {
    const roleConfig = this.selectedRoleConfig();
    if (!roleConfig) return;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'استعادة الصلاحيات الافتراضية',
        message: `هل أنت متأكد من استعادة الصلاحيات الافتراضية لدور ${roleConfig.name}؟`,
        confirmText: 'استعادة',
        cancelText: 'إلغاء',
        type: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.resetRolePermissions(roleConfig.role);
      }
    });
  }

  private resetRolePermissions(role: UserRole): void {
    const configs = this.roleConfigs();
    const configIndex = configs.findIndex(rc => rc.role === role);

    if (configIndex !== -1) {
      let defaultPermissions: RolePermissions;

      switch (role) {
        case UserRole.SYSTEM_ADMIN:
          defaultPermissions = this.getSystemAdminPermissions();
          break;
        case UserRole.ADMIN:
          defaultPermissions = this.getAdminPermissions();
          break;
        case UserRole.DOCTOR:
          defaultPermissions = this.getDoctorPermissions();
          break;
        case UserRole.NURSE:
          defaultPermissions = this.getNursePermissions();
          break;
        case UserRole.RECEPTIONIST:
          defaultPermissions = this.getReceptionistPermissions();
          break;
        default:
          return;
      }

      configs[configIndex].permissions = defaultPermissions;
      this.roleConfigs.set([...configs]);
      this.notificationService.success('تم استعادة الصلاحيات الافتراضية');
    }
  }

  // Utility methods
  getPermissionsByCategory(category: string): Permission[] {
    return this.permissions.filter(p => p.category === category);
  }

  hasPermission(permissionId: string): boolean {
    const roleConfig = this.selectedRoleConfig();
    return roleConfig?.permissions[permissionId] || false;
  }

  canModifyPermission(permission: Permission): boolean {
    const currentUser = this.currentUser();

    // System level permissions can only be modified by system admin
    if (permission.isSystemLevel) {
      return currentUser?.role === UserRole.SYSTEM_ADMIN;
    }

    return this.canModifyRoles();
  }

  onTabChange(index: number): void {
    this.selectedTab.set(index);
  }

  onBulkAssignRole(): void {
    // TODO: Implement bulk role assignment
    this.notificationService.info('ميزة التعيين المجمع للأدوار ستتوفر قريباً');
  }

  onExportRoleMatrix(): void {
    // TODO: Implement role matrix export
    this.notificationService.info('ميزة تصدير مصفوفة الأدوار ستتوفر قريباً');
  }

  // Method to count active permissions for a given role configuration
  getPermissionCount(roleConfig: RoleConfig): number {
    return Object.values(roleConfig.permissions).filter(hasPermission => hasPermission).length;
  }
}
