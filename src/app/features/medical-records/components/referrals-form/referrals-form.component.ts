// ===================================================================
// src/app/features/medical-records/components/referrals-form/referrals-form.component.ts
// Referrals Form Component - Manages medical referrals
// ===================================================================

import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';

import {
  Referral,
  ReferralType,
  ReferralPriority,
} from '../../models/medical-record.model';

@Component({
  selector: 'app-referrals-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
  ],
  templateUrl: './referrals-form.component.html',
  styleUrl: './referrals-form.component.scss'
})
export class ReferralsFormComponent {
  @Input() referrals: Referral[] = [];
  @Input() readOnly = false;
  @Output() referralsChange = new EventEmitter<Referral[]>();

  editModeArray = signal<boolean[]>([]);
  showTemplates = signal(true);

  // Common referral templates
  commonReferrals: Partial<Referral>[] = [
    {
      specialty: 'CARDIOLOGY',
      referralType: ReferralType.SPECIALIST,
      priority: ReferralPriority.ROUTINE,
    },
    {
      specialty: 'ORTHOPEDICS',
      referralType: ReferralType.SPECIALIST,
      priority: ReferralPriority.ROUTINE,
    },
    {
      specialty: 'NEUROLOGY',
      referralType: ReferralType.SPECIALIST,
      priority: ReferralPriority.URGENT,
    },
    {
      specialty: 'OPHTHALMOLOGY',
      referralType: ReferralType.OPHTHALMOLOGY,
      priority: ReferralPriority.ROUTINE,
    },
    {
      specialty: 'ENT',
      referralType: ReferralType.ENT,
      priority: ReferralPriority.ROUTINE,
    },
    {
      specialty: 'PSYCHIATRY',
      referralType: ReferralType.PSYCHIATRY,
      priority: ReferralPriority.ROUTINE,
    },
  ];

  editMode(): boolean[] {
    return this.editModeArray() || [];
  }

  addReferral(): void {
    const newReferral: Referral = {
      referralType: ReferralType.SPECIALIST, // default type
      referredTo: '', // empty, user will fill
      priority: ReferralPriority.ROUTINE, // default priority
      reason: '', // empty, user will fill
      referralDate: new Date().toISOString().split('T')[0], // today's date
    };

    this.referrals.push(newReferral);

    const editModes = [...this.editModeArray()];
    editModes.push(true);
    this.editModeArray.set(editModes);

    this.showTemplates.set(false);
    this.emitChanges();
  }

  removeReferral(index: number): void {
    this.referrals.splice(index, 1);
    const editModes = [...this.editModeArray()];
    editModes.splice(index, 1);
    this.editModeArray.set(editModes);
    this.emitChanges();
  }

  toggleEdit(index: number): void {
    const editModes = [...this.editModeArray()];
    editModes[index] = !editModes[index];
    this.editModeArray.set(editModes);
  }

  addFromTemplate(template: Partial<Referral>): void {
    const newReferral: Referral = {
      referralType: template.referralType || ReferralType.SPECIALIST, // default type
      referredTo: '',
      specialty: template.specialty,
      priority: template.priority || ReferralPriority.ROUTINE, // default priority
      reason: '',
      referralDate: new Date().toISOString().split('T')[0], // today's date
    };

    this.referrals.push(newReferral);

    const editModes = [...this.editModeArray()];
    editModes.push(true);
    this.editModeArray.set(editModes);

    this.showTemplates.set(false);
    this.emitChanges();
  }

  getReferralTypeLabel(type: ReferralType): string {
    const labels: Record<ReferralType, string> = {
      [ReferralType.SPECIALIST]: 'أخصائي',
      [ReferralType.HOSPITAL]: 'مستشفى',
      [ReferralType.EMERGENCY]: 'طوارئ',
      [ReferralType.LABORATORY]: 'مختبر',
      [ReferralType.RADIOLOGY]: 'أشعة',
      [ReferralType.PHYSIOTHERAPY]: 'علاج طبيعي',
      [ReferralType.PSYCHIATRY]: 'طب نفسي',
      [ReferralType.DENTISTRY]: 'طب أسنان',
      [ReferralType.OPHTHALMOLOGY]: 'طب عيون',
      [ReferralType.ENT]: 'أنف وأذن وحنجرة',
    };
    return labels[type] || type;
  }

  getPriorityLabel(priority: ReferralPriority): string {
    const labels: Record<ReferralPriority, string> = {
      [ReferralPriority.ROUTINE]: 'عادي',
      [ReferralPriority.URGENT]: 'عاجل',
      [ReferralPriority.EMERGENCY]: 'طارئ',
    };
    return labels[priority] || priority;
  }

  getSpecialtyLabel(specialty: string): string {
    const labels: Record<string, string> = {
      INTERNAL_MEDICINE: 'الباطنة',
      CARDIOLOGY: 'القلب',
      NEUROLOGY: 'الأعصاب',
      ORTHOPEDICS: 'العظام',
      PEDIATRICS: 'الأطفال',
      GYNECOLOGY: 'النساء والولادة',
      OPHTHALMOLOGY: 'العيون',
      ENT: 'الأنف والأذن والحنجرة',
      DERMATOLOGY: 'الجلدية',
      PSYCHIATRY: 'النفسية',
      UROLOGY: 'المسالك البولية',
      SURGERY: 'الجراحة',
      OTHER: 'أخرى',
    };
    return labels[specialty] || specialty;
  }

  formatDate(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('ar-SA');
  }

  private emitChanges(): void {
    this.referralsChange.emit(this.referrals);
  }

  getReferralStatus(referral: Referral): string {
    if (referral.isCompleted) return 'مكتمل';
    switch (referral.priority) {
      case ReferralPriority.EMERGENCY:
        return 'طارئ';
      case ReferralPriority.URGENT:
        return 'عاجل';
      case ReferralPriority.ROUTINE:
        return 'عادي';
      default:
        return '';
    }
  }
}
