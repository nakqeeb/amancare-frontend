// ===================================================================
// src/app/shared/components/sidebar/sidebar.component.ts
// ===================================================================
import { Component, inject, signal, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService, UserRole } from '../../../core/services/auth.service';

interface MenuItem {
  title: string;
  icon: string;
  route: string;
  roles?: UserRole[];
  children?: MenuItem[];
  badge?: number;
  expanded?: boolean;
}


@Component({
  selector: 'app-sidebar',
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class SidebarComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Signals
  currentUser = this.authService.currentUser;
  isOpen = signal(true);
  sidenavMode = signal<'side' | 'over'>('side');
  menuItems = signal<MenuItem[]>([]);

  private eventListener?: () => void;

  ngOnInit(): void {
    this.setupMenuItems();
    this.handleResize();
    this.setupEventListeners();

    // مراقبة تغيير حجم النافذة
    window.addEventListener('resize', () => this.handleResize());
  }

  ngOnDestroy(): void {
    if (this.eventListener) {
      document.removeEventListener('toggleSidebar', this.eventListener);
    }
    window.removeEventListener('resize', () => this.handleResize());
  }

  private setupMenuItems(): void {
    const items: MenuItem[] = [
      {
        title: 'لوحة التحكم',
        icon: 'dashboard',
        route: '/dashboard'
      },
      {
        title: 'تحديد سياق العيادة',
        icon: 'business',
        route: '/admin/select-clinic-context',
        roles: ['SYSTEM_ADMIN']
      },
      {
        title: 'المواعيد',
        icon: 'event',
        expanded: false,
        roles: ['SYSTEM_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'],
        route: '',
        children: [
          {
            title: 'جميع المواعيد',
            icon: 'list',
            route: '/appointments',
            roles: ['SYSTEM_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']
          },
          {
            title: 'موعد جديد',
            icon: 'add_circle',
            route: '/appointments/new',
            roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST']
          },
          {
            title: 'التقويم',
            icon: 'calendar_today',
            route: '/appointments/calendar',
            roles: ['SYSTEM_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']
          },
          {
            title: 'مواعيد اليوم',
            icon: 'today',
            route: '/appointments/today',
            roles: ['SYSTEM_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']
          }
        ],
      },
      {
        title: 'المرضى',
        icon: 'people',
        expanded: false,
        roles: ['SYSTEM_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'],
        route: '',
        badge: 5,
        children: [
          {
            title: 'قائمة المرضى',
            icon: 'list',
            route: '/patients',
            roles: ['SYSTEM_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']
          },
          {
            title: 'البحث المتقدم',
            icon: 'person_search',
            route: '/patients/search',
            roles: ['SYSTEM_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']
          },
          {
            title: 'إضافة مريض',
            icon: 'person_add',
            route: '/patients/new',
            roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']
          }
        ]
      },
      // ===================================================================
      // SCHEDULES MENU - New Addition
      // ===================================================================
      {
        title: 'جداول الأطباء',
        icon: 'schedule',
        route: '/schedules',
        roles: ['SYSTEM_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'],
        badge: 5,
        children: [
          {
            title: 'عرض الجداول',
            icon: 'view_list',
            route: '/schedules',
            roles: ['SYSTEM_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']
          },
          {
            title: 'التقويم',
            icon: 'calendar_month',
            route: '/schedules/calendar',
            roles: ['SYSTEM_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']
          },
          {
            title: 'فحص التوفر',
            icon: 'check_circle',
            route: '/schedules/availability',
            roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']
          },
          {
            title: 'إنشاء جدولة',
            icon: 'add_circle',
            route: '/schedules/create',
            roles: ['ADMIN', 'DOCTOR']
          },
          {
            title: 'إدارة عدم التوفر',
            icon: 'event_busy',
            route: '/schedules/unavailability/create',
            roles: ['ADMIN', 'SYSTEM_ADMIN']
          }
        ]
      },
      {
        title: 'السجلات الطبية',
        icon: 'description',
        expanded: false,
        roles: ['SYSTEM_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE'],
        route: '',
        children: [
          {
            title: 'قائمة السجلات',
            icon: 'list',
            route: '/medical-records/list',
            roles: ['SYSTEM_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE']
          },
          {
            title: 'سجل جديد',
            icon: 'add_circle',
            route: '/medical-records/new',
            roles: ['DOCTOR', 'ADMIN', 'SYSTEM_ADMIN']
          },
          {
            title: 'البحث المتقدم',
            icon: 'search',
            route: '/medical-records/search',
            roles: ['SYSTEM_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE']
          },
          {
            title: 'الإحصائيات',
            icon: 'analytics',
            route: '/medical-records/statistics',
            roles: ['DOCTOR', 'ADMIN', 'SYSTEM_ADMIN']
          }
        ]
      },
      {
        title: 'الفواتير',
        icon: 'receipt_long',
        route: '/invoices',
        roles: ['SYSTEM_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE'],
      },
      // {
      //   title: 'المواعيد',
      //   icon: 'event',
      //   route: '/appointments',
      //   badge: 12
      // },
      {
        title: 'التقارير',
        icon: 'assessment',
        route: '/reports',
        roles: ['ADMIN', 'SYSTEM_ADMIN', 'DOCTOR'],
        children: [
          {
            title: 'التقارير المالية',
            icon: 'attach_money',
            route: '/reports/financial'
          },
          {
            title: 'تقارير المرضى',
            icon: 'person_search',
            route: '/reports/patients'
          },
          {
            title: 'تقارير المواعيد',
            icon: 'event_note',
            route: '/reports/appointments'
          }
        ]
      },
      {
        title: 'إدارة المستخدمين',
        icon: 'admin_panel_settings',
        route: '/users',
        roles: ['ADMIN', 'SYSTEM_ADMIN'],
        children: [
          {
            title: 'جميع المستخدمين',
            icon: 'people',
            route: '/users/list',
            roles: ['ADMIN', 'SYSTEM_ADMIN']
          },
          {
            title: 'مستخدمو العيادة',
            icon: 'business',
            route: '/users/clinic-users',
            roles: ['ADMIN', 'SYSTEM_ADMIN']
          },
          {
            title: 'قائمة الأطباء',
            icon: 'medical_services',
            route: '/users/doctors',
            roles: ['ADMIN', 'SYSTEM_ADMIN']
          },
          {
            title: 'إحصائيات المستخدمين',
            icon: 'analytics',
            route: '/users/statistics',
            roles: ['ADMIN', 'SYSTEM_ADMIN']
          },
          {
            title: 'الممرضين',
            icon: 'health_and_safety',
            route: '/users/nurses',
            roles: ['ADMIN', 'SYSTEM_ADMIN', 'DOCTOR']
          },
          {
            title: 'موظفو الاستقبال',
            icon: 'support_agent',
            route: '/users/receptionists',
            roles: ['ADMIN', 'SYSTEM_ADMIN']
          }
        ]
      },
    ];

    this.menuItems.set(items);
  }

  private setupEventListeners(): void {
    this.eventListener = () => {
      this.isOpen.update(open => !open);
    };

    document.addEventListener('toggleSidebar', this.eventListener);
  }

  private handleResize(): void {
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      this.sidenavMode.set('over');
      this.isOpen.set(false);
    } else {
      this.sidenavMode.set('side');
      this.isOpen.set(true);
    }
  }

  toggleMenuItem(item: MenuItem): void {
    if (item.children) {
      item.expanded = !item.expanded;
    }
  }

  hasPermission(roles?: UserRole[]): boolean {
    if (!roles || roles.length === 0) {
      return true;
    }

    return this.authService.hasRole(roles);
  }

  getRoleDisplayName(role?: string): string {
    const roleNames: { [key: string]: string } = {
      'SYSTEM_ADMIN': 'مدير النظام',
      'ADMIN': 'مدير العيادة',
      'DOCTOR': 'طبيب',
      'NURSE': 'ممرض/ممرضة',
      'RECEPTIONIST': 'موظف استقبال'
    };

    return roleNames[role || ''] || 'مستخدم';
  }
}
