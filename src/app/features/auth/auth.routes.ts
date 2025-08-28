// ===================================================================
// src/app/features/auth/auth.routes.ts - مسارات المصادقة
// ===================================================================
import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(c => c.LoginComponent),
    title: 'تسجيل الدخول - نظام أمان كير'
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./components/forgot-password/forgot-password.component').then(c => c.ForgotPasswordComponent),
    title: 'نسيت كلمة المرور - نظام أمان كير'
  }
];
