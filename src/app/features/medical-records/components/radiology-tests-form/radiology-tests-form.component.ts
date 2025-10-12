// ===================================================================
// src/app/features/medical-records/components/radiology-tests-form/radiology-tests-form.component.ts
// Radiology Tests Form Component - Manages radiology/imaging tests
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
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';

import { RadiologyTest, RadiologyType, TestUrgency, TestStatus } from '../../models/medical-record.model';

@Component({
  selector: 'app-radiology-tests-form',
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
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatExpansionModule
  ],
  templateUrl: './radiology-tests-form.component.html',
  styleUrl: './radiology-tests-form.component.scss'
})
export class RadiologyTestsFormComponent {
  @Input() radiologyTests: RadiologyTest[] = [];
  @Input() readOnly = false;
  @Output() radiologyTestsChange = new EventEmitter<RadiologyTest[]>();

  expandedIndex = signal(-1);
  showTemplates = signal(true);

  // Common radiology tests templates
  commonTests: Partial<RadiologyTest>[] = [
    {
      testName: 'أشعة الصدر',
      testType: RadiologyType.X_RAY,
      bodyPart: 'الصدر',
      urgency: TestUrgency.ROUTINE
    },
    {
      testName: 'الأشعة المقطعية للبطن',
      testType: RadiologyType.CT_SCAN,
      bodyPart: 'البطن',
      urgency: TestUrgency.ROUTINE
    },
    {
      testName: 'الرنين المغناطيسي للرأس',
      testType: RadiologyType.MRI,
      bodyPart: 'الرأس',
      urgency: TestUrgency.ROUTINE
    },
    {
      testName: 'الموجات فوق الصوتية للبطن',
      testType: RadiologyType.ULTRASOUND,
      bodyPart: 'البطن',
      urgency: TestUrgency.ROUTINE
    },
    {
      testName: 'أشعة العظام',
      testType: RadiologyType.BONE_SCAN,
      bodyPart: 'العظام',
      urgency: TestUrgency.URGENT
    },
    {
      testName: 'تصوير الثدي الشعاعي',
      testType: RadiologyType.MAMMOGRAPHY,
      bodyPart: 'الثدي',
      urgency: TestUrgency.ROUTINE
    }
  ];

  addRadiologyTest(): void {
    const newTest: RadiologyTest = {
      testName: '',
      testType: RadiologyType.X_RAY,
      urgency: TestUrgency.ROUTINE,
      status: TestStatus.ORDERED,
      orderedDate: new Date().toISOString().split('T')[0]
    };

    this.radiologyTests.push(newTest);
    this.expandedIndex.set(this.radiologyTests.length - 1);
    this.showTemplates.set(false);
    this.emitChanges();
  }

  removeRadiologyTest(index: number): void {
    this.radiologyTests.splice(index, 1);
    this.expandedIndex.set(-1);
    this.emitChanges();
  }

  setExpanded(index: number): void {
    this.expandedIndex.set(this.expandedIndex() === index ? -1 : index);
  }

  addFromTemplate(template: Partial<RadiologyTest>): void {
    const newTest: RadiologyTest = {
      testName: template.testName || '',
      testType: template.testType || RadiologyType.X_RAY,
      bodyPart: template.bodyPart,
      urgency: template.urgency || TestUrgency.ROUTINE,
      status: TestStatus.ORDERED,
      orderedDate: new Date().toISOString().split('T')[0]
    };

    this.radiologyTests.push(newTest);
    this.showTemplates.set(false);
    this.emitChanges();
  }

  getTypeIcon(type?: RadiologyType): string {
    const icons: Record<RadiologyType, string> = {
      [RadiologyType.X_RAY]: 'radio_button_checked',
      [RadiologyType.CT_SCAN]: 'donut_large',
      [RadiologyType.MRI]: 'memory',
      [RadiologyType.ULTRASOUND]: 'graphic_eq',
      [RadiologyType.PET_SCAN]: 'blur_circular',
      [RadiologyType.MAMMOGRAPHY]: 'medical_information',
      [RadiologyType.FLUOROSCOPY]: 'fluorescent',
      [RadiologyType.BONE_SCAN]: 'square_foot', // pick a suitable icon
      [RadiologyType.ANGIOGRAPHY]: 'show_chart', // pick a suitable icon
      [RadiologyType.NUCLEAR_MEDICINE]: 'science' // pick a suitable icon
    };

    return icons[type!] || 'medical_information';
  }

  getTypeLabel(type?: RadiologyType): string {
    const labels: Record<RadiologyType, string> = {
      [RadiologyType.X_RAY]: 'أشعة سينية',
      [RadiologyType.CT_SCAN]: 'أشعة مقطعية',
      [RadiologyType.MRI]: 'رنين مغناطيسي',
      [RadiologyType.ULTRASOUND]: 'موجات فوق صوتية',
      [RadiologyType.PET_SCAN]: 'مسح البوزيترون',
      [RadiologyType.MAMMOGRAPHY]: 'تصوير الثدي',
      [RadiologyType.FLUOROSCOPY]: 'تنظير الأشعة',
      [RadiologyType.BONE_SCAN]: 'مسح العظام',
      [RadiologyType.ANGIOGRAPHY]: 'تصوير الأوعية',
      [RadiologyType.NUCLEAR_MEDICINE]: 'طب نووي'
    };

    return labels[type!] || '';
  }

  getUrgencyLabel(urgency?: TestUrgency): string {
    const labels: Record<TestUrgency, string> = {
      [TestUrgency.ROUTINE]: 'روتيني',
      [TestUrgency.URGENT]: 'عاجل',
      [TestUrgency.STAT]: 'فوري',
      [TestUrgency.ASAP]: 'بأسرع وقت'
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
      [TestStatus.DELAYED]: 'مؤجل'
    };

    return labels[status!] || '';
  }
  private emitChanges(): void {
    this.radiologyTestsChange.emit(this.radiologyTests);
  }
}
