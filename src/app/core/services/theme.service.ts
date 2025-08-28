import { inject, Injectable, signal } from '@angular/core';
import { StorageService } from './storage.service';

// ===================================================================
// src/app/core/services/theme.service.ts - خدمة الثيم
// ===================================================================
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private storageService = inject(StorageService);

  private readonly THEME_KEY = 'amancare_theme';
  private currentTheme = signal<'light' | 'dark'>('light');

  /**
   * تهيئة الثيم
   */
  initializeTheme(): void {
    const savedTheme = this.storageService.getItem<'light' | 'dark'>(this.THEME_KEY);
    const theme = savedTheme || 'light';
    this.setTheme(theme);
  }

  /**
   * تعيين الثيم
   */
  setTheme(theme: 'light' | 'dark'): void {
    this.currentTheme.set(theme);
    this.storageService.setItem(this.THEME_KEY, theme);

    // تطبيق الثيم على الـ DOM
    document.documentElement.setAttribute('data-theme', theme);

    // إضافة/إزالة class للثيم الداكن
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  /**
   * تبديل الثيم
   */
  toggleTheme(): void {
    const newTheme = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * الحصول على الثيم الحالي
   */
  getCurrentTheme(): 'light' | 'dark' {
    return this.currentTheme();
  }

  /**
   * التحقق من الثيم الداكن
   */
  isDarkTheme(): boolean {
    return this.currentTheme() === 'dark';
  }
}
