// // ===================================================================
// // src/app/features/reports/reports.module.ts
// // ===================================================================
// import { NgModule } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ReactiveFormsModule } from '@angular/forms';

// // Angular Material Modules
// import { MatCardModule } from '@angular/material/card';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatInputModule } from '@angular/material/input';
// import { MatSelectModule } from '@angular/material/select';
// import { MatDatepickerModule } from '@angular/material/datepicker';
// import { MatNativeDateModule } from '@angular/material/core';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// import { MatTabsModule } from '@angular/material/tabs';
// import { MatTableModule } from '@angular/material/table';
// import { MatSortModule } from '@angular/material/sort';
// import { MatPaginatorModule } from '@angular/material/paginator';
// import { MatChipsModule } from '@angular/material/chips';
// import { MatMenuModule } from '@angular/material/menu';
// import { MatDividerModule } from '@angular/material/divider';
// import { MatTooltipModule } from '@angular/material/tooltip';
// import { MatProgressBarModule } from '@angular/material/progress-bar';
// import { MatCheckboxModule } from '@angular/material/checkbox';
// import { MatSlideToggleModule } from '@angular/material/slide-toggle';
// import { MatStepperModule } from '@angular/material/stepper';
// import { MatExpansionModule } from '@angular/material/expansion';
// import { MatDialogModule } from '@angular/material/dialog';
// import { MatSnackBarModule } from '@angular/material/snack-bar';
// import { MatGridListModule } from '@angular/material/grid-list';
// import { MatBadgeModule } from '@angular/material/badge';
// import { MatListModule } from '@angular/material/list';

// // Third Party Libraries
// import { NgxChartsModule } from '@swimlane/ngx-charts';

// // Shared Components
// import { SharedModule } from '../../shared/shared.module';

// // Reports Components
// import { ReportsOverviewComponent } from './components/reports-overview/reports-overview.component';
// import { FinancialReportsComponent } from './components/financial-reports/financial-reports.component';
// import { AppointmentReportsComponent } from './components/appointment-reports/appointment-reports.component';
// import { PatientReportsComponent } from './components/patient-reports/patient-reports.component';
// import { CustomReportsComponent } from './components/custom-reports/custom-reports.component';
// import { ChartWidgetComponent } from './components/chart-widgets/chart-widget.component';

// // Additional Report Components
// import { DoctorPerformanceComponent } from './components/doctor-performance/doctor-performance.component';
// import { MedicalReportsComponent } from './components/medical-reports/medical-reports.component';
// import { TrendsAnalysisComponent } from './components/trends-analysis/trends-analysis.component';
// import { ReportsHistoryComponent } from './components/reports-history/reports-history.component';
// import { ScheduledReportsComponent } from './components/scheduled-reports/scheduled-reports.component';

// // Services
// import { ReportService } from './services/report.service';

// // Models (for configuration)
// import {
//   ReportType,
//   ExportFormat,
//   ChartType
// } from './models/report.model';

// @NgModule({
//   declarations: [
//     // Note: Since we're using standalone components,
//     // this module serves mainly for providing shared dependencies
//     // and services. Components are imported directly where needed.
//   ],
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,

//     // Angular Material
//     MatCardModule,
//     MatButtonModule,
//     MatIconModule,
//     MatInputModule,
//     MatSelectModule,
//     MatDatepickerModule,
//     MatNativeDateModule,
//     MatProgressSpinnerModule,
//     MatTabsModule,
//     MatTableModule,
//     MatSortModule,
//     MatPaginatorModule,
//     MatChipsModule,
//     MatMenuModule,
//     MatDividerModule,
//     MatTooltipModule,
//     MatProgressBarModule,
//     MatCheckboxModule,
//     MatSlideToggleModule,
//     MatStepperModule,
//     MatExpansionModule,
//     MatDialogModule,
//     MatSnackBarModule,
//     MatGridListModule,
//     MatBadgeModule,
//     MatListModule,

//     // Third Party
//     NgxChartsModule,

//     // Shared
//     SharedModule
//   ],
//   providers: [
//     ReportService
//   ],
//   exports: [
//     // Export standalone components for use in other modules
//     ReportsOverviewComponent,
//     FinancialReportsComponent,
//     AppointmentReportsComponent,
//     PatientReportsComponent,
//     CustomReportsComponent,
//     ChartWidgetComponent,
//     DoctorPerformanceComponent,
//     MedicalReportsComponent,
//     TrendsAnalysisComponent,
//     ReportsHistoryComponent,
//     ScheduledReportsComponent
//   ]
// })
// export class ReportsModule { }

// // ===================================================================
// // FEATURE MODULE CONFIGURATION
// // ===================================================================
// export const REPORTS_MODULE_CONFIG = {
//   // Chart library configuration
//   chartDefaults: {
//     colorScheme: 'cool',
//     animations: true,
//     showLegend: true,
//     gradient: false
//   },

//   // Export formats supported
//   supportedExportFormats: [
//     ExportFormat.PDF,
//     ExportFormat.EXCEL,
//     ExportFormat.CSV
//   ],

//   // Default report refresh intervals (in minutes)
//   refreshIntervals: {
//     dashboard: 5,
//     financial: 15,
//     operational: 10,
//     patient: 30
//   },

//   // Permission mapping for different report types
//   reportPermissions: {
//     [ReportType.FINANCIAL]: ['ADMIN', 'SYSTEM_ADMIN', 'RECEPTIONIST'],
//     [ReportType.OPERATIONAL]: ['ADMIN', 'SYSTEM_ADMIN', 'DOCTOR', 'NURSE'],
//     [ReportType.PATIENT]: ['ADMIN', 'SYSTEM_ADMIN', 'DOCTOR', 'NURSE'],
//     [ReportType.CUSTOM]: ['ADMIN', 'SYSTEM_ADMIN']
//   }
// };

// // ===================================================================
// // REPORT FIELD DEFINITIONS
// // ===================================================================
// export const REPORT_FIELD_DEFINITIONS = {
//   patient: {
//     category: 'بيانات المرضى',
//     fields: [
//       { key: 'patient_name', label: 'اسم المريض', type: 'text' },
//       { key: 'patient_age', label: 'العمر', type: 'number' },
//       { key: 'patient_gender', label: 'الجنس', type: 'select' },
//       { key: 'patient_phone', label: 'رقم الهاتف', type: 'text' },
//       { key: 'patient_city', label: 'المدينة', type: 'text' },
//       { key: 'blood_type', label: 'فصيلة الدم', type: 'select' },
//       { key: 'registration_date', label: 'تاريخ التسجيل', type: 'date' }
//     ]
//   },
//   appointment: {
//     category: 'بيانات المواعيد',
//     fields: [
//       { key: 'appointment_date', label: 'تاريخ الموعد', type: 'date' },
//       { key: 'appointment_time', label: 'وقت الموعد', type: 'text' },
//       { key: 'appointment_type', label: 'نوع الموعد', type: 'select' },
//       { key: 'appointment_status', label: 'حالة الموعد', type: 'select' },
//       { key: 'doctor_name', label: 'اسم الطبيب', type: 'text' },
//       { key: 'duration', label: 'المدة', type: 'number' },
//       { key: 'wait_time', label: 'وقت الانتظار', type: 'number' }
//     ]
//   },
//   financial: {
//     category: 'البيانات المالية',
//     fields: [
//       { key: 'invoice_number', label: 'رقم الفاتورة', type: 'text' },
//       { key: 'invoice_amount', label: 'قيمة الفاتورة', type: 'number' },
//       { key: 'paid_amount', label: 'المبلغ المدفوع', type: 'number' },
//       { key: 'payment_status', label: 'حالة الدفع', type: 'select' },
//       { key: 'payment_method', label: 'طريقة الدفع', type: 'select' },
//       { key: 'service_category', label: 'فئة الخدمة', type: 'select' },
//       { key: 'discount_amount', label: 'الخصم', type: 'number' },
//       { key: 'due_date', label: 'تاريخ الاستحقاق', type: 'date' }
//     ]
//   },
//   medical: {
//     category: 'البيانات الطبية',
//     fields: [
//       { key: 'diagnosis', label: 'التشخيص', type: 'text' },
//       { key: 'treatment_plan', label: 'خطة العلاج', type: 'text' },
//       { key: 'visit_type', label: 'نوع الزيارة', type: 'select' },
//       { key: 'chief_complaint', label: 'الشكوى الرئيسية', type: 'text' },
//       { key: 'vital_signs', label: 'العلامات الحيوية', type: 'text' },
//       { key: 'medications', label: 'الأدوية', type: 'text' },
//       { key: 'lab_tests', label: 'الفحوصات المختبرية', type: 'text' }
//     ]
//   }
// };

// // ===================================================================
// // CHART CONFIGURATION PRESETS
// // ===================================================================
// export const CHART_PRESETS = {
//   financial: {
//     revenue_trend: {
//       type: ChartType.LINE,
//       colorScheme: 'cool',
//       showTrend: true,
//       gradient: true
//     },
//     payment_methods: {
//       type: ChartType.PIE,
//       colorScheme: 'vivid',
//       doughnut: true,
//       showPercentages: true
//     }
//   },
//   operational: {
//     appointment_trends: {
//       type: ChartType.LINE,
//       colorScheme: 'ocean',
//       showDataPoints: true,
//       curve: 'smooth'
//     },
//     appointment_distribution: {
//       type: ChartType.BAR,
//       colorScheme: 'natural',
//       showValues: true
//     }
//   },
//   patient: {
//     demographics: {
//       type: ChartType.PIE,
//       colorScheme: 'warm',
//       showLabels: true
//     },
//     age_distribution: {
//       type: ChartType.BAR,
//       colorScheme: 'cool',
//       horizontal: false
//     }
//   }
// };
