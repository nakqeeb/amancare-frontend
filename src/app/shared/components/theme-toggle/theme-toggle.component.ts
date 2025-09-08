// src/app/shared/components/theme-toggle/theme-toggle.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { ThemeService, Theme } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss'
})
export class ThemeToggleComponent implements OnInit {
  private themeService = inject(ThemeService);

  // Component state
  isDark = signal(false);
  currentPreference = signal<Theme>('light');
  showMenu = signal(false); // Set to true to show menu instead of simple toggle

  ngOnInit(): void {
    this.updateState();

    // Listen for theme changes
    window.addEventListener('themechange', () => {
      this.updateState();
    });
  }

  private updateState(): void {
    this.isDark.set(this.themeService.isDarkTheme());
    this.currentPreference.set(this.themeService.getThemePreference());
  }

  handleClick(): void {
    if (this.showMenu()) {
      return; // Menu will handle the click
    }

    // Add animation class
    const button = document.querySelector('.theme-toggle-button');
    if (button) {
      button.classList.add('theme-changing');
      setTimeout(() => {
        button.classList.remove('theme-changing');
      }, 500);
    }

    // Cycle through themes or just toggle
    this.themeService.cycleThemePreference();
    this.updateState();
  }

  setTheme(theme: Theme): void {
    this.themeService.applyThemeWithAnimation(theme);
    this.updateState();
  }

  getIcon(): string {
    return this.themeService.getThemeIcon();
  }

  getTooltip(): string {
    const preference = this.currentPreference();
    const nextTheme = this.getNextTheme();
    return `تبديل إلى ${this.getThemeName(nextTheme)}`;
  }

  private getNextTheme(): Theme {
    const current = this.currentPreference();
    switch (current) {
      case 'light': return 'dark';
      case 'dark': return 'auto';
      case 'auto': return 'light';
      default: return 'dark';
    }
  }

  private getThemeName(theme: Theme): string {
    switch (theme) {
      case 'light': return 'المظهر الفاتح';
      case 'dark': return 'المظهر الداكن';
      case 'auto': return 'التلقائي';
      default: return 'المظهر الفاتح';
    }
  }

  getSystemTheme(): string {
    const systemTheme = this.themeService.getSystemPreference();
    return systemTheme === 'dark' ? 'داكن' : 'فاتح';
  }
}

// Also export a simpler version for inline use
@Component({
  selector: 'app-theme-toggle-simple',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <button
      mat-icon-button
      (click)="toggle()"
      [attr.aria-label]="'تبديل المظهر'"
      class="simple-theme-toggle">
      <mat-icon>{{ isDark() ? 'dark_mode' : 'light_mode' }}</mat-icon>
    </button>
  `,
  styles: [`
    .simple-theme-toggle {
      transition: transform 0.3s ease;

      &:hover {
        transform: scale(1.1);
      }

      mat-icon {
        transition: color 0.3s ease;
      }
    }

    :host-context(.dark-theme) .simple-theme-toggle mat-icon {
      color: #ffd740;
    }
  `]
})
export class ThemeToggleSimpleComponent {
  private themeService = inject(ThemeService);
  isDark = signal(false);

  constructor() {
    this.isDark.set(this.themeService.isDarkTheme());
  }

  toggle(): void {
    this.themeService.toggleTheme();
    this.isDark.set(this.themeService.isDarkTheme());
  }
}
