// ===================================================================
// src/app/features/auth/auth.routes.ts - مسارات المصادقة المُحدثة
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
    path: 'register',
    loadComponent: () => import('./components/register/register.component').then(c => c.RegisterComponent),
    title: 'تسجيل عيادة جديدة - نظام أمان كير'
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./components/forgot-password/forgot-password.component').then(c => c.ForgotPasswordComponent),
    title: 'نسيت كلمة المرور - نظام أمان كير'
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./components/reset-password/reset-password.component').then(c => c.ResetPasswordComponent),
    title: 'إعادة تعيين كلمة المرور - نظام أمان كير'
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./components/verify-email/verify-email.component').then(c => c.VerifyEmailComponent),
    title: 'تأكيد البريد الإلكتروني - نظام أمان كير'
  },
  {
    path: 'account-not-verified',
    loadComponent: () => import('./components/account-not-verified/account-not-verified.component').then(c => c.AccountNotVerifiedComponent),
    title: 'حساب غير مفعل - نظام أمان كير'
  }
];
