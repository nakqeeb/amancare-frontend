// ===================================================================
// src/app/features/medical-records/components/lab-results/lab-results.component.ts
// Lab Results Component - Display and manage laboratory test results
// Can be used as both a routed component and an embedded child component
// ===================================================================

import { Component, OnInit, Input, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatBadgeModule } from '@angular/material/badge';

import { MedicalRecordService } from '../../services/medical-record.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

import {
  MedicalRecord,
  LabTest,
  LabTestCategory,
  TestStatus,
  TestUrgency
} from '../../models/medical-record.model';
import { HeaderComponent } from "../../../../shared/components/header/header.component";
import { SidebarComponent } from "../../../../shared/components/sidebar/sidebar.component";

@Component({
  selector: 'app-lab-results',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    MatExpansionModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatBadgeModule,
    HeaderComponent,
    SidebarComponent
],
  templateUrl: './lab-results.component.html',
  styleUrl: './lab-results.component.scss',
})
export class LabResultsComponent implements OnInit {
  private medicalRecordService = inject(MedicalRecordService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);

  // Input properties for when used as a child component
  @Input() labTests: LabTest[] | undefined;
  @Input() readOnly = false;
  @Input() compact = false;

  testUrgency = TestUrgency;

  // State
  loading = signal(false);
  medicalRecord = signal<MedicalRecord | null>(null);
  labTestsSignal = signal<LabTest[]>([]);

  // Computed property that uses either input or loaded data
  labTestsData = computed(() => {
    if (this.isEmbedded && this.labTests !== undefined) {
      return this.labTests;
    }
    return this.labTestsSignal();
  });

  filteredLabTests = computed(() => {
    let tests = this.labTestsData();

    // Apply search filter
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      tests = tests.filter(t =>
        t.testName.toLowerCase().includes(search) ||
        t.testCode?.toLowerCase().includes(search) ||
        t.specimenNumber?.toLowerCase().includes(search)
      );
    }

    // Apply category filter
    if (this.selectedCategory) {
      tests = tests.filter(t => t.category === this.selectedCategory);
    }

    // Apply status filter
    if (this.selectedStatus) {
      tests = tests.filter(t => t.status === this.selectedStatus);
    }

    // Apply urgency filter
    if (this.selectedUrgency) {
      tests = tests.filter(t => t.urgency === this.selectedUrgency);
    }

    return tests;
  });

  expandedTestId = signal<number | null>(null);
  currentUser = this.authService.currentUser;

  // Determine if component is used as embedded or standalone
  get isEmbedded(): boolean {
    return this.labTests !== undefined;
  }

  // Filters
  searchTerm = '';
  selectedCategory = '';
  selectedStatus = '';
  selectedUrgency = '';

  // Statistics
  totalTests = computed(() => this.labTestsData().length);
  completedTests = computed(() =>
    this.labTestsData().filter(t => t.status === TestStatus.COMPLETED).length
  );
  pendingTests = computed(() =>
    this.labTestsData().filter(t =>
      t.status === TestStatus.ORDERED ||
      t.status === TestStatus.IN_PROGRESS
    ).length
  );
  // abnormalResults = computed(() =>
  //   this.labTestsData().filter(t => t.isAbnormal).length
  // );
  abnormalResults = computed(() =>
    this.labTestsData().filter(t => {
      if (!t.results || !t.normalRange) return false;
      // simple example: check if results value is outside normalRange
      const resultNum = parseFloat(t.results);
      const [min, max] = t.normalRange.split('-').map(Number);
      return resultNum < min || resultNum > max;
    }).length
  );

  // Dropdown options
  categories = [
    { value: LabTestCategory.HEMATOLOGY, label: 'أمراض الدم' },
    { value: LabTestCategory.BIOCHEMISTRY, label: 'الكيمياء الحيوية' },
    { value: LabTestCategory.MICROBIOLOGY, label: 'الأحياء الدقيقة' },
    { value: LabTestCategory.IMMUNOLOGY, label: 'المناعة' },
    { value: LabTestCategory.ENDOCRINOLOGY, label: 'الغدد الصماء' },
    { value: LabTestCategory.CARDIOLOGY, label: 'القلب' },
    { value: LabTestCategory.NEPHROLOGY, label: 'الكلى' },
    { value: LabTestCategory.HEPATOLOGY, label: 'الكبد' },
    { value: LabTestCategory.ONCOLOGY, label: 'الأورام' },
    { value: LabTestCategory.TOXICOLOGY, label: 'السموم' },
    { value: LabTestCategory.GENETICS, label: 'الوراثة' },
    { value: LabTestCategory.COAGULATION, label: 'التخثر' }
  ];

  statuses = [
    { value: TestStatus.ORDERED, label: 'مطلوب' },
    { value: TestStatus.COLLECTED, label: 'تم جمع العينة' },
    { value: TestStatus.IN_PROGRESS, label: 'قيد التنفيذ' },
    { value: TestStatus.COMPLETED, label: 'مكتمل' },
    { value: TestStatus.CANCELLED, label: 'ملغي' },
    { value: TestStatus.DELAYED, label: 'مؤجل' }
  ];

  urgencies = [
    { value: TestUrgency.ROUTINE, label: 'عادي' },
    { value: TestUrgency.URGENT, label: 'عاجل' },
    { value: TestUrgency.STAT, label: 'فوري' },
    { value: TestUrgency.ASAP, label: 'بأسرع وقت' }
  ];

  ngOnInit(): void {
    // Only load data if not embedded (standalone mode)
    if (!this.isEmbedded) {
      const recordId = this.route.snapshot.paramMap.get('id');
      if (recordId) {
        this.loadMedicalRecord(parseInt(recordId));
      } else {
        this.router.navigate(['/medical-records']);
      }
    }
  }

  private loadMedicalRecord(id: number): void {
    this.loading.set(true);
    this.medicalRecordService.getMedicalRecordById(id).subscribe({
      next: (record) => {
        this.medicalRecord.set(record);
        this.labTestsSignal.set(record.labTests || []);
        this.loading.set(false);
      },
      error: () => {
        this.notificationService.error('خطأ في تحميل نتائج المختبر');
        this.loading.set(false);
        this.router.navigate(['/medical-records']);
      }
    });
  }

  // Navigation
  onBack(): void {
    this.router.navigate(['/medical-records', this.medicalRecord()?.id]);
  }

  onRefresh(): void {
    if (this.medicalRecord() && !this.isEmbedded) {
      this.loadMedicalRecord(this.medicalRecord()!.id!);
    }
  }

  // Filter
  applyFilter(): void {
    // Triggers computed recalculation
  }

  // Actions
  onPrintResults(): void {
    window.print();
  }

  onExportPDF(): void {
    if (this.medicalRecord() || this.isEmbedded) {
      this.notificationService.info('جاري تصدير النتائج...');
      // Implementation would generate PDF
    }
  }

  onAddResult(): void {
    // Would open a dialog to add new lab test
    this.notificationService.info('إضافة نتيجة جديدة');
  }

  onEditResult(test: LabTest): void {
    this.notificationService.info(`تعديل ${test.testName}`);
  }

  onUpdateResult(test: LabTest): void {
    this.notificationService.info(`تحديث نتيجة ${test.testName}`);
  }

  onPrintTest(test: LabTest): void {
    this.notificationService.info(`طباعة ${test.testName}`);
  }

  onDeleteTest(test: LabTest): void {
    // Would show confirmation dialog
    this.notificationService.info(`حذف ${test.testName}`);
  }

  // Permissions
  canEdit(): boolean {
    if (this.readOnly) return false;
    const user = this.currentUser();
    return user?.role === 'DOCTOR' ||
      user?.role === 'ADMIN' ||
      user?.role === 'SYSTEM_ADMIN';
  }

  // Utility methods
  getStatusLabel(status: TestStatus): string {
    const statusMap: Record<TestStatus, string> = {
      [TestStatus.ORDERED]: 'مطلوب',
      [TestStatus.COLLECTED]: 'تم جمع العينة',
      [TestStatus.IN_PROGRESS]: 'قيد التنفيذ',
      [TestStatus.COMPLETED]: 'مكتمل',
      [TestStatus.CANCELLED]: 'ملغي',
      [TestStatus.DELAYED]: 'مؤجل'
    };
    return statusMap[status] || status;
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

  getCategoryLabel(category: LabTestCategory): string {
    const categoryMap: Record<LabTestCategory, string> = {
      [LabTestCategory.HEMATOLOGY]: 'أمراض الدم',
      [LabTestCategory.BIOCHEMISTRY]: 'الكيمياء الحيوية',
      [LabTestCategory.MICROBIOLOGY]: 'الأحياء الدقيقة',
      [LabTestCategory.IMMUNOLOGY]: 'المناعة',
      [LabTestCategory.ENDOCRINOLOGY]: 'الغدد الصماء',
      [LabTestCategory.CARDIOLOGY]: 'القلب',
      [LabTestCategory.NEPHROLOGY]: 'الكلى',
      [LabTestCategory.HEPATOLOGY]: 'الكبد',
      [LabTestCategory.ONCOLOGY]: 'الأورام',
      [LabTestCategory.TOXICOLOGY]: 'السموم',
      [LabTestCategory.GENETICS]: 'الوراثة',
      [LabTestCategory.COAGULATION]: 'التخثر'
    };

    return categoryMap[category] || category;
  }
  formatDate(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('ar-SA');
  }

  formatDateTime(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('ar-SA');
  }

  isHighValue(test: LabTest): boolean {
    // Logic to determine if value is higher than normal
    // This would need proper parsing of normalRange and resultValue
    return true; // Placeholder
  }

  isAbnormal(test: LabTest): boolean {
    if (!test.resultDate || !test.results || !test.normalRange) {
      return false;
    }

    // Example: if results and normalRange are numeric, check bounds
    const value = parseFloat(test.results);
    const rangeParts = test.normalRange.split('-').map(p => parseFloat(p.trim()));

    if (rangeParts.length === 2 && !isNaN(value)) {
      const [low, high] = rangeParts;
      return value < low || value > high;
    }

    return false; // default if not numeric
  }
}
