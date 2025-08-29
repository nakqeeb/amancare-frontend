// ===================================================================
// 2. VITAL SIGNS FORM COMPONENT
// src/app/features/medical-records/components/vital-signs-form/vital-signs-form.component.ts
// ===================================================================
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { VitalSigns } from '../../models/medical-record.model';
import { MedicalRecordService } from '../../services/medical-record.service';

@Component({
  selector: 'app-vital-signs-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatSliderModule,
    MatTooltipModule
  ],
  templateUrl: './vital-signs-form.component.html',
  styleUrl: './vital-signs-form.component.scss'
})
export class VitalSignsFormComponent implements OnInit {
  @Input() vitalSigns?: VitalSigns;
  @Output() vitalSignsChange = new EventEmitter<VitalSigns>();

  vitalSignsForm!: FormGroup;
  bmiValue: number = 0;
  bmiCategory: 'normal' | 'warning' | 'danger' = 'normal';
  bmiMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private medicalRecordService: MedicalRecordService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    if (this.vitalSigns) {
      this.vitalSignsForm.patchValue(this.vitalSigns);
      this.calculateBMI();
    }
  }

  private initializeForm(): void {
    this.vitalSignsForm = this.fb.group({
      temperature: [null, [Validators.min(35), Validators.max(42)]],
      bloodPressureSystolic: [null, [Validators.min(70), Validators.max(250)]],
      bloodPressureDiastolic: [null, [Validators.min(40), Validators.max(150)]],
      heartRate: [null, [Validators.min(40), Validators.max(200)]],
      respiratoryRate: [null, [Validators.min(8), Validators.max(60)]],
      oxygenSaturation: [null, [Validators.min(70), Validators.max(100)]],
      weight: [null, [Validators.min(1), Validators.max(300)]],
      height: [null, [Validators.min(50), Validators.max(250)]],
      bmi: [{value: null, disabled: true}],
      bloodSugar: [null, [Validators.min(30), Validators.max(600)]],
      painScale: [0, [Validators.min(0), Validators.max(10)]]
    });
  }

  calculateBMI(): void {
    const weight = this.vitalSignsForm.get('weight')?.value;
    const height = this.vitalSignsForm.get('height')?.value;

    if (weight && height) {
      this.bmiValue = this.medicalRecordService.calculateBMI(weight, height);
      this.vitalSignsForm.patchValue({ bmi: this.bmiValue });

      // Determine BMI category
      if (this.bmiValue < 18.5) {
        this.bmiCategory = 'warning';
        this.bmiMessage = 'نقص في الوزن';
      } else if (this.bmiValue >= 18.5 && this.bmiValue < 25) {
        this.bmiCategory = 'normal';
        this.bmiMessage = 'وزن طبيعي';
      } else if (this.bmiValue >= 25 && this.bmiValue < 30) {
        this.bmiCategory = 'warning';
        this.bmiMessage = 'زيادة في الوزن';
      } else {
        this.bmiCategory = 'danger';
        this.bmiMessage = 'سمنة';
      }
    }
  }

  formatPainLabel(value: number): string {
    return value.toString();
  }

  getPainDescription(): string {
    const painLevel = this.vitalSignsForm.get('painScale')?.value || 0;

    if (painLevel === 0) return 'لا يوجد ألم';
    if (painLevel <= 3) return 'ألم خفيف';
    if (painLevel <= 6) return 'ألم متوسط';
    if (painLevel <= 8) return 'ألم شديد';
    return 'ألم غير محتمل';
  }

  onSave(): void {
    if (this.vitalSignsForm.valid) {
      const vitalSigns = this.vitalSignsForm.getRawValue();
      this.vitalSignsChange.emit(vitalSigns);
    }
  }

  onReset(): void {
    this.vitalSignsForm.reset({
      painScale: 0
    });
    this.bmiValue = 0;
    this.bmiCategory = 'normal';
    this.bmiMessage = '';
  }
}
