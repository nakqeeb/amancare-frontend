// ===================================================================
// src/app/features/medical-records/components/vital-signs-form/vital-signs-form.component.ts
// Vital Signs Form Component
// ===================================================================

import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';

import { VitalSigns } from '../../models/medical-record.model';

interface PainLevel {
  value: number;
  label: string;
  icon: string;
  color: string;
}

interface AbnormalValue {
  name: string;
  label: string;
  value: number;
  unit: string;
  normalRange: string;
}

@Component({
  selector: 'app-vital-signs-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatTooltipModule,
    MatCardModule
  ],
  templateUrl: './vital-signs-form.component.html',
  styleUrl: './vital-signs-form.component.scss'
})
export class VitalSignsFormComponent implements OnInit {
  @Input() vitalSigns: VitalSigns = {};
  @Input() hasLastVisitData = false;
  @Input() readOnly = false;

  @Output() vitalSignsChange = new EventEmitter<VitalSigns>();
  @Output() importRequest = new EventEmitter<void>();
  @Output() chartRequest = new EventEmitter<void>();

  bloodSugarType = 'fasting';

  // Pain scale levels
  painLevels: PainLevel[] = [
    { value: 0, label: 'لا يوجد ألم', icon: 'sentiment_very_satisfied', color: '#4CAF50' },
    { value: 1, label: 'ألم خفيف جداً', icon: 'sentiment_satisfied', color: '#8BC34A' },
    { value: 2, label: 'ألم خفيف', icon: 'sentiment_satisfied', color: '#CDDC39' },
    { value: 3, label: 'ألم معتدل', icon: 'sentiment_neutral', color: '#FFEB3B' },
    { value: 4, label: 'ألم متوسط', icon: 'sentiment_neutral', color: '#FFC107' },
    { value: 5, label: 'ألم ملحوظ', icon: 'sentiment_dissatisfied', color: '#FF9800' },
    { value: 6, label: 'ألم شديد', icon: 'sentiment_dissatisfied', color: '#FF5722' },
    { value: 7, label: 'ألم شديد جداً', icon: 'sentiment_very_dissatisfied', color: '#F44336' },
    { value: 8, label: 'ألم قوي', icon: 'sentiment_very_dissatisfied', color: '#E91E63' },
    { value: 9, label: 'ألم قوي جداً', icon: 'sick', color: '#9C27B0' },
    { value: 10, label: 'أسوأ ألم ممكن', icon: 'sick', color: '#673AB7' }
  ];

  // Normal ranges
  normalRanges = {
    temperature: { min: 36.5, max: 37.5, unit: '°C' },
    bloodPressureSystolic: { min: 90, max: 120, unit: 'mmHg' },
    bloodPressureDiastolic: { min: 60, max: 80, unit: 'mmHg' },
    heartRate: { min: 60, max: 100, unit: 'نبضة/دقيقة' },
    respiratoryRate: { min: 12, max: 20, unit: 'نفس/دقيقة' },
    oxygenSaturation: { min: 95, max: 100, unit: '%' },
    bloodSugar: {
      fasting: { min: 70, max: 100, unit: 'mg/dL' },
      random: { min: 70, max: 140, unit: 'mg/dL' },
      postprandial: { min: 70, max: 180, unit: 'mg/dL' }
    }
  };

  ngOnInit(): void {
    if (!this.vitalSigns) {
      this.vitalSigns = {};
    }
  }

  onValueChange(): void {
    this.vitalSignsChange.emit(this.vitalSigns);
  }

  calculateBMI(): void {
    if (this.vitalSigns.weight && this.vitalSigns.height) {
      const heightInMeters = this.vitalSigns.height / 100;
      const bmi = this.vitalSigns.weight / (heightInMeters * heightInMeters);
      this.vitalSigns.bmi = Math.round(bmi * 10) / 10;
    } else {
      this.vitalSigns.bmi = undefined;
    }
    this.onValueChange();
  }

  getBMIClass(): string {
    if (!this.vitalSigns.bmi) return '';

    if (this.vitalSigns.bmi < 18.5) return 'underweight';
    if (this.vitalSigns.bmi < 25) return 'normal';
    if (this.vitalSigns.bmi < 30) return 'overweight';
    if (this.vitalSigns.bmi < 35) return 'obese-1';
    if (this.vitalSigns.bmi < 40) return 'obese-2';
    return 'obese-3';
  }

  getBMIClassification(): string {
    if (!this.vitalSigns.bmi) return '';

    if (this.vitalSigns.bmi < 18.5) return 'نقص في الوزن';
    if (this.vitalSigns.bmi < 25) return 'وزن طبيعي';
    if (this.vitalSigns.bmi < 30) return 'زيادة في الوزن';
    if (this.vitalSigns.bmi < 35) return 'سمنة درجة أولى';
    if (this.vitalSigns.bmi < 40) return 'سمنة درجة ثانية';
    return 'سمنة مفرطة';
  }

  getBloodPressureClass(): string {
    const systolic = this.vitalSigns.bloodPressureSystolic;
    const diastolic = this.vitalSigns.bloodPressureDiastolic;

    if (!systolic || !diastolic) return '';

    if (systolic < 120 && diastolic < 80) return 'normal';
    if (systolic < 130 && diastolic < 80) return 'elevated';
    if (systolic < 140 || diastolic < 90) return 'stage-1';
    if (systolic < 180 || diastolic < 120) return 'stage-2';
    return 'crisis';
  }

  getBloodPressureClassification(): string {
    const systolic = this.vitalSigns.bloodPressureSystolic;
    const diastolic = this.vitalSigns.bloodPressureDiastolic;

    if (!systolic || !diastolic) return '';

    if (systolic < 120 && diastolic < 80) return 'طبيعي';
    if (systolic < 130 && diastolic < 80) return 'مرتفع قليلاً';
    if (systolic < 140 || diastolic < 90) return 'ضغط مرتفع - المرحلة الأولى';
    if (systolic < 180 || diastolic < 120) return 'ضغط مرتفع - المرحلة الثانية';
    return 'أزمة ارتفاع ضغط الدم';
  }

  setPainLevel(level: number): void {
    this.vitalSigns.painScale = level;
    this.onValueChange();
  }

  getPainDescription(level: number): string {
    const pain = this.painLevels.find(p => p.value === level);
    return pain ? pain.label : '';
  }

  isAbnormal(parameter: string, value: number): boolean {
    const range = this.normalRanges[parameter as keyof typeof this.normalRanges];
    if (!range) return false;

    if (parameter === 'bloodSugar') {
      const sugarRange = range as any;
      const specificRange = sugarRange[this.bloodSugarType];
      return value < specificRange.min || value > specificRange.max;
    }

    return value < (range as any).min || value > (range as any).max;
  }

  getAbnormalMessage(parameter: string, value: number): string {
    const range = this.normalRanges[parameter as keyof typeof this.normalRanges];
    if (!range) return '';

    if (parameter === 'bloodSugar') {
      const sugarRange = range as any;
      const specificRange = sugarRange[this.bloodSugarType];
      if (value < specificRange.min) return 'منخفض';
      if (value > specificRange.max) return 'مرتفع';
    }

    if (value < (range as any).min) return 'منخفض';
    if (value > (range as any).max) return 'مرتفع';
    return '';
  }

  hasAnyAbnormalValues(): boolean {
    return this.getAbnormalValues().length > 0;
  }

  getAbnormalValues(): AbnormalValue[] {
    const abnormal: AbnormalValue[] = [];

    // Check each vital sign
    if (this.vitalSigns.temperature &&
      this.isAbnormal('temperature', this.vitalSigns.temperature)) {
      abnormal.push({
        name: 'temperature',
        label: 'درجة الحرارة',
        value: this.vitalSigns.temperature,
        unit: '°C',
        normalRange: '36.5-37.5'
      });
    }

    if (this.vitalSigns.heartRate &&
      this.isAbnormal('heartRate', this.vitalSigns.heartRate)) {
      abnormal.push({
        name: 'heartRate',
        label: 'معدل النبض',
        value: this.vitalSigns.heartRate,
        unit: 'نبضة/دقيقة',
        normalRange: '60-100'
      });
    }

    if (this.vitalSigns.respiratoryRate &&
      this.isAbnormal('respiratoryRate', this.vitalSigns.respiratoryRate)) {
      abnormal.push({
        name: 'respiratoryRate',
        label: 'معدل التنفس',
        value: this.vitalSigns.respiratoryRate,
        unit: 'نفس/دقيقة',
        normalRange: '12-20'
      });
    }

    if (this.vitalSigns.oxygenSaturation &&
      this.isAbnormal('oxygenSaturation', this.vitalSigns.oxygenSaturation)) {
      abnormal.push({
        name: 'oxygenSaturation',
        label: 'تشبع الأكسجين',
        value: this.vitalSigns.oxygenSaturation,
        unit: '%',
        normalRange: '95-100'
      });
    }

    // Blood pressure
    if (this.vitalSigns.bloodPressureSystolic || this.vitalSigns.bloodPressureDiastolic) {
      const bpClass = this.getBloodPressureClass();
      if (bpClass !== 'normal' && bpClass !== '') {
        abnormal.push({
          name: 'bloodPressure',
          label: 'ضغط الدم',
          value: this.vitalSigns.bloodPressureSystolic!,
          unit: `/${this.vitalSigns.bloodPressureDiastolic} mmHg`,
          normalRange: '120/80'
        });
      }
    }

    return abnormal;
  }

  fillNormalValues(): void {
    this.vitalSigns = {
      temperature: 37,
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 80,
      heartRate: 72,
      respiratoryRate: 16,
      oxygenSaturation: 98,
      painScale: 0
    };
    this.onValueChange();
  }

  importFromLastVisit(): void {
    this.importRequest.emit();
  }

  showChart(): void {
    this.chartRequest.emit();
  }

  resetValues(): void {
    this.vitalSigns = {};
    this.onValueChange();
  }
}
