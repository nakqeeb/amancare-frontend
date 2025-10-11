// src/app/public/components/landing-page/landing-page.component.ts

import { Component, inject, signal, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { PublicNavbarComponent } from '../public-navbar/public-navbar.component';
import { AnnouncementsComponent } from '../announcements/announcements.component';
import { DoctorAvailabilityComponent } from '../doctor-availability/doctor-availability.component';
import { QuickBookingWidgetComponent } from '../quick-booking-widget/quick-booking-widget.component';

interface Feature {
  icon: string;
  title: string;
  description: string;
  color: string;
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
  color: string;
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
    PublicNavbarComponent,
    AnnouncementsComponent,
    DoctorAvailabilityComponent,
    QuickBookingWidgetComponent
  ],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent implements OnInit {
  private readonly router = inject(Router);

  // Signals
  showScrollTop = signal(false);
  currentYear = new Date().getFullYear();

  // Features
  features: Feature[] = [
    {
      icon: 'schedule',
      title: 'حجز سريع وسهل',
      description: 'احجز موعدك في دقائق معدودة بدون الحاجة لإنشاء حساب',
      color: '#667eea'
    },
    {
      icon: 'notifications_active',
      title: 'تنبيهات فورية',
      description: 'احصل على تذكير بموعدك عبر البريد الإلكتروني والرسائل النصية',
      color: '#f093fb'
    },
    {
      icon: 'history',
      title: 'تاريخ طبي شامل',
      description: 'جميع سجلاتك الطبية في مكان واحد يسهل الوصول إليه',
      color: '#4facfe'
    },
    {
      icon: 'verified_user',
      title: 'أمان وخصوصية',
      description: 'بياناتك محمية بأعلى معايير الأمان والخصوصية',
      color: '#43e97b'
    },
    {
      icon: 'support_agent',
      title: 'دعم على مدار الساعة',
      description: 'فريق الدعم متواجد دائماً للإجابة على استفساراتك',
      color: '#fa709a'
    },
    {
      icon: 'smartphone',
      title: 'متاح على جميع الأجهزة',
      description: 'استخدم النظام من الكمبيوتر أو الهاتف أو التابلت',
      color: '#30cfd0'
    }
  ];

  // How it works steps
  steps: Step[] = [
    {
      number: 1,
      icon: 'search',
      title: 'اختر العيادة والطبيب',
      description: 'ابحث عن العيادة والطبيب المناسب لحالتك'
    },
    {
      number: 2,
      icon: 'calendar_today',
      title: 'اختر الوقت المناسب',
      description: 'اختر التاريخ والوقت الذي يناسبك من الأوقات المتاحة'
    },
    {
      number: 3,
      icon: 'person_add',
      title: 'أدخل بياناتك',
      description: 'املأ نموذج بسيط ببياناتك الشخصية'
    },
    {
      number: 4,
      icon: 'check_circle',
      title: 'تأكيد الموعد',
      description: 'استلم رسالة تأكيد بموعدك عبر البريد الإلكتروني'
    }
  ];

  // Statistics
  statistics: Statistic[] = [
    {
      value: '10,000+',
      label: 'موعد ناجح',
      icon: 'event_available',
      color: '#667eea'
    },
    {
      value: '500+',
      label: 'طبيب متخصص',
      icon: 'people',
      color: '#f093fb'
    },
    {
      value: '50+',
      label: 'عيادة معتمدة',
      icon: 'local_hospital',
      color: '#4facfe'
    },
    {
      value: '98%',
      label: 'رضا المرضى',
      icon: 'sentiment_satisfied',
      color: '#43e97b'
    }
  ];

  ngOnInit(): void {
    // Scroll to top on init
    window.scrollTo(0, 0);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.showScrollTop.set(window.scrollY > 300);
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
}
