// ===================================================================
// 2. DIAGNOSIS FORM COMPONENT
// src/app/features/medical-records/components/diagnosis-form/diagnosis-form.component.ts
// ===================================================================
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { Observable, startWith, debounceTime, switchMap, of, map } from 'rxjs';

import { Diagnosis, DiagnosisType } from '../../models/medical-record.model';
import { MedicalRecordService } from '../../services/medical-record.service';

@Component({
  selector: 'app-diagnosis-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './diagnosis-form.component.html',
  styleUrl: './diagnosis-form.component.scss'
})
export class DiagnosisFormComponent implements OnInit {
  @Input() diagnosesList?: Diagnosis[];
  @Output() diagnosesChange = new EventEmitter<Diagnosis[]>();

  diagnosisForm!: FormGroup;
  DiagnosisType = DiagnosisType;

  constructor(
    private fb: FormBuilder,
    private medicalRecordService: MedicalRecordService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    if (this.diagnosesList && this.diagnosesList.length > 0) {
      this.populateDiagnoses(this.diagnosesList);
    } else {
      // Add one empty diagnosis by default
      this.addDiagnosis();
    }
  }

  private initializeForm(): void {
    this.diagnosisForm = this.fb.group({
      diagnoses: this.fb.array([])
    });
  }

  get diagnoses(): FormArray {
    return this.diagnosisForm.get('diagnoses') as FormArray;
  }

  private createDiagnosisGroup(diagnosis?: Diagnosis): FormGroup {
    return this.fb.group({
      code: [diagnosis?.code || ''],
      description: [diagnosis?.description || '', Validators.required],
      type: [diagnosis?.type || DiagnosisType.PROVISIONAL, Validators.required],
      isPrimary: [diagnosis?.isPrimary || false],
      notes: [diagnosis?.notes || '']
    });
  }

  addDiagnosis(): void {
    const newDiagnosis = this.createDiagnosisGroup();

    // If this is the first diagnosis, make it primary
    if (this.diagnoses.length === 0) {
      newDiagnosis.patchValue({ isPrimary: true });
    }

    this.diagnoses.push(newDiagnosis);
  }

  removeDiagnosis(index: number): void {
    const wasPrimary = this.diagnoses.at(index).get('isPrimary')?.value;
    this.diagnoses.removeAt(index);

    // If removed diagnosis was primary and there are others, make the first one primary
    if (wasPrimary && this.diagnoses.length > 0) {
      this.diagnoses.at(0).patchValue({ isPrimary: true });
    }
  }

  private populateDiagnoses(diagnosesList: Diagnosis[]): void {
    diagnosesList.forEach(diagnosis => {
      this.diagnoses.push(this.createDiagnosisGroup(diagnosis));
    });
  }

  getDiagnosisSuggestions(index: number): Observable<Diagnosis[]> {
    const control = this.diagnoses.at(index).get('description');

    if (!control) return of([]);

    return control.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(value => {
        if (typeof value === 'string' && value.length > 1) {
          return this.medicalRecordService.getDiagnosisSuggestions(value);
        }
        return of([]);
      })
    );
  }

  displayDiagnosis(diagnosis: Diagnosis | string): string {
    if (typeof diagnosis === 'string') {
      return diagnosis;
    }
    return diagnosis ? diagnosis.description : '';
  }

  onDiagnosisSelected(event: any, index: number): void {
    const diagnosis = event.option.value as Diagnosis;
    if (diagnosis) {
      this.diagnoses.at(index).patchValue({
        code: diagnosis.code,
        description: diagnosis.description
      });
    }
  }

  onPrimaryChange(index: number): void {
    const isPrimary = this.diagnoses.at(index).get('isPrimary')?.value;

    if (isPrimary) {
      // Unset all other primary diagnoses
      this.diagnoses.controls.forEach((control, i) => {
        if (i !== index) {
          control.patchValue({ isPrimary: false });
        }
      });
    }
  }

  hasPrimaryDiagnosis(): boolean {
    return this.diagnoses.controls.some(control =>
      control.get('isPrimary')?.value === true
    );
  }

  onSave(): void {
    if (this.diagnosisForm.valid && this.hasPrimaryDiagnosis()) {
      const diagnoses = this.diagnoses.value;
      this.diagnosesChange.emit(diagnoses);
    }
  }
}
