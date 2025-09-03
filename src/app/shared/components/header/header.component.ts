// ===================================================================
// src/app/shared/components/header/header.component.ts
// ===================================================================
import {
  Component,
  inject,
  signal,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { NotificationService } from '../../../core/services/notification.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class HeaderComponent implements OnInit {
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private notificationService = inject(NotificationService);

  // Signals
  currentUser = this.authService.currentUser;
  searchQuery = signal('');
  isDarkTheme = signal(false);

  ngOnInit(): void {
    this.isDarkTheme.set(this.themeService.isDarkTheme());
  }

  toggleSidebar(): void {
    // إرسال حدث لتبديل الـ Sidebar
    document.dispatchEvent(new CustomEvent('toggleSidebar'));
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.isDarkTheme.set(this.themeService.isDarkTheme());
  }

  onSearch(): void {
    const query = this.searchQuery().trim();
    if (query) {
      console.log('البحث عن:', query);
      // تنفيذ البحث
    }
  }

  logout(): void {
    this.authService.logout().subscribe();
  }

  getRoleDisplayName(role?: string): string {
    const roleNames: { [key: string]: string } = {
      SYSTEM_ADMIN: 'مدير النظام',
      ADMIN: 'مدير العيادة',
      DOCTOR: 'طبيب',
      NURSE: 'ممرض/ممرضة',
      RECEPTIONIST: 'موظف استقبال',
    };

    return roleNames[role || ''] || 'مستخدم';
  }
}
