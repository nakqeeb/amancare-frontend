// ===================================================================
// 1. TIME SLOTS COMPONENT
// src/app/features/appointments/components/time-slots/time-slots.component.ts
// ===================================================================
import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TimeSlot } from '../../models/appointment.model';

@Component({
  selector: 'app-time-slots',
  standalone: true,
  imports: [
    CommonModule,
    MatChipsModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './time-slots.component.html',
  styleUrl: './time-slots.component.scss'
})

export class TimeSlotsComponent {
  @Input() timeSlots: TimeSlot[] = [];
  @Input() selectedSlot: string | null = null;
  @Output() slotSelected = new EventEmitter<string>();

  get groupedSlots() {
    const groups = [
      { period: 'الصباح', icon: 'wb_sunny', slots: [] as TimeSlot[] },
      { period: 'الظهيرة', icon: 'wb_twilight', slots: [] as TimeSlot[] },
      { period: 'المساء', icon: 'nights_stay', slots: [] as TimeSlot[] }
    ];

    this.timeSlots.forEach(slot => {
      const hour = parseInt(slot.time.split(':')[0]);

      if (hour < 12) {
        groups[0].slots.push(slot);
      } else if (hour < 17) {
        groups[1].slots.push(slot);
      } else {
        groups[2].slots.push(slot);
      }
    });

    return groups.filter(group => group.slots.length > 0);
  }

  selectSlot(slot: TimeSlot): void {
    if (slot.available) {
      this.slotSelected.emit(slot.time);
    }
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'م' : 'ص';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  }

  getPeriodIcon(period: string): string {
    switch (period) {
      case 'الصباح': return 'wb_sunny';
      case 'الظهيرة': return 'wb_twilight';
      case 'المساء': return 'nights_stay';
      default: return 'schedule';
    }
  }

  getSlotTooltip(slot: TimeSlot): string {
    if (slot.available) {
      return `الوقت ${this.formatTime(slot.time)} متاح للحجز`;
    } else if (slot.patientName) {
      return `محجوز لـ ${slot.patientName}`;
    } else {
      return 'هذا الوقت غير متاح';
    }
  }

  getSlotAriaLabel(slot: TimeSlot): string {
    const timeFormatted = this.formatTime(slot.time);
    if (slot.available) {
      return `وقت ${timeFormatted} متاح للحجز`;
    } else {
      return `وقت ${timeFormatted} محجوز`;
    }
  }
}
