// src/app/public/components/announcements/announcements.component.ts

import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';
import { AnnouncementService } from '../../services/announcement.service';
import {
  Announcement,
  AnnouncementType,
  ANNOUNCEMENT_TYPE_LABELS,
  ANNOUNCEMENT_TYPE_ICONS
} from '../../models/announcement.model';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './announcements.component.html',
  styleUrl: './announcements.component.scss'
})
export class AnnouncementsComponent implements OnInit, OnDestroy {
  private readonly announcementService = inject(AnnouncementService);
  private subscription?: Subscription;

  // Signals
  announcements = signal<Announcement[]>([]);
  loading = signal(false);
  currentIndex = signal(0);

  // Enums for template
  ANNOUNCEMENT_TYPE_LABELS = ANNOUNCEMENT_TYPE_LABELS;
  ANNOUNCEMENT_TYPE_ICONS = ANNOUNCEMENT_TYPE_ICONS;

  ngOnInit(): void {
    this.loadAnnouncements();
    this.startAutoRotate();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private loadAnnouncements(): void {
    this.loading.set(true);
    this.subscription = this.announcementService.startAutoRefresh().subscribe({
      next: (announcements) => {
        this.announcements.set(announcements);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading announcements:', error);
        this.loading.set(false);
      }
    });
  }

  private startAutoRotate(): void {
    setInterval(() => {
      const announcements = this.announcements();
      if (announcements.length > 1) {
        this.currentIndex.update(index =>
          (index + 1) % announcements.length
        );
      }
    }, 5000); // Rotate every 5 seconds
  }

  nextAnnouncement(): void {
    const announcements = this.announcements();
    if (announcements.length > 1) {
      this.currentIndex.update(index =>
        (index + 1) % announcements.length
      );
    }
  }

  previousAnnouncement(): void {
    const announcements = this.announcements();
    if (announcements.length > 1) {
      this.currentIndex.update(index =>
        index === 0 ? announcements.length - 1 : index - 1
      );
    }
  }

  getAnnouncementColor(type: AnnouncementType): string {
    switch (type) {
      case AnnouncementType.DOCTOR_AVAILABLE:
        return '#4caf50';
      case AnnouncementType.EMERGENCY:
        return '#f44336';
      case AnnouncementType.SPECIAL_OFFER:
        return '#ff9800';
      case AnnouncementType.HEALTH_TIP:
        return '#2196f3';
      default:
        return '#667eea';
    }
  }
}
