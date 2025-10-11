// src/app/public/components/public-navbar/public-navbar.component.ts

import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';

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
    MatBadgeModule,
    MatDividerModule
  ],
  templateUrl: './public-navbar.component.html',
  styleUrl: './public-navbar.component.scss'
})
export class PublicNavbarComponent {
  private readonly router = inject(Router);

  // Signals
  isScrolled = signal(false);
  isMobileMenuOpen = signal(false);

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled.set(window.scrollY > 50);
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(value => !value);
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.isMobileMenuOpen.set(false);
    }
  }

  navigateToBooking() {
    this.router.navigate(['/guest/book']);
    this.isMobileMenuOpen.set(false);
  }

  navigateToLogin(userType: 'system-admin' | 'clinic' | 'staff') {
    switch (userType) {
      case 'system-admin':
        this.router.navigate(['/auth/login'], {
          queryParams: { type: 'system-admin' }
        });
        break;
      case 'clinic':
        this.router.navigate(['/auth/login'], {
          queryParams: { type: 'clinic-owner' }
        });
        break;
      case 'staff':
        this.router.navigate(['/auth/login']);
        break;
    }
    this.isMobileMenuOpen.set(false);
  }

  navigateToMyAppointments() {
    this.router.navigate(['/guest/appointments']);
    this.isMobileMenuOpen.set(false);
  }
}
