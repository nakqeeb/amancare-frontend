// ===================================================================
// 1. PRESCRIPTION FORM COMPONENT
// src/app/features/medical-records/components/prescription-form/prescription-form.component.ts
// ===================================================================
import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { Observable, startWith, map, debounceTime, switchMap, of } from 'rxjs';

import { Prescription, MedicationRoute } from '../../models/medical-record.model';
import { MedicalRecordService } from '../../services/medical-record.service';

@Component({
  selector: 'app-prescription-form',
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
    MatDividerModule,
    MatChipsModule
  ],
  templateUrl: './prescription-form.component.html',
  styleUrl: './prescription-form.component.scss'
})
export class PrescriptionFormComponent implements OnInit {
  @Input() prescriptions?: Prescription[];
  @Output() prescriptionsChange = new EventEmitter<Prescription[]>();
  @Output() printPrescription = new EventEmitter<void>();

  prescriptionForm!: FormGroup;
  MedicationRoute = MedicationRoute;
  medicationSuggestions = signal<string[]>([]);

  constructor(
    private fb: FormBuilder,
    private medicalRecordService: MedicalRecordService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    if (this.prescriptions && this.prescriptions.length > 0) {
      this.populatePrescriptions(this.prescriptions);
    }
  }

  private initializeForm(): void {
    this.prescriptionForm = this.fb.group({
      prescriptions: this.fb.array([])
    });
  }

  // get prescriptions(): FormArray {
  //   return this.prescriptionForm.get('prescriptions') as FormArray;
  // }

  get prescriptionsArray(): FormArray {
    return this.prescriptionForm.get('prescriptions') as FormArray;
  }

  private createPrescriptionGroup(prescription?: Prescription): FormGroup {
    return this.fb.group({
      medicationName: [prescription?.medicationName || '', Validators.required],
      genericName: [prescription?.genericName || ''],
      dosage: [prescription?.dosage || '', Validators.required],
      frequency: [prescription?.frequency || '', Validators.required],
      duration: [prescription?.duration || '', Validators.required],
      route: [prescription?.route || MedicationRoute.ORAL, Validators.required],
      instructions: [prescription?.instructions || ''],
      quantity: [prescription?.quantity || null],
      refills: [prescription?.refills || 0],
      isPRN: [prescription?.isPRN || false]
    });
  }

  addPrescription(): void {
    this.prescriptionsArray.push(this.createPrescriptionGroup());
  }

  removePrescription(index: number): void {
    this.prescriptionsArray.removeAt(index);
  }

  private populatePrescriptions(prescriptionsList: Prescription[]): void {
    prescriptionsList.forEach(prescription => {
      this.prescriptionsArray.push(this.createPrescriptionGroup(prescription));
    });
  }

  getMedicationSuggestions(index: number): Observable<string[]> {
    const control = this.prescriptionsArray.at(index).get('medicationName');

    if (!control) return of([]);

    return control.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(value => {
        if (typeof value === 'string' && value.length > 1) {
          return this.medicalRecordService.getMedicationSuggestions(value);
        }
        return of([]);
      })
    );
  }

  onSave(): void {
    if (this.prescriptionForm.valid) {
      const prescriptions = this.prescriptionsArray.value;
      this.prescriptionsChange.emit(prescriptions);
    }
  }

  onPrint(): void {
    this.printPrescription.emit();
  }
}
