// ===================================================================
// src/app/features/medical-records/components/lab-tests-form/lab-tests-form.component.ts
// Lab Tests Form Component - Manages laboratory tests in medical records
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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';

import {
  LabTest,
  LabTestCategory,
  TestUrgency,
  TestStatus,
} from '../../models/medical-record.model';

interface LabTestTemplate {
  name: string;
  code?: string;
  category: LabTestCategory;
  specimenType?: string;
  normalRange?: string;
  commonUrgencies: TestUrgency[];
}

@Component({
  selector: 'app-lab-tests-form',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatExpansionModule,
  ],
  templateUrl: './lab-tests-form.component.html',
  styleUrl: './lab-tests-form.component.scss'
})
export class LabTestsFormComponent {
  @Input() labTests: LabTest[] = [];
  @Input() readOnly = false;
  @Output() labTestsChange = new EventEmitter<LabTest[]>();

  expandedIndex = signal(-1);
  showTemplates = signal(true);

  // Common lab tests templates
  commonTests: Partial<LabTest>[] = [
    {
      testName: 'تعداد الدم الكامل',
      testCode: 'CBC',
      category: LabTestCategory.HEMATOLOGY,
      specimenType: 'دم',
      urgency: TestUrgency.ROUTINE,
    },
    {
      testName: 'سكر الدم الصائم',
      testCode: 'FBS',
      category: LabTestCategory.BIOCHEMISTRY, // بدل CHEMISTRY
      specimenType: 'دم',
      urgency: TestUrgency.ROUTINE,
    },
    {
      testName: 'وظائف الكلى',
      testCode: 'RFT',
      category: LabTestCategory.NEPHROLOGY, // أدق من BIOCHEMISTRY
      specimenType: 'دم',
      urgency: TestUrgency.ROUTINE,
    },
    {
      testName: 'وظائف الكبد',
      testCode: 'LFT',
      category: LabTestCategory.HEPATOLOGY, // أدق من BIOCHEMISTRY
      specimenType: 'دم',
      urgency: TestUrgency.ROUTINE,
    },
    {
      testName: 'تحليل البول',
      testCode: 'UA',
      category: LabTestCategory.TOXICOLOGY, // أو نضيف URINALYSIS كـ custom لو backend يسمح
      specimenType: 'بول',
      urgency: TestUrgency.ROUTINE,
    },
    {
      testName: 'فحص الدهون',
      testCode: 'Lipid Profile',
      category: LabTestCategory.BIOCHEMISTRY, // بدل CHEMISTRY
      specimenType: 'دم',
      urgency: TestUrgency.ROUTINE,
    },
  ];

  addLabTest(): void {
    const newLabTest: LabTest = {
      testName: '',
      category: LabTestCategory.HEMATOLOGY,
      urgency: TestUrgency.ROUTINE,
      status: TestStatus.ORDERED,
      orderedDate: new Date().toISOString().split('T')[0],
    };

    this.labTests.push(newLabTest);
    this.expandedIndex.set(this.labTests.length - 1);
    this.showTemplates.set(false);
    this.emitChanges();
  }

  removeLabTest(index: number): void {
    this.labTests.splice(index, 1);
    this.expandedIndex.set(-1);
    this.emitChanges();
  }

  setExpanded(index: number): void {
    this.expandedIndex.set(this.expandedIndex() === index ? -1 : index);
  }

  addFromTemplate(template: Partial<LabTest>): void {
    const newLabTest: LabTest = {
      testName: template.testName || '',
      testCode: template.testCode,
      category: template.category || LabTestCategory.HEMATOLOGY,
      specimenType: template.specimenType,
      urgency: template.urgency || TestUrgency.ROUTINE,
      status: TestStatus.ORDERED,
      orderedDate: new Date().toISOString().split('T')[0],
    };

    this.labTests.push(newLabTest);
    this.showTemplates.set(false);
    this.emitChanges();
  }

  getCategoryIcon(category?: LabTestCategory): string {
    const icons: Record<LabTestCategory, string> = {
      [LabTestCategory.HEMATOLOGY]: 'bloodtype',
      [LabTestCategory.BIOCHEMISTRY]: 'science',
      [LabTestCategory.MICROBIOLOGY]: 'coronavirus',
      [LabTestCategory.IMMUNOLOGY]: 'vaccines',
      [LabTestCategory.ENDOCRINOLOGY]: 'thermostat',
      [LabTestCategory.CARDIOLOGY]: 'favorite',        // heart icon
      [LabTestCategory.NEPHROLOGY]: 'water',          // kidney/water-related icon
      [LabTestCategory.HEPATOLOGY]: 'liver',          // if you have a custom icon
      [LabTestCategory.ONCOLOGY]: 'cancer',           // if you have a custom icon
      [LabTestCategory.TOXICOLOGY]: 'warning',        // hazard icon
      [LabTestCategory.GENETICS]: 'dna',
      [LabTestCategory.COAGULATION]: 'blood',         // clotting-related icon
    };

    return icons[category!] || 'science';
  }

  getUrgencyLabel(urgency?: TestUrgency): string {
    const labels: Record<TestUrgency, string> = {
      [TestUrgency.ROUTINE]: 'روتيني',
      [TestUrgency.URGENT]: 'عاجل',
      [TestUrgency.STAT]: 'فوري',
      [TestUrgency.ASAP]: 'بأسرع وقت',
    };
    return labels[urgency!] || '';
  }

  getStatusLabel(status?: TestStatus): string {
    const labels: Record<TestStatus, string> = {
      [TestStatus.ORDERED]: 'مطلوب',
      [TestStatus.COLLECTED]: 'تم السحب',
      [TestStatus.IN_PROGRESS]: 'قيد التحليل',
      [TestStatus.COMPLETED]: 'مكتمل',
      [TestStatus.CANCELLED]: 'ملغي',
      [TestStatus.DELAYED]: 'مؤجل',
    };

    return labels[status!] || '';
  }

  private emitChanges(): void {
    this.labTestsChange.emit(this.labTests);
  }
}
