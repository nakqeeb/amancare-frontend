import { inject, Injectable, signal, effect } from '@angular/core';
import { StorageService } from './storage.service';

export type Theme = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private storageService = inject(StorageService);

  private readonly THEME_KEY = 'amancare_theme';
  private readonly THEME_PREFERENCE_KEY = 'amancare_theme_preference';

  // Signals for reactive theme management
  private currentTheme = signal<'light' | 'dark'>('light');
  private themePreference = signal<Theme>('light');
  private systemPrefersDark = signal(false);

  // Media query for system theme detection
  private darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  constructor() {
    // Listen for system theme changes
    this.darkModeMediaQuery.addEventListener('change', (e) => {
      this.systemPrefersDark.set(e.matches);
      if (this.themePreference() === 'auto') {
        this.applyTheme();
      }
    });

    // Set initial system preference
    this.systemPrefersDark.set(this.darkModeMediaQuery.matches);

    // React to theme preference changes
    effect(() => {
      const preference = this.themePreference();
      this.storageService.setItem(this.THEME_PREFERENCE_KEY, preference);
      this.applyTheme();
    });
  }

  /**
   * Initialize theme on app startup
   */
  initializeTheme(): void {
    // Get saved preference (light, dark, or auto)
    const savedPreference = this.storageService.getItem<Theme>(this.THEME_PREFERENCE_KEY);
    const preference = savedPreference || 'light';

    this.themePreference.set(preference);
    this.applyTheme();

    // Add transition class after initial load to prevent flash
    setTimeout(() => {
      document.body.classList.add('theme-transition');
    }, 100);
  }

  /**
   * Apply the appropriate theme based on preference
   */
  private applyTheme(): void {
    let theme: 'light' | 'dark';

    if (this.themePreference() === 'auto') {
      theme = this.systemPrefersDark() ? 'dark' : 'light';
    } else {
      theme = this.themePreference() as 'light' | 'dark';
    }

    this.setTheme(theme);
  }

  /**
   * Set the active theme
   */
  private setTheme(theme: 'light' | 'dark'): void {
    this.currentTheme.set(theme);
    this.storageService.setItem(this.THEME_KEY, theme);

    // Apply theme to DOM
    const html = document.documentElement;
    const body = document.body;

    // Set data attribute for CSS
    html.setAttribute('data-theme', theme);

    // Toggle dark theme class
    if (theme === 'dark') {
      body.classList.add('dark-theme');
      html.classList.add('dark-theme');

      // Update meta theme-color for mobile browsers
      this.updateMetaThemeColor('#1e1e1e');
    } else {
      body.classList.remove('dark-theme');
      html.classList.remove('dark-theme');

      // Update meta theme-color for mobile browsers
      this.updateMetaThemeColor('#4c51bf');
    }

    // Dispatch custom event for other components to react
    window.dispatchEvent(new CustomEvent('themechange', {
      detail: { theme, preference: this.themePreference() }
    }));
  }

  /**
   * Update meta theme-color for mobile browsers
   */
  private updateMetaThemeColor(color: string): void {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');

    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }

    metaThemeColor.setAttribute('content', color);
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme(): void {
    const newTheme = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.themePreference.set(newTheme);
  }

  /**
   * Cycle through theme preferences: light -> dark -> auto -> light
   */
  cycleThemePreference(): void {
    const current = this.themePreference();
    let next: Theme;

    switch (current) {
      case 'light':
        next = 'dark';
        break;
      case 'dark':
        next = 'auto';
        break;
      case 'auto':
        next = 'light';
        break;
      default:
        next = 'light';
    }

    this.themePreference.set(next);
  }

  /**
   * Set theme preference
   */
  setThemePreference(preference: Theme): void {
    this.themePreference.set(preference);
  }

  /**
   * Get current active theme
   */
  getCurrentTheme(): 'light' | 'dark' {
    return this.currentTheme();
  }

  /**
   * Get theme preference
   */
  getThemePreference(): Theme {
    return this.themePreference();
  }

  /**
   * Check if dark theme is active
   */
  isDarkTheme(): boolean {
    return this.currentTheme() === 'dark';
  }

  /**
   * Check if auto theme is enabled
   */
  isAutoTheme(): boolean {
    return this.themePreference() === 'auto';
  }

  /**
   * Get theme icon based on preference
   */
  getThemeIcon(): string {
    const preference = this.themePreference();

    switch (preference) {
      case 'light':
        return 'light_mode';
      case 'dark':
        return 'dark_mode';
      case 'auto':
        return 'brightness_auto';
      default:
        return 'light_mode';
    }
  }

  /**
   * Get theme display name
   */
  getThemeDisplayName(): string {
    const preference = this.themePreference();

    switch (preference) {
      case 'light':
        return 'المظهر الفاتح';
      case 'dark':
        return 'المظهر الداكن';
      case 'auto':
        return 'تلقائي (حسب النظام)';
      default:
        return 'المظهر الفاتح';
    }
  }

  /**
   * Check system preference
   */
  getSystemPreference(): 'light' | 'dark' {
    return this.systemPrefersDark() ? 'dark' : 'light';
  }

  /**
   * Apply theme with animation
   */
  applyThemeWithAnimation(theme: Theme): void {
    // Add animation class
    document.body.classList.add('theme-switching');

    // Apply theme after a short delay
    setTimeout(() => {
      this.setThemePreference(theme);

      // Remove animation class after transition
      setTimeout(() => {
        document.body.classList.remove('theme-switching');
      }, 300);
    }, 50);
  }

  /**
   * Preload theme to prevent flash of unstyled content
   */
  static preloadTheme(): void {
    // This can be called before Angular bootstraps
    const savedTheme = localStorage.getItem('amancare_theme');
    const savedPreference = localStorage.getItem('amancare_theme_preference');

    let theme: 'light' | 'dark' = 'light';

    if (savedPreference === 'auto') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme = systemPrefersDark ? 'dark' : 'light';
    } else if (savedTheme === 'dark' || savedPreference === 'dark') {
      theme = 'dark';
    }

    // Apply theme immediately
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark-theme');
      document.documentElement.classList.add('dark-theme');
    }
  }
}
