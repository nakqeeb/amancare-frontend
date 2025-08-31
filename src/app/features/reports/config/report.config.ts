// ===================================================================
// FEATURE MODULE CONFIGURATION

import { ExportFormat, ReportType, ChartType } from "../models/report.model";

// ===================================================================
export const REPORTS_MODULE_CONFIG = {
  // Chart library configuration
  chartDefaults: {
    colorScheme: 'cool',
    animations: true,
    showLegend: true,
    gradient: false
  },

  // Export formats supported
  supportedExportFormats: [
    ExportFormat.PDF,
    ExportFormat.EXCEL,
    ExportFormat.CSV
  ],

  // Default report refresh intervals (in minutes)
  refreshIntervals: {
    dashboard: 5,
    financial: 15,
    operational: 10,
    patient: 30
  },

  // Permission mapping for different report types
  reportPermissions: {
    [ReportType.FINANCIAL]: ['ADMIN', 'SYSTEM_ADMIN', 'RECEPTIONIST'],
    [ReportType.OPERATIONAL]: ['ADMIN', 'SYSTEM_ADMIN', 'DOCTOR', 'NURSE'],
    [ReportType.PATIENT]: ['ADMIN', 'SYSTEM_ADMIN', 'DOCTOR', 'NURSE'],
    [ReportType.CUSTOM]: ['ADMIN', 'SYSTEM_ADMIN']
  }
};

// ===================================================================
// REPORT FIELD DEFINITIONS
// ===================================================================
export const REPORT_FIELD_DEFINITIONS = {
  patient: {
    category: 'بيانات المرضى',
    fields: [
      { key: 'patient_name', label: 'اسم المريض', type: 'text' },
      { key: 'patient_age', label: 'العمر', type: 'number' },
      { key: 'patient_gender', label: 'الجنس', type: 'select' },
      { key: 'patient_phone', label: 'رقم الهاتف', type: 'text' },
      { key: 'patient_city', label: 'المدينة', type: 'text' },
      { key: 'blood_type', label: 'فصيلة الدم', type: 'select' },
      { key: 'registration_date', label: 'تاريخ التسجيل', type: 'date' }
    ]
  },
  appointment: {
    category: 'بيانات المواعيد',
    fields: [
      { key: 'appointment_date', label: 'تاريخ الموعد', type: 'date' },
      { key: 'appointment_time', label: 'وقت الموعد', type: 'text' },
      { key: 'appointment_type', label: 'نوع الموعد', type: 'select' },
      { key: 'appointment_status', label: 'حالة الموعد', type: 'select' },
      { key: 'doctor_name', label: 'اسم الطبيب', type: 'text' },
      { key: 'duration', label: 'المدة', type: 'number' },
      { key: 'wait_time', label: 'وقت الانتظار', type: 'number' }
    ]
  },
  financial: {
    category: 'البيانات المالية',
    fields: [
      { key: 'invoice_number', label: 'رقم الفاتورة', type: 'text' },
      { key: 'invoice_amount', label: 'قيمة الفاتورة', type: 'number' },
      { key: 'paid_amount', label: 'المبلغ المدفوع', type: 'number' },
      { key: 'payment_status', label: 'حالة الدفع', type: 'select' },
      { key: 'payment_method', label: 'طريقة الدفع', type: 'select' },
      { key: 'service_category', label: 'فئة الخدمة', type: 'select' },
      { key: 'discount_amount', label: 'الخصم', type: 'number' },
      { key: 'due_date', label: 'تاريخ الاستحقاق', type: 'date' }
    ]
  },
  medical: {
    category: 'البيانات الطبية',
    fields: [
      { key: 'diagnosis', label: 'التشخيص', type: 'text' },
      { key: 'treatment_plan', label: 'خطة العلاج', type: 'text' },
      { key: 'visit_type', label: 'نوع الزيارة', type: 'select' },
      { key: 'chief_complaint', label: 'الشكوى الرئيسية', type: 'text' },
      { key: 'vital_signs', label: 'العلامات الحيوية', type: 'text' },
      { key: 'medications', label: 'الأدوية', type: 'text' },
      { key: 'lab_tests', label: 'الفحوصات المختبرية', type: 'text' }
    ]
  }
};

// ===================================================================
// CHART CONFIGURATION PRESETS
// ===================================================================
export const CHART_PRESETS = {
  financial: {
    revenue_trend: {
      type: ChartType.LINE,
      colorScheme: 'cool',
      showTrend: true,
      gradient: true
    },
    payment_methods: {
      type: ChartType.PIE,
      colorScheme: 'vivid',
      doughnut: true,
      showPercentages: true
    }
  },
  operational: {
    appointment_trends: {
      type: ChartType.LINE,
      colorScheme: 'ocean',
      showDataPoints: true,
      curve: 'smooth'
    },
    appointment_distribution: {
      type: ChartType.BAR,
      colorScheme: 'natural',
      showValues: true
    }
  },
  patient: {
    demographics: {
      type: ChartType.PIE,
      colorScheme: 'warm',
      showLabels: true
    },
    age_distribution: {
      type: ChartType.BAR,
      colorScheme: 'cool',
      horizontal: false
    }
  }
};
