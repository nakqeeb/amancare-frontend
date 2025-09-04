// ===================================================================
// src/app/features/dashboard/components/quick-actions/quick-actions.component.ts
// ===================================================================
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';

import { AuthService, UserRole } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  color: string;
  route?: string;
  action?: () => void;
  roles?: UserRole[];
}

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule
  ],
  templateUrl: './quick-actions.component.html',
  styleUrl: './quick-actions.component.scss'
})

export class QuickActionsComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  quickActions: QuickAction[] = [
    {
      title: 'إضافة مريض جديد',
      description: 'تسجيل مريض جديد في النظام',
      icon: 'person_add',
      color: 'primary',
      route: '/patients/new'
    },
    {
      title: 'حجز موعد',
      description: 'حجز موعد جديد للمريض',
      icon: 'event_available',
      color: 'info',
      route: '/appointments/new'
    },
    {
      title: 'إنشاء سجل طبي',
      description: 'إضافة سجل طبي جديد',
      icon: 'note_add',
      color: 'success',
      route: '/medical-records/new',
      roles: ['DOCTOR', 'NURSE', 'ADMIN']
    },
    {
      title: 'إنشاء فاتورة',
      description: 'إصدار فاتورة جديدة للمريض',
      icon: 'receipt_long',
      color: 'warning',
      route: '/invoices/new'
    },
    {
      title: 'البحث عن مريض',
      description: 'البحث في قاعدة بيانات المرضى',
      icon: 'search',
      color: 'primary',
      action: () => this.openPatientSearch()
    },
    {
      title: 'مواعيد اليوم',
      description: 'عرض جميع مواعيد اليوم',
      icon: 'today',
      color: 'info',
      route: '/appointments?filter=today'
    },
    {
      title: 'إدارة المستخدمين',
      description: 'إضافة وتعديل المستخدمين',
      icon: 'group',
      color: 'primary',
      route: '/users',
      roles: ['ADMIN', 'SYSTEM_ADMIN']
    },
    {
      title: 'التقارير المالية',
      description: 'عرض تقارير الإيرادات والمصروفات',
      icon: 'assessment',
      color: 'success',
      route: '/reports/financial',
      roles: ['ADMIN', 'SYSTEM_ADMIN']
    }
  ];

  hasPermission(roles?: UserRole[]): boolean {
    if (!roles || roles.length === 0) {
      return true;
    }

    return this.authService.hasRole(roles);
  }

  openPatientSearch(): void {
    this.notificationService.info('جاري فتح البحث المتقدم...');
    this.router.navigate(['/patients'], { queryParams: { search: 'true' } });
  }
}
