// src/app/public/components/announcements/announcements.component.ts
// UPDATED: Added image error handling

import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';
import { PublicService } from '../../services/public.service';
import {
  Announcement,
  getAnnouncementTypeLabel,
  getAnnouncementTypeIcon,
  getAnnouncementTypeColor
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
  private readonly publicService = inject(PublicService);
  private subscription?: Subscription;

  announcements = signal<Announcement[]>([]);
  loading = signal(false);
  currentIndex = signal(0);

  ngOnInit(): void {
    this.loadAnnouncements();
    this.startAutoRotate();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private loadAnnouncements(): void {
    this.loading.set(true);
    this.subscription = this.publicService.startAnnouncementsAutoRefresh().subscribe({
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
    }, 5000);
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

  goToAnnouncement(index: number): void {
    this.currentIndex.set(index);
  }

  // New: Handle image loading errors gracefully
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Hide the image container if image fails to load
    if (img.parentElement) {
      img.parentElement.style.display = 'none';
    }
  }

  getTypeLabel = getAnnouncementTypeLabel;
  getTypeIcon = getAnnouncementTypeIcon;
  getTypeColor = getAnnouncementTypeColor;
}
