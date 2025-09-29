// ===================================================================
// src/app/features/medical-records/components/medical-procedures-form/medical-procedures-form.component.ts
// Medical Procedures Form Component - Manages medical procedures
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
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';

import { MedicalProcedure, ProcedureCategory } from '../../models/medical-record.model';

@Component({
  selector: 'app-medical-procedures-form',
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
    MatExpansionModule,
    MatChipsModule
  ],
  templateUrl: './medical-procedures-form.component.html',
  styleUrl: './medical-procedures-form.component.scss'
})
export class MedicalProceduresFormComponent {
  @Input() procedures: MedicalProcedure[] = [];
  @Input() readOnly = false;
  @Output() proceduresChange = new EventEmitter<MedicalProcedure[]>();

  expandedIndex = signal(-1);
  showTemplates = signal(true);

  // Common procedures templates
  commonProcedures: Partial<MedicalProcedure>[] = [
    {
      procedureName: 'قياس العلامات الحيوية',
      category: ProcedureCategory.DIAGNOSTIC,
      description: 'قياس ضغط الدم، النبض، الحرارة، والتنفس'
    },
    {
      procedureName: 'سحب عينة دم',
      category: ProcedureCategory.DIAGNOSTIC,
      description: 'سحب عينة دم للتحليل المخبري'
    },
    {
      procedureName: 'تركيب قسطرة وريدية',
      category: ProcedureCategory.THERAPEUTIC,
      description: 'تركيب قسطرة وريدية لإعطاء الأدوية أو السوائل'
    },
    {
      procedureName: 'خياطة جرح',
      category: ProcedureCategory.SURGICAL,
      description: 'خياطة جرح بسيط'
    },
    {
      procedureName: 'تضميد الجروح',
      category: ProcedureCategory.THERAPEUTIC,
      description: 'تنظيف وتضميد الجروح'
    },
    {
      procedureName: 'حقنة عضلية',
      category: ProcedureCategory.THERAPEUTIC,
      description: 'إعطاء دواء عن طريق الحقن العضلي'
    },
    {
      procedureName: 'تخطيط القلب',
      category: ProcedureCategory.DIAGNOSTIC,
      description: 'إجراء تخطيط كهربائي للقلب'
    },
    {
      procedureName: 'إزالة غرز جراحية',
      category: ProcedureCategory.SURGICAL,
      description: 'إزالة الغرز الجراحية بعد الشفاء'
    }
  ];

  addProcedure(): void {
    const newProcedure: MedicalProcedure = {
      procedureName: '',
      category: ProcedureCategory.THERAPEUTIC,
      performedDate: new Date().toISOString().split('T')[0]
    };

    this.procedures.push(newProcedure);
    this.expandedIndex.set(this.procedures.length - 1);
    this.showTemplates.set(false);
    this.emitChanges();
  }

  removeProcedure(index: number): void {
    this.procedures.splice(index, 1);
    this.expandedIndex.set(-1);
    this.emitChanges();
  }

  setExpanded(index: number): void {
    this.expandedIndex.set(this.expandedIndex() === index ? -1 : index);
  }

  addFromTemplate(template: Partial<MedicalProcedure>): void {
    const newProcedure: MedicalProcedure = {
      procedureName: template.procedureName || '',
      procedureCode: template.procedureCode,
      category: template.category || ProcedureCategory.THERAPEUTIC,
      description: template.description,
      performedDate: new Date().toISOString().split('T')[0]
    };

    this.procedures.push(newProcedure);
    this.showTemplates.set(false);
    this.emitChanges();
  }

  getCategoryIcon(category?: ProcedureCategory): string {
  const icons: Record<ProcedureCategory, string> = {
    [ProcedureCategory.DIAGNOSTIC]: 'troubleshoot',
    [ProcedureCategory.THERAPEUTIC]: 'healing',
    [ProcedureCategory.SURGICAL]: 'medical_services',
    [ProcedureCategory.PREVENTIVE]: 'shield',
    [ProcedureCategory.COSMETIC]: 'face_retouching_natural', // choose a suitable icon
    [ProcedureCategory.EMERGENCY]: 'emergency',
    [ProcedureCategory.REHABILITATION]: 'fitness_center'     // choose a suitable icon
  };

  return icons[category!] || 'medical_services';
}

getCategoryLabel(category?: ProcedureCategory): string {
  const labels: Record<ProcedureCategory, string> = {
    [ProcedureCategory.DIAGNOSTIC]: 'تشخيصي',
    [ProcedureCategory.THERAPEUTIC]: 'علاجي',
    [ProcedureCategory.SURGICAL]: 'جراحي',
    [ProcedureCategory.PREVENTIVE]: 'وقائي',
    [ProcedureCategory.COSMETIC]: 'تجميلي',
    [ProcedureCategory.EMERGENCY]: 'طارئ',
    [ProcedureCategory.REHABILITATION]: 'تأهيلي'
  };

  return labels[category!] || '';
}

  formatDate(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('ar-SA');
  }

  private emitChanges(): void {
    this.proceduresChange.emit(this.procedures);
  }
}
