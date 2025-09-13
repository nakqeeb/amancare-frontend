// src/app/shared/components/system-admin-context-indicator/system-admin-context-indicator.component.ts
import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';

import { SystemAdminService } from '../../../core/services/system-admin.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-system-admin-context-indicator',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule
  ],
  templateUrl: './system-admin-context-indicator.component.html',
  styleUrl: './system-admin-context-indicator.component.scss'
})
export class SystemAdminContextIndicatorComponent {
  private router = inject(Router);
  private systemAdminService = inject(SystemAdminService);
  private authService = inject(AuthService);

  // Computed signals
  actingContext = this.systemAdminService.actingClinicContext;
  currentUser = this.authService.currentUser;

  isSystemAdmin = computed(() => {
    const user = this.currentUser();
    return user?.role === 'SYSTEM_ADMIN';
  });

  shouldShowWarning = computed(() => {
    const context = this.actingContext();
    if (!context?.startTime) return false;

    const hoursElapsed = (Date.now() - new Date(context.startTime).getTime()) / (1000 * 60 * 60);
    return hoursElapsed > 12;
  });

  selectContext(): void {
    this.router.navigate(['/admin/select-clinic-context']);
  }

  changeContext(): void {
    this.router.navigate(['/admin/select-clinic-context']);
  }

  clearContext(): void {
    this.systemAdminService.clearActingContext();
  }

  getElapsedTime(): string {
    const context = this.actingContext();
    if (!context?.startTime) return '';

    const elapsed = Date.now() - new Date(context.startTime).getTime();
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `نشط منذ ${hours} ساعة و ${minutes} دقيقة`;
    }
    return `نشط منذ ${minutes} دقيقة`;
  }

  formatStartTime(): string {
    const context = this.actingContext();
    if (!context?.startTime) return '';

    const date = new Date(context.startTime);
    return date.toLocaleDateString('ar-SA') + ' - ' + date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
