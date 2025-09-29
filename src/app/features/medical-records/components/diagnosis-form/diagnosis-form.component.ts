// ===================================================================
// src/app/features/medical-records/components/diagnosis-form/diagnosis-form.component.ts
// Diagnosis Form Component - Manages diagnoses in medical records
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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDividerModule } from '@angular/material/divider';

import { Diagnosis, DiagnosisType } from '../../models/medical-record.model';

interface ICD10Code {
  code: string;
  description: string;
  category?: string;
}

@Component({
  selector: 'app-diagnosis-form',
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
    MatCheckboxModule,
    MatTooltipModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatDividerModule
  ],
  templateUrl: "./diagnosis-form.component.html",
  styleUrl: "./diagnosis-form.component.scss"
})
export class DiagnosisFormComponent {
  @Input() diagnoses: Diagnosis[] = [];
  @Input() readOnly = false;
  @Output() diagnosesChange = new EventEmitter<Diagnosis[]>();

  editMode = signal(-1);
  showTemplates = signal(true);
  icdSuggestions = signal<ICD10Code[]>([]);
  activeICDIndex = signal(-1);

  // Common diagnoses templates
  commonDiagnoses: Partial<Diagnosis>[] = [
    { description: 'ارتفاع ضغط الدم', icdCode: 'I10', type: DiagnosisType.PRIMARY },
    { description: 'السكري من النوع الثاني', icdCode: 'E11.9', type: DiagnosisType.PRIMARY },
    { description: 'التهاب الجهاز التنفسي العلوي', icdCode: 'J06.9', type: DiagnosisType.PROVISIONAL },
    { description: 'التهاب المعدة والأمعاء', icdCode: 'K52.9', type: DiagnosisType.PROVISIONAL },
    { description: 'الصداع النصفي', icdCode: 'G43.9', type: DiagnosisType.DIFFERENTIAL },
    { description: 'آلام أسفل الظهر', icdCode: 'M54.5', type: DiagnosisType.DIFFERENTIAL }
  ];

  // Mock ICD-10 codes for demonstration
  private icdDatabase: ICD10Code[] = [
    { code: 'I10', description: 'ارتفاع ضغط الدم الأساسي' },
    { code: 'E11.9', description: 'السكري من النوع الثاني بدون مضاعفات' },
    { code: 'J06.9', description: 'عدوى حادة في الجهاز التنفسي العلوي' },
    { code: 'K52.9', description: 'التهاب المعدة والأمعاء غير المعدي' },
    { code: 'G43.9', description: 'الصداع النصفي غير المحدد' },
    { code: 'M54.5', description: 'آلام أسفل الظهر' },
    { code: 'J45.9', description: 'الربو غير المحدد' },
    { code: 'B34.9', description: 'عدوى فيروسية غير محددة' }
  ];

  addDiagnosis(): void {
    const newDiagnosis: Diagnosis = {
      description: '',
      type: DiagnosisType.PROVISIONAL,
      isPrimary: this.diagnoses.length === 0,
      notes: ''
    };

    this.diagnoses.push(newDiagnosis);
    this.editMode.set(this.diagnoses.length - 1);
    this.showTemplates.set(false);
    this.emitChanges();
  }

  removeDiagnosis(index: number): void {
    const wasPrimary = this.diagnoses[index].isPrimary;
    this.diagnoses.splice(index, 1);

    // If removed diagnosis was primary and there are other diagnoses, make the first one primary
    if (wasPrimary && this.diagnoses.length > 0) {
      this.diagnoses[0].isPrimary = true;
    }

    this.editMode.set(-1);
    this.emitChanges();
  }

  setPrimary(index: number): void {
    this.diagnoses.forEach((d, i) => {
      d.isPrimary = i === index;
    });
    this.emitChanges();
  }

  addFromTemplate(template: Partial<Diagnosis>): void {
    const newDiagnosis: Diagnosis = {
      description: template.description || '',
      type: template.type || DiagnosisType.PROVISIONAL,
      icdCode: template.icdCode,
      isPrimary: this.diagnoses.length === 0,
      notes: ''
    };

    this.diagnoses.push(newDiagnosis);
    this.showTemplates.set(false);
    this.emitChanges();
  }

  searchICDCode(event: Event, index: number): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();

    if (searchTerm.length > 1) {
      this.activeICDIndex.set(index);
      const filtered = this.icdDatabase.filter(icd =>
        icd.code.toLowerCase().includes(searchTerm) ||
        icd.description.toLowerCase().includes(searchTerm)
      );
      this.icdSuggestions.set(filtered.slice(0, 5));
    } else {
      this.icdSuggestions.set([]);
      this.activeICDIndex.set(-1);
    }
  }

  selectICDCode(icd: ICD10Code, index: number): void {
    this.diagnoses[index].icdCode = icd.code;
    this.diagnoses[index].description = icd.description;
    this.icdSuggestions.set([]);
    this.activeICDIndex.set(-1);
    this.emitChanges();
  }

  getDiagnosisTypeLabel(type: DiagnosisType): string {
    const labels: Record<DiagnosisType, string> = {
      [DiagnosisType.PRIMARY]: 'أساسي',
      [DiagnosisType.SECONDARY]: 'ثانوي',
      [DiagnosisType.DIFFERENTIAL]: 'تشخيص تفريقي',
      [DiagnosisType.PROVISIONAL]: 'مؤقت',
      [DiagnosisType.FINAL]: 'نهائي',
      [DiagnosisType.RULED_OUT]: 'مستبعد'
    };

    return labels[type] || type;
  }

  private emitChanges(): void {
    this.diagnosesChange.emit(this.diagnoses);
  }
}
