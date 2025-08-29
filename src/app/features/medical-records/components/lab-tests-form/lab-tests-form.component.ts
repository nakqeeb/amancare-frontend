// ===================================================================
// 2. LAB TESTS FORM COMPONENT
// src/app/features/medical-records/components/lab-tests-form/lab-tests-form.component.ts
// ===================================================================
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

import {
  LabTest,
  LabTestCategory,
  TestUrgency,
  TestStatus
} from '../../models/medical-record.model';

@Component({
  selector: 'app-lab-tests-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatDividerModule,
    MatChipsModule
  ],
  templateUrl: './lab-tests-form.component.html',
  styleUrl: './lab-tests-form.component.scss'
})
export class LabTestsFormComponent implements OnInit {
  @Input() labTestsList?: LabTest[];
  @Output() labTestsChange = new EventEmitter<LabTest[]>();

  labTestsForm!: FormGroup;
  LabTestCategory = LabTestCategory;
  TestUrgency = TestUrgency;

  commonTests = [
    'تحليل دم شامل (CBC)',
    'سكر الدم الصائم',
    'وظائف الكبد',
    'وظائف الكلى',
    'دهون الدم',
    'هرمونات الغدة الدرقية',
    'فيتامين د',
    'فيتامين ب12',
    'تحليل بول',
    'تحليل براز'
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForm();
    if (this.labTestsList && this.labTestsList.length > 0) {
      this.populateLabTests(this.labTestsList);
    }
  }

  private initializeForm(): void {
    this.labTestsForm = this.fb.group({
      labTests: this.fb.array([])
    });
  }

  get labTests(): FormArray {
    return this.labTestsForm.get('labTests') as FormArray;
  }

  private createLabTestGroup(labTest?: LabTest): FormGroup {
    return this.fb.group({
      testName: [labTest?.testName || '', Validators.required],
      testCode: [labTest?.testCode || ''],
      category: [labTest?.category || LabTestCategory.HEMATOLOGY, Validators.required],
      urgency: [labTest?.urgency || TestUrgency.ROUTINE, Validators.required],
      specimenType: [labTest?.specimenType || 'دم'],
      instructions: [labTest?.instructions || ''],
      status: [labTest?.status || TestStatus.ORDERED],
      orderedDate: [labTest?.orderedDate || new Date().toISOString()]
    });
  }

  addLabTest(): void {
    this.labTests.push(this.createLabTestGroup());
  }

  removeLabTest(index: number): void {
    this.labTests.removeAt(index);
  }

  addCommonTest(testName: string): void {
    let category = LabTestCategory.HEMATOLOGY;
    let specimenType = 'دم';

    // Determine category and specimen based on test name
    if (testName.includes('بول')) {
      category = LabTestCategory.BIOCHEMISTRY;
      specimenType = 'بول';
    } else if (testName.includes('براز')) {
      category = LabTestCategory.MICROBIOLOGY;
      specimenType = 'براز';
    } else if (testName.includes('هرمون')) {
      category = LabTestCategory.BIOCHEMISTRY;
    } else if (testName.includes('فيتامين')) {
      category = LabTestCategory.BIOCHEMISTRY;
    }

    const newTest = this.createLabTestGroup({
      testName,
      category,
      urgency: TestUrgency.ROUTINE,
      specimenType,
      status: TestStatus.ORDERED,
      orderedDate: new Date().toISOString()
    });

    this.labTests.push(newTest);
  }

  private populateLabTests(labTestsList: LabTest[]): void {
    labTestsList.forEach(labTest => {
      this.labTests.push(this.createLabTestGroup(labTest));
    });
  }

  onSave(): void {
    if (this.labTestsForm.valid) {
      const labTests = this.labTests.value;
      this.labTestsChange.emit(labTests);
    }
  }
}
