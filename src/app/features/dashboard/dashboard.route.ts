// ===================================================================
// src/app/features/dashboard/dashboard.routes.ts - مسارات لوحة التحكم
// ===================================================================
import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/main-dashboard/main-dashboard.component').then(c => c.MainDashboardComponent),
    title: 'لوحة التحكم - نظام أمان كير'
  }
];
