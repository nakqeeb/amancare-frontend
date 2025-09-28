// ===================================================================
// src/app/features/medical-records/components/diagnosis-form/diagnosis-form.component.ts
// Diagnosis Form Component
// ===================================================================

import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormControl } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { Diagnosis, DiagnosisType, CreateDiagnosisDto } from '../../models/medical-record.model';

// Common ICD-10 codes for quick selection
interface ICD10Code {
  code: string;
  description: string;
  category: string;
}

@Component({
  selector: 'app-diagnosis-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatTableModule,
    MatTooltipModule
  ],
  template: `
    <div class="diagnosis-form">
      <div class="form-header">
        <h3 class="form-title">
          <mat-icon>medical_services</mat-icon>
          التشخيص
        </h3>
        <button mat-button (click)="addDiagnosis()" color="primary">
          <mat-icon>add</mat-icon>
          إضافة تشخيص
        </button>
      </div>

      <!-- Diagnosis List -->
      <div class="diagnoses-list">
        @if (diagnoses.length === 0) {
          <div class="empty-message">
            <mat-icon>info</mat-icon>
            <p>لم يتم إضافة أي تشخيص بعد</p>
          </div>
        } @else {
          @for (diagnosis of diagnoses; track diagnosis; let i = $index) {
            <div class="diagnosis-item" [class.primary-diagnosis]="diagnosis.isPrimary">
              <div class="diagnosis-header">
                <div class="diagnosis-number">{{ i + 1 }}</div>

                @if (diagnosis.isPrimary) {
                  <span class="primary-badge">تشخيص رئيسي</span>
                }

                <div class="diagnosis-actions">
                  @if (!diagnosis.isPrimary) {
                    <button mat-icon-button (click)="setPrimary(i)"
                            matTooltip="تعيين كرئيسي">
                      <mat-icon>star_outline</mat-icon>
                    </button>
                  }
                  <button mat-icon-button (click)="editDiagnosis(i)"
                          matTooltip="تعديل">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button (click)="removeDiagnosis(i)"
                          color="warn" matTooltip="حذف">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>

              <div class="diagnosis-content">
                <div class="diagnosis-main">
                  <strong>{{ diagnosis.description }}</strong>
                  @if (diagnosis.icdCode) {
                    <span class="icd-code">ICD-10: {{ diagnosis.icdCode }}</span>
                  }
                </div>

                <div class="diagnosis-meta">
                  <span class="diagnosis-type">{{ getDiagnosisTypeLabel(diagnosis.type) }}</span>
                </div>

                @if (diagnosis.notes) {
                  <div class="diagnosis-notes">
                    <mat-icon>note</mat-icon>
                    {{ diagnosis.notes }}
                  </div>
                }
              </div>
            </div>
          }
        }
      </div>

      <!-- Add/Edit Diagnosis Dialog -->
      @if (showForm) {
        <div class="diagnosis-form-dialog">
          <div class="form-content">
            <h4>{{ editIndex !== -1 ? 'تعديل التشخيص' : 'إضافة تشخيص جديد' }}</h4>

            <div class="form-fields">
              <!-- ICD Code Search -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>رمز ICD-10 (اختياري)</mat-label>
                <input matInput
                       [(ngModel)]="currentDiagnosis.icdCode"
                       [matAutocomplete]="icdAuto"
                       placeholder="ابحث عن رمز ICD-10">
                <mat-icon matPrefix>search</mat-icon>
                <mat-autocomplete #icdAuto="matAutocomplete"
                                (optionSelected)="onICDSelected($event)">
                  @for (code of filteredICDCodes | async; track code.code) {
                    <mat-option [value]="code.code">
                      <span class="icd-option">
                        <strong>{{ code.code }}</strong> - {{ code.description }}
                      </span>
                    </mat-option>
                  }
                </mat-autocomplete>
              </mat-form-field>

              <!-- Description -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>وصف التشخيص *</mat-label>
                <textarea matInput
                          [(ngModel)]="currentDiagnosis.description"
                          rows="3"
                          placeholder="أدخل وصف التشخيص"
                          required></textarea>
              </mat-form-field>

              <!-- Diagnosis Type -->
              <mat-form-field appearance="outline">
                <mat-label>نوع التشخيص</mat-label>
                <mat-select [(ngModel)]="currentDiagnosis.type">
                  <mat-option value="PRELIMINARY">أولي</mat-option>
                  <mat-option value="DIFFERENTIAL">تفريقي</mat-option>
                  <mat-option value="CONFIRMED">مؤكد</mat-option>
                  <mat-option value="RULED_OUT">مستبعد</mat-option>
                </mat-select>
              </mat-form-field>

              <!-- Is Primary -->
              <mat-checkbox [(ngModel)]="currentDiagnosis.isPrimary">
                تشخيص رئيسي
              </mat-checkbox>

              <!-- Notes -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>ملاحظات (اختياري)</mat-label>
                <textarea matInput
                          [(ngModel)]="currentDiagnosis.notes"
                          rows="2"
                          placeholder="ملاحظات إضافية"></textarea>
              </mat-form-field>
            </div>

            <div class="form-actions">
              <button mat-button (click)="cancelEdit()">إلغاء</button>
              <button mat-raised-button color="primary"
                      (click)="saveDiagnosis()"
                      [disabled]="!currentDiagnosis.description">
                {{ editIndex !== -1 ? 'تحديث' : 'إضافة' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Quick Templates -->
      @if (!showForm && diagnoses.length === 0) {
        <div class="quick-templates">
          <h4>تشخيصات شائعة:</h4>
          <div class="template-chips">
            @for (template of commonDiagnoses; track template.code) {
              <button mat-stroked-button (click)="useTemplate(template)">
                {{ template.description }}
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .diagnosis-form {
      .form-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-lg);

        .form-title {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-medium);
          color: var(--text-primary);
          margin: 0;

          mat-icon {
            color: var(--primary);
          }
        }
      }

      .diagnoses-list {
        margin-bottom: var(--spacing-lg);

        .empty-message {
          text-align: center;
          padding: var(--spacing-2xl);
          color: var(--text-secondary);

          mat-icon {
            font-size: 48px;
            width: 48px;
            height: 48px;
            color: var(--text-disabled);
          }

          p {
            margin-top: var(--spacing-md);
          }
        }

        .diagnosis-item {
          background: var(--background-secondary);
          border-radius: var(--border-radius-md);
          padding: var(--spacing-md);
          margin-bottom: var(--spacing-md);
          border-left: 3px solid var(--divider);
          transition: var(--transition-base);

          &:hover {
            box-shadow: var(--shadow-sm);
          }

          &.primary-diagnosis {
            border-left-color: var(--primary);
            background: rgba(var(--primary-rgb), 0.05);
          }

          .diagnosis-header {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
            margin-bottom: var(--spacing-sm);

            .diagnosis-number {
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: var(--primary);
              color: var(--text-on-primary);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: var(--font-size-sm);
              font-weight: var(--font-weight-medium);
            }

            .primary-badge {
              padding: var(--spacing-xs) var(--spacing-sm);
              background: var(--primary);
              color: var(--text-on-primary);
              border-radius: var(--border-radius-sm);
              font-size: var(--font-size-xs);
              font-weight: var(--font-weight-medium);
            }

            .diagnosis-actions {
              margin-left: auto;
              display: flex;
              gap: var(--spacing-xs);
            }
          }

          .diagnosis-content {
            .diagnosis-main {
              display: flex;
              align-items: baseline;
              gap: var(--spacing-md);
              margin-bottom: var(--spacing-sm);

              strong {
                color: var(--text-primary);
                font-weight: var(--font-weight-medium);
              }

              .icd-code {
                font-family: var(--font-family-mono);
                font-size: var(--font-size-sm);
                color: var(--text-secondary);
                padding: var(--spacing-xs) var(--spacing-sm);
                background: var(--background);
                border-radius: var(--border-radius-sm);
              }
            }

            .diagnosis-meta {
              display: flex;
              gap: var(--spacing-sm);
              margin-bottom: var(--spacing-sm);

              .diagnosis-type {
                padding: var(--spacing-xs) var(--spacing-sm);
                background: var(--background);
                border-radius: var(--border-radius-sm);
                font-size: var(--font-size-sm);
                color: var(--text-secondary);
              }
            }

            .diagnosis-notes {
              display: flex;
              align-items: flex-start;
              gap: var(--spacing-sm);
              padding: var(--spacing-sm);
              background: var(--background);
              border-radius: var(--border-radius-sm);
              font-size: var(--font-size-sm);
              color: var(--text-secondary);

              mat-icon {
                font-size: 16px;
                width: 16px;
                height: 16px;
                margin-top: 2px;
              }
            }
          }
        }
      }

      .diagnosis-form-dialog {
        background: var(--surface);
        border-radius: var(--border-radius-lg);
        padding: var(--spacing-lg);
        margin-bottom: var(--spacing-lg);
        box-shadow: var(--shadow-md);

        .form-content {
          h4 {
            margin: 0 0 var(--spacing-lg) 0;
            color: var(--text-primary);
          }

          .form-fields {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-md);

            .full-width {
              width: 100%;
            }

            mat-checkbox {
              margin: var(--spacing-sm) 0;
            }
          }

          .form-actions {
            display: flex;
            justify-content: flex-end;
            gap: var(--spacing-sm);
            margin-top: var(--spacing-lg);
            padding-top: var(--spacing-lg);
            border-top: 1px solid var(--divider);
          }
        }
      }

      .quick-templates {
        background: var(--background-secondary);
        border-radius: var(--border-radius-md);
        padding: var(--spacing-md);

        h4 {
          margin: 0 0 var(--spacing-md) 0;
          color: var(--text-secondary);
          font-size: var(--font-size-sm);
        }

        .template-chips {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-sm);

          button {
            font-size: var(--font-size-sm);
          }
        }
      }

      .icd-option {
        display: flex;
        gap: var(--spacing-sm);

        strong {
          color: var(--primary);
        }
      }
    }
  `]
})
export class DiagnosisFormComponent implements OnInit {
  @Input() diagnoses: Diagnosis[] = [];
  @Input() readOnly = false;

  @Output() diagnosesChange = new EventEmitter<Diagnosis[]>();

  showForm = false;
  editIndex = -1;
  currentDiagnosis: CreateDiagnosisDto = this.getEmptyDiagnosis();

  icdControl = new FormControl('');
  filteredICDCodes!: Observable<ICD10Code[]>;

  // Common diagnoses for quick selection
  commonDiagnoses: ICD10Code[] = [
    { code: 'J00', description: 'نزلة برد حادة', category: 'أمراض الجهاز التنفسي' },
    { code: 'J03.9', description: 'التهاب اللوزتين الحاد', category: 'أمراض الجهاز التنفسي' },
    { code: 'K29.7', description: 'التهاب المعدة', category: 'أمراض الجهاز الهضمي' },
    { code: 'I10', description: 'ارتفاع ضغط الدم', category: 'أمراض القلب والأوعية' },
    { code: 'E11.9', description: 'السكري النوع الثاني', category: 'أمراض الغدد الصماء' },
    { code: 'J45.9', description: 'الربو', category: 'أمراض الجهاز التنفسي' }
  ];

  // Full ICD-10 codes list (simplified for demo)
  icdCodes: ICD10Code[] = [
    ...this.commonDiagnoses,
    { code: 'A09', description: 'الإسهال والتهاب المعدة والأمعاء', category: 'أمراض معدية' },
    { code: 'B34.2', description: 'عدوى فيروس كورونا', category: 'أمراض معدية' },
    { code: 'E78.5', description: 'ارتفاع الدهون في الدم', category: 'أمراض الغدد الصماء' },
    { code: 'F32.9', description: 'اكتئاب', category: 'اضطرابات نفسية' },
    { code: 'G43.9', description: 'الصداع النصفي', category: 'أمراض الجهاز العصبي' },
    { code: 'M25.5', description: 'ألم في المفصل', category: 'أمراض الجهاز العضلي' },
    { code: 'N39.0', description: 'التهاب المسالك البولية', category: 'أمراض الجهاز البولي' }
  ];

  ngOnInit(): void {
    this.setupAutocomplete();
  }

  private setupAutocomplete(): void {
    this.filteredICDCodes = this.icdControl.valueChanges.pipe(
      startWith(''),
      map(value => this.filterICDCodes(value || ''))
    );
  }

  private filterICDCodes(value: string): ICD10Code[] {
    const filterValue = value.toLowerCase();
    return this.icdCodes.filter(code =>
      code.code.toLowerCase().includes(filterValue) ||
      code.description.toLowerCase().includes(filterValue)
    );
  }

  getEmptyDiagnosis(): CreateDiagnosisDto {
    return {
      icdCode: '',
      description: '',
      type: DiagnosisType.CONFIRMED,
      isPrimary: false,
      notes: ''
    };
  }

  addDiagnosis(): void {
    this.currentDiagnosis = this.getEmptyDiagnosis();
    this.editIndex = -1;
    this.showForm = true;
  }

  editDiagnosis(index: number): void {
    this.currentDiagnosis = { ...this.diagnoses[index] };
    this.editIndex = index;
    this.showForm = true;
  }

  saveDiagnosis(): void {
    if (!this.currentDiagnosis.description) return;

    const diagnosis: Diagnosis = {
      ...this.currentDiagnosis,
      id: this.editIndex !== -1 ? this.diagnoses[this.editIndex].id : undefined
    };

    if (this.editIndex !== -1) {
      this.diagnoses[this.editIndex] = diagnosis;
    } else {
      // If this is the first diagnosis, make it primary
      if (this.diagnoses.length === 0) {
        diagnosis.isPrimary = true;
      }
      // If this is marked as primary, unmark others
      if (diagnosis.isPrimary) {
        this.diagnoses.forEach(d => d.isPrimary = false);
      }
      this.diagnoses.push(diagnosis);
    }

    this.diagnosesChange.emit(this.diagnoses);
    this.cancelEdit();
  }

  removeDiagnosis(index: number): void {
    const wasPrimary = this.diagnoses[index].isPrimary;
    this.diagnoses.splice(index, 1);

    // If we removed the primary diagnosis and there are others, make the first one primary
    if (wasPrimary && this.diagnoses.length > 0) {
      this.diagnoses[0].isPrimary = true;
    }

    this.diagnosesChange.emit(this.diagnoses);
  }

  setPrimary(index: number): void {
    this.diagnoses.forEach((d, i) => {
      d.isPrimary = i === index;
    });
    this.diagnosesChange.emit(this.diagnoses);
  }

  cancelEdit(): void {
    this.showForm = false;
    this.currentDiagnosis = this.getEmptyDiagnosis();
    this.editIndex = -1;
  }

  onICDSelected(event: any): void {
    const selectedCode = this.icdCodes.find(c => c.code === event.option.value);
    if (selectedCode) {
      this.currentDiagnosis.icdCode = selectedCode.code;
      this.currentDiagnosis.description = selectedCode.description;
    }
  }

  useTemplate(template: ICD10Code): void {
    this.currentDiagnosis = {
      icdCode: template.code,
      description: template.description,
      type: DiagnosisType.CONFIRMED,
      isPrimary: this.diagnoses.length === 0,
      notes: ''
    };
    this.editIndex = -1;
    this.showForm = true;
  }

  getDiagnosisTypeLabel(type: DiagnosisType): string {
    const labels: Record<DiagnosisType, string> = {
      [DiagnosisType.PRELIMINARY]: 'أولي',
      [DiagnosisType.DIFFERENTIAL]: 'تفريقي',
      [DiagnosisType.CONFIRMED]: 'مؤكد',
      [DiagnosisType.RULED_OUT]: 'مستبعد'
    };
    return labels[type] || type;
  }
}
