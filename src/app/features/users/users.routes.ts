// ===================================================================
// Users Module Routing
// src/app/features/users/users.routes.ts
// ===================================================================
import { Routes } from '@angular/router';
import { AdminOnlyGuard } from './guards/admin-only.guard';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./components/user-list/user-list.component').then(c => c.UserListComponent),
    canActivate: [AdminOnlyGuard],
    title: 'قائمة المستخدمين - نظام أمان كير'
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./components/user-form/user-form.component').then(c => c.UserFormComponent),
    canActivate: [AdminOnlyGuard],
    title: 'إضافة مستخدم جديد - نظام أمان كير'
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./components/user-form/user-form.component').then(c => c.UserFormComponent),
    canActivate: [AdminOnlyGuard],
    title: 'تعديل المستخدم - نظام أمان كير'
  },
  {
    path: 'profile/:id',
    loadComponent: () =>
      import('./components/user-profile/user-profile.component').then(c => c.UserProfileComponent),
    canActivate: [AdminOnlyGuard],
    title: 'ملف المستخدم - نظام أمان كير'
  },
  {
    path: 'roles',
    loadComponent: () =>
      import('./components/role-management/role-management.component').then(c => c.RoleManagementComponent),
    canActivate: [AdminOnlyGuard],
    title: 'إدارة الأدوار - نظام أمان كير'
  }
];
