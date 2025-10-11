// src/app/public/components/doctor-availability/doctor-availability.component.ts

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
import { DoctorAvailability } from '../../models/announcement.model';

@Component({
  selector: 'app-doctor-availability',
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
  templateUrl: './doctor-availability.component.html',
  styleUrl: './doctor-availability.component.scss'
})
export class DoctorAvailabilityComponent implements OnInit, OnDestroy {
  private readonly announcementService = inject(AnnouncementService);
  private subscription?: Subscription;

  // Signals
  availableDoctors = signal<DoctorAvailability[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.loadAvailableDoctors();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private loadAvailableDoctors(): void {
    this.loading.set(true);
    this.subscription = this.announcementService
      .startDoctorAvailabilityRefresh()
      .subscribe({
        next: (doctors) => {
          this.availableDoctors.set(doctors);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading available doctors:', error);
          this.loading.set(false);
        }
      });
  }
}
