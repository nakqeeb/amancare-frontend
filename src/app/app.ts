import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';

// Services
import { ThemeService } from './core/services/theme.service';
import { LoadingService } from './core/services/loading.service';
import { AuthService } from './core/services/auth.service';

// Components
import { LoadingSpinnerComponent } from './shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    TranslateModule,
    LoadingSpinnerComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  title = 'نظام أمان كير';

  // Services
  private themeService = inject(ThemeService);
  private translateService = inject(TranslateService);
  private router = inject(Router);
  protected loadingService = inject(LoadingService);
  private authService = inject(AuthService);

  // Signals
  isRtl = signal(true);
  showPwaPrompt = signal(false);

  ngOnInit(): void {
    this.initializeApp();
    this.setupRouterEvents();
    this.checkPwaUpdate();
  }

  private initializeApp(): void {
    this.authService.getCurrentUser();
    // إعداد اللغة
    this.translateService.setDefaultLang('ar');
    this.translateService.use('ar');

    // إعداد الثيم
    this.themeService.initializeTheme();

    // تحديد اتجاه النص
    const lang = this.translateService.currentLang;
    this.isRtl.set(lang === 'ar');

    // إعداد اتجاه HTML
    document.documentElement.setAttribute('dir', this.isRtl() ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
  }

  private setupRouterEvents(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // تحديث عنوان الصفحة
        this.updatePageTitle(event.url);

        // التمرير لأعلى الصفحة
        window.scrollTo(0, 0);
      });
  }

  private updatePageTitle(url: string): void {
    let title = 'نظام أمان كير';

    if (url.includes('/dashboard')) {
      title += ' - لوحة التحكم';
    } else if (url.includes('/patients')) {
      title += ' - إدارة المرضى';
    } else if (url.includes('/appointments')) {
      title += ' - المواعيد';
    } else if (url.includes('/medical-records')) {
      title += ' - السجلات الطبية';
    } else if (url.includes('/invoices')) {
      title += ' - الفواتير';
    } else if (url.includes('/reports')) {
      title += ' - التقارير';
    } else if (url.includes('/settings')) {
      title += ' - الإعدادات';
    }

    document.title = title;
  }

  private checkPwaUpdate(): void {
    // Check for PWA updates (will be implemented with service worker)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        this.showPwaPrompt.set(true);
      });
    }
  }

  updatePwa(): void {
    window.location.reload();
  }
}
