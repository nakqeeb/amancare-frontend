// ===================================================================
// src/app/layouts/auth-layout/auth-layout.component.ts
// تخطيط صفحات المصادقة
// ===================================================================
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { ThemeService } from '../../core/services/theme.service';
import { environment } from '../../../environments/environment';

interface AuthRoute {
  path: string;
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule
  ],
  templateUrl: './auth-layout.component.html',
  styleUrls: ['./auth-layout.component.scss']
})
export class AuthLayoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private router = inject(Router);
  private themeService = inject(ThemeService);

  // App info
  appName = environment.appName;
  appVersion = environment.production ? '1.0.0' : 'dev';

  // Current route info
  currentRoute: AuthRoute | null = null;

  // Available auth routes
  authRoutes: AuthRoute[] = [
    {
      path: '/auth/login',
      title: 'تسجيل الدخول',
      description: 'تسجيل الدخول إلى حسابك',
      icon: 'login'
    },
    {
      path: '/auth/register',
      title: 'تسجيل عيادة جديدة',
      description: 'إنشاء حساب جديد لعيادتك',
      icon: 'person_add'
    },
    {
      path: '/auth/forgot-password',
      title: 'نسيت كلمة المرور',
      description: 'استعادة كلمة المرور',
      icon: 'lock_reset'
    }
  ];

  ngOnInit(): void {
    this.setupRouteListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupRouteListener(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      this.updateCurrentRoute(event.url);
    });

    // Set initial route
    this.updateCurrentRoute(this.router.url);
  }

  private updateCurrentRoute(url: string): void {
    this.currentRoute = this.authRoutes.find(route =>
      url.startsWith(route.path)
    ) || null;
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  getCurrentThemeIcon(): string {
    // return this.themeService.isDarkMode() ? 'light_mode' : 'dark_mode';
    return "";
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
  }
}

// ===================================================================
// Auth Layout HTML Template
// ===================================================================
/*
<!-- src/app/layouts/auth-layout/auth-layout.component.html -->

<div class="auth-layout">
  <!-- Header Toolbar -->
  <mat-toolbar class="auth-toolbar">
    <div class="toolbar-content">
      <!-- Brand -->
      <div class="brand" (click)="navigateToHome()">
        <mat-icon class="brand-icon">local_hospital</mat-icon>
        <span class="brand-text">{{ appName }}</span>
        <span class="version-badge">{{ appVersion }}</span>
      </div>

      <!-- Actions -->
      <div class="toolbar-actions">
        <!-- Theme Toggle -->
        <button
          mat-icon-button
          class="theme-toggle"
          (click)="toggleTheme()"
          [title]="'تبديل المظهر'">
          <mat-icon>{{ getCurrentThemeIcon() }}</mat-icon>
        </button>

        <!-- Language Toggle -->
        <button
          mat-icon-button
          class="language-toggle"
          [title]="'تغيير اللغة'">
          <mat-icon>language</mat-icon>
        </button>
      </div>
    </div>
  </mat-toolbar>

  <!-- Main Content Area -->
  <div class="auth-content">
    <!-- Route Header -->
    <div class="route-header" *ngIf="currentRoute">
      <div class="route-info">
        <mat-icon class="route-icon">{{ currentRoute.icon }}</mat-icon>
        <div class="route-text">
          <h2 class="route-title">{{ currentRoute.title }}</h2>
          <p class="route-description">{{ currentRoute.description }}</p>
        </div>
      </div>
    </div>

    <!-- Router Outlet -->
    <div class="content-wrapper">
      <router-outlet></router-outlet>
    </div>
  </div>

  <!-- Footer -->
  <footer class="auth-footer">
    <div class="footer-content">
      <div class="footer-links">
        <a href="#" class="footer-link">الشروط والأحكام</a>
        <span class="separator">•</span>
        <a href="#" class="footer-link">سياسة الخصوصية</a>
        <span class="separator">•</span>
        <a href="#" class="footer-link">الدعم الفني</a>
      </div>
      <div class="copyright">
        <p>&copy; 2024 {{ appName }}. جميع الحقوق محفوظة.</p>
      </div>
    </div>
  </footer>
</div>
*/
