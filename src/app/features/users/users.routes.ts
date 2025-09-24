// ===================================================================
// Users Module Routing
// src/app/features/users/users.routes.ts
// ===================================================================
import { Routes } from '@angular/router';
import { AdminOnlyGuard } from './guards/admin-only.guard';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';
import { ClinicUsersComponent } from './components/clinic-users/clinic-users.component';
import { DoctorsListComponent } from './components/doctors-list/doctors-list.component';
import { RoleManagementComponent } from './components/role-management/role-management.component';
import { UserFormComponent } from './components/user-form/user-form.component';
import { UserListComponent } from './components/user-list/user-list.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { UserStatisticsComponent } from './components/user-statistics/user-statistics.component';

export const USERS_ROUTES: Routes =[
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      // ===================================================================
      // DEFAULT REDIRECT
      // ===================================================================
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full'
      },

      // ===================================================================
      // USER LIST AND MANAGEMENT - Enhanced with Spring Boot endpoints
      // ===================================================================

      // Main users list (backward compatible)
      {
        path: 'list',
        component: UserListComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['SYSTEM_ADMIN', 'ADMIN'],
          title: 'قائمة المستخدمين',
          description: 'عرض وإدارة جميع المستخدمين'
        }
      },

      // New clinic users management (Spring Boot integrated)
      {
        path: 'clinic-users',
        component: ClinicUsersComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['SYSTEM_ADMIN', 'ADMIN'],
          title: 'إدارة مستخدمي العيادة',
          description: 'إدارة متقدمة لمستخدمي العيادة'
        }
      },

      // ===================================================================
      // DOCTORS MANAGEMENT - Specialized endpoint
      // ===================================================================

      // Doctors list using dedicated endpoint
      {
        path: 'doctors',
        component: DoctorsListComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['SYSTEM_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'],
          title: 'قائمة الأطباء',
          description: 'عرض وإدارة الأطباء في العيادة'
        }
      },

      // Individual doctor profile
      {
        path: 'doctors/:id',
        component: UserProfileComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['SYSTEM_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'],
          title: 'ملف الطبيب',
          description: 'عرض معلومات الطبيب التفصيلية'
        }
      },

      // ===================================================================
      // USER STATISTICS - New component for clinic stats
      // ===================================================================

      // User statistics dashboard
      {
        path: 'statistics',
        component: UserStatisticsComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['SYSTEM_ADMIN', 'ADMIN'],
          title: 'إحصائيات المستخدمين',
          description: 'إحصائيات وتحليلات مستخدمي العيادة'
        }
      },

      // ===================================================================
      // USER FORM - Create and Edit
      // ===================================================================

      // Create new user
      {
        path: 'create',
        component: UserFormComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['SYSTEM_ADMIN', 'ADMIN'],
          title: 'إضافة مستخدم جديد',
          description: 'إنشاء حساب مستخدم جديد في العيادة',
          mode: 'create'
        }
      },

      // Edit existing user
      {
        path: 'edit/:id',
        component: UserFormComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['SYSTEM_ADMIN', 'ADMIN'],
          title: 'تعديل المستخدم',
          description: 'تعديل معلومات المستخدم',
          mode: 'edit'
        }
      },

      // ===================================================================
      // USER PROFILE - Enhanced with new backend data
      // ===================================================================

      // User profile view
      {
        path: 'profile/:id',
        component: UserProfileComponent,
        canActivate: [AuthGuard],
        data: {
          title: 'الملف الشخصي',
          description: 'عرض معلومات المستخدم التفصيلية'
        }
      },

      // Current user profile (self)
      {
        path: 'profile',
        component: UserProfileComponent,
        canActivate: [AuthGuard],
        data: {
          title: 'ملفي الشخصي',
          description: 'عرض وتعديل معلوماتك الشخصية',
          isSelfProfile: true
        }
      },

      // ===================================================================
      // ROLE MANAGEMENT - Advanced permissions
      // ===================================================================

      // Role management dashboard
      {
        path: 'roles',
        component: RoleManagementComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['SYSTEM_ADMIN'],
          title: 'إدارة الأدوار',
          description: 'إدارة أدوار وصلاحيات المستخدمين'
        }
      },

      // ===================================================================
      // SPECIALIZED ROUTES - Based on roles
      // ===================================================================

      // Nurses list (filtered view)
      {
        path: 'nurses',
        component: ClinicUsersComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['SYSTEM_ADMIN', 'ADMIN', 'DOCTOR'],
          title: 'قائمة الممرضين',
          description: 'عرض وإدارة الممرضين في العيادة',
          defaultRole: 'NURSE'
        }
      },

      // Receptionists list (filtered view)
      {
        path: 'receptionists',
        component: ClinicUsersComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['SYSTEM_ADMIN', 'ADMIN'],
          title: 'موظفو الاستقبال',
          description: 'عرض وإدارة موظفي الاستقبال',
          defaultRole: 'RECEPTIONIST'
        }
      },

      // Admins list (SYSTEM_ADMIN only)
      {
        path: 'admins',
        component: ClinicUsersComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['SYSTEM_ADMIN'],
          title: 'مديرو العيادات',
          description: 'عرض وإدارة مديري العيادات',
          defaultRole: 'ADMIN'
        }
      },

      // ===================================================================
      // USER ACTIONS - Quick action routes
      // ===================================================================

      // Toggle user status (for quick actions)
      {
        path: 'toggle-status/:id',
        redirectTo: 'profile/:id',
        pathMatch: 'full'
      },

      // User activity logs
      {
        path: 'activity/:id',
        component: UserProfileComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['SYSTEM_ADMIN', 'ADMIN'],
          title: 'سجل نشاط المستخدم',
          description: 'عرض سجل أنشطة المستخدم',
          activeTab: 'activity'
        }
      },

      // ===================================================================
      // BULK OPERATIONS - For management purposes
      // ===================================================================

      // Bulk user management
      {
        path: 'bulk-manage',
        component: ClinicUsersComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['SYSTEM_ADMIN', 'ADMIN'],
          title: 'إدارة متعددة للمستخدمين',
          description: 'تنفيذ عمليات متعددة على المستخدمين',
          enableBulkOperations: true
        }
      },

      // ===================================================================
      // IMPORT/EXPORT ROUTES
      // ===================================================================

      // User import (if needed)
      {
        path: 'import',
        component: UserFormComponent, // Can be extended for import functionality
        canActivate: [RoleGuard],
        data: {
          roles: ['SYSTEM_ADMIN', 'ADMIN'],
          title: 'استيراد المستخدمين',
          description: 'استيراد قائمة المستخدمين من ملف',
          mode: 'import'
        }
      },

      // ===================================================================
      // ERROR HANDLING AND FALLBACK
      // ===================================================================

      // Fallback route for unmatched paths
      {
        path: '**',
        redirectTo: 'list',
        pathMatch: 'full'
      }
    ]
  }
];
