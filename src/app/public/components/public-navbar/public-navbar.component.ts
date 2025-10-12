// src/app/public/components/public-navbar/public-navbar.component.ts

import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-public-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    ThemeToggleComponent
  ],
  templateUrl: './public-navbar.component.html',
  styleUrl: './public-navbar.component.scss'
})
export class PublicNavbarComponent {
  private readonly router = inject(Router);

  isScrolled = signal(false);
  isMobileMenuOpen = signal(false);

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled.set(window.scrollY > 50);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(value => !value);
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      this.isMobileMenuOpen.set(false);
    }
  }

  navigateToBooking(): void {
    this.router.navigate(['/guest/book']);
    this.isMobileMenuOpen.set(false);
  }

  /* navigateToLogin(userType: 'system-admin' | 'clinic' | 'staff'): void {
    const queryParams: any = {};

    switch (userType) {
      case 'system-admin':
        queryParams.type = 'system-admin';
        break;
      case 'clinic':
        queryParams.type = 'clinic-owner';
        break;
    }

    this.router.navigate(['/auth/login'], { queryParams });
    this.isMobileMenuOpen.set(false);
  } */
  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
    this.isMobileMenuOpen.set(false);
  }
  navigateToMyAppointments(): void {
    this.router.navigate(['/guest/appointments']);
    this.isMobileMenuOpen.set(false);
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
    this.isMobileMenuOpen.set(false);
  }
}
