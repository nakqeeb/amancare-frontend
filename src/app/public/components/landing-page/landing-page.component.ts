// src/app/public/components/landing-page/landing-page.component.ts

import { Component, inject, signal, OnInit, OnDestroy, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { PublicNavbarComponent } from '../public-navbar/public-navbar.component';
import { AnnouncementsComponent } from '../announcements/announcements.component';
import { DoctorAvailabilityComponent } from '../doctor-availability/doctor-availability.component';
import { QuickBookingWidgetComponent } from '../quick-booking-widget/quick-booking-widget.component';
import AOS from 'aos';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface Step {
  number: number;
  icon: string;
  title: string;
  description: string;
}

interface Statistic {
  value: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatChipsModule,
    PublicNavbarComponent,
    AnnouncementsComponent,
    DoctorAvailabilityComponent,
    QuickBookingWidgetComponent
  ],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly router = inject(Router);

  showScrollTop = signal(false);
  currentYear = new Date().getFullYear();

  features: Feature[] = [
    {
      icon: 'schedule',
      title: 'حجز سريع وسهل',
      description: 'احجز موعدك في دقائق معدودة بدون الحاجة لإنشاء حساب'
    },
    {
      icon: 'notifications_active',
      title: 'تنبيهات فورية',
      description: 'احصل على تذكير بموعدك عبر البريد الإلكتروني'
    },
    {
      icon: 'history',
      title: 'تاريخ طبي شامل',
      description: 'جميع سجلاتك الطبية في مكان واحد آمن'
    },
    {
      icon: 'verified_user',
      title: 'أمان وخصوصية',
      description: 'بياناتك محمية بأعلى معايير الأمان'
    },
    {
      icon: 'support_agent',
      title: 'دعم على مدار الساعة',
      description: 'فريق الدعم متواجد للإجابة على استفساراتك'
    },
    {
      icon: 'devices',
      title: 'متاح على جميع الأجهزة',
      description: 'استخدم النظام من أي جهاز في أي وقت'
    }
  ];

  steps: Step[] = [
    {
      number: 1,
      icon: 'search',
      title: 'اختر العيادة والطبيب',
      description: 'ابحث عن العيادة والطبيب المناسب'
    },
    {
      number: 2,
      icon: 'calendar_today',
      title: 'اختر الوقت المناسب',
      description: 'حدد التاريخ والوقت من الأوقات المتاحة'
    },
    {
      number: 3,
      icon: 'person_add',
      title: 'أدخل بياناتك',
      description: 'املأ نموذج بسيط ببياناتك'
    },
    {
      number: 4,
      icon: 'check_circle',
      title: 'تأكيد الموعد',
      description: 'استلم تأكيد بموعدك فوراً'
    }
  ];

  statistics: Statistic[] = [
    { value: '10,000+', label: 'موعد ناجح', icon: 'event_available' },
    { value: '500+', label: 'طبيب متخصص', icon: 'people' },
    { value: '50+', label: 'عيادة معتمدة', icon: 'local_hospital' },
    { value: '98%', label: 'رضا المرضى', icon: 'sentiment_satisfied' }
  ];

  async ngOnInit() {
    window.scrollTo(0, 0);
  }

  ngAfterViewInit(): void {
    // Initialize AOS
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: true,
      mirror: false,
      anchorPlacement: 'top-bottom',
      offset: 100,
      delay: 0,
      disable: false
    });
  }

  ngOnDestroy(): void {
    // Cleanup AOS
    AOS.refresh();
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.showScrollTop.set(window.scrollY > 300);

    // Refresh AOS on scroll
    AOS.refresh();
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navigateToBooking(): void {
    this.router.navigate(['/guest/book']);
  }

  navigateToMyAppointments(): void {
    this.router.navigate(['/guest/appointments']);
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
    }
  }
}
