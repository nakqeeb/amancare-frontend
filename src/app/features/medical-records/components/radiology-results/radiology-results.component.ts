// ===================================================================
// src/app/features/medical-records/components/radiology-results/radiology-results.component.ts
// Radiology Results Component - Display and manage radiology/imaging results
// Can be used as both a routed component and an embedded child component
// ===================================================================

import { Component, OnInit, Input, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';

import { MedicalRecordService } from '../../services/medical-record.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

import {
  MedicalRecord,
  RadiologyTest,
  RadiologyType,
  TestStatus,
  TestUrgency
} from '../../models/medical-record.model';
import { HeaderComponent } from "../../../../shared/components/header/header.component";
import { SidebarComponent } from "../../../../shared/components/sidebar/sidebar.component";

@Component({
  selector: 'app-radiology-results',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
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
    MatTabsModule,
    MatBadgeModule,
    HeaderComponent,
    SidebarComponent
],
  templateUrl: './radiology-results.component.html',
  styleUrl: './radiology-results.component.scss'
})
export class RadiologyResultsComponent implements OnInit {
  private medicalRecordService = inject(MedicalRecordService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);

  // Input properties for when used as a child component
  @Input() radiologyTests: RadiologyTest[] | undefined;
  @Input() readOnly = false;
  @Input() compact = false;

  testUrgency = TestUrgency;

  // State
  loading = signal(false);
  medicalRecord = signal<MedicalRecord | null>(null);
  radiologyTestsSignal = signal<RadiologyTest[]>([]);

  // Computed property that uses either input or loaded data
  radiologyTestsData = computed(() => {
    if (this.isEmbedded && this.radiologyTests !== undefined) {
      return this.radiologyTests;
    }
    return this.radiologyTestsSignal();
  });

  filteredRadiologyTests = computed(() => {
    let tests = this.radiologyTestsData();

    // Apply search filter
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      tests = tests.filter(t =>
        t.testName.toLowerCase().includes(search) ||
        // t.testCode?.toLowerCase().includes(search) ||
        t.bodyPart?.toLowerCase().includes(search)
      );
    }

    // Apply type filter
    if (this.selectedType) {
      tests = tests.filter(t => t.testType === this.selectedType);
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
  selectedView = 0; // 0: List, 1: Grid

  // Determine if component is used as embedded or standalone
  get isEmbedded(): boolean {
    return this.radiologyTests !== undefined;
  }

  // Filters
  searchTerm = '';
  selectedType = '';
  selectedStatus = '';
  selectedUrgency = '';

  // Statistics
  totalTests = computed(() => this.radiologyTestsData().length);
  completedTests = computed(() =>
    this.radiologyTestsData().filter(t => t.status === TestStatus.COMPLETED).length
  );
  pendingTests = computed(() =>
    this.radiologyTestsData().filter(t =>
      t.status === TestStatus.ORDERED ||
      t.status === TestStatus.IN_PROGRESS
    ).length
  );
  // totalImages = computed(() =>
  //   this.radiologyTestsData().reduce((sum, t) => sum + (t.numberOfImages! || 0), 0)
  // );

  // Dropdown options
  radiologyTypes = [
    { value: RadiologyType.X_RAY, label: 'أشعة سينية' },
    { value: RadiologyType.CT_SCAN, label: 'أشعة مقطعية' },
    { value: RadiologyType.MRI, label: 'رنين مغناطيسي' },
    { value: RadiologyType.ULTRASOUND, label: 'موجات فوق صوتية' },
    { value: RadiologyType.PET_SCAN, label: 'مسح بوزيتروني' },
    { value: RadiologyType.MAMMOGRAPHY, label: 'تصوير الثدي' },
    { value: RadiologyType.FLUOROSCOPY, label: 'تنظير الأشعة' },
    { value: RadiologyType.BONE_SCAN, label: 'مسح العظام' },
    { value: RadiologyType.ANGIOGRAPHY, label: 'تصوير الأوعية' },
    { value: RadiologyType.NUCLEAR_MEDICINE, label: 'طب نووي' }
  ];

  statuses = [
    { value: TestStatus.ORDERED, label: 'مطلوب' },
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
        this.radiologyTestsSignal.set(record.radiologyTests || []);
        this.loading.set(false);
      },
      error: () => {
        this.notificationService.error('خطأ في تحميل نتائج الأشعة');
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
  onViewImages(): void {
    this.notificationService.info('فتح معرض الصور');
  }

  onPrintResults(): void {
    window.print();
  }

  onExportPDF(): void {
    if (this.medicalRecord()) {
      this.notificationService.info('جاري تصدير النتائج...');
      // Implementation would generate PDF
    }
  }

  onAddResult(): void {
    // Would open a dialog to add new radiology test
    this.notificationService.info('إضافة فحص جديد');
  }

  onEditResult(test: RadiologyTest): void {
    this.notificationService.info(`تعديل ${test.testName}`);
  }

  onUpdateResult(test: RadiologyTest): void {
    this.notificationService.info(`تحديث نتيجة ${test.testName}`);
  }

  onUploadImages(test: RadiologyTest): void {
    this.notificationService.info(`رفع صور لـ ${test.testName}`);
  }

  onPrintTest(test: RadiologyTest): void {
    this.notificationService.info(`طباعة ${test.testName}`);
  }

  onDeleteTest(test: RadiologyTest): void {
    // Would show confirmation dialog
    this.notificationService.info(`حذف ${test.testName}`);
  }

  onSelectTest(test: RadiologyTest): void {
    this.expandedTestId.set(test.id!);
  }

  onViewTestDetails(test: RadiologyTest): void {
    this.expandedTestId.set(test.id!);
    this.selectedView = 0; // Switch to list view
  }

  onViewTestImages(test: RadiologyTest): void {
    this.notificationService.info(`عرض صور ${test.testName}`);
  }

  onDownloadImages(test: RadiologyTest): void {
    this.notificationService.info(`تحميل صور ${test.testName}`);
  }

  // Permissions
  canEdit(): boolean {
    if (this.readOnly) return false;
    const user = this.currentUser();
    return user?.role === 'DOCTOR' ||
      user?.role === 'ADMIN' ||
      user?.role === 'SYSTEM_ADMIN' ||
      user?.role === 'NURSE';
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
      [TestUrgency.ASAP]: 'بأسرع وقت',
    };
    return labels[urgency!] || '';
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
}
