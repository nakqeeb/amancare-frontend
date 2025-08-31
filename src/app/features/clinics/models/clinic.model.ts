// ===================================================================
// Enhanced Clinic Model
// src/app/features/clinics/models/clinic.model.ts
// ===================================================================

export interface Clinic {
  id: number;
  name: string;
  description?: string;
  address: string;
  phone: string;
  email: string;
  website?: string;

  // Working Hours
  workingHoursStart: string; // "09:00"
  workingHoursEnd: string;   // "17:00"
  workingDays: WorkingDay[]; // ["SUNDAY", "MONDAY", ...]

  // Subscription & Business
  subscriptionPlan: SubscriptionPlan;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  maxUsers?: number;
  maxPatients?: number;

  // Status & Settings
  isActive: boolean;
  timezone?: string;
  language: 'ar' | 'en';
  currency: 'SAR' | 'USD' | 'EUR';

  // Statistics
  totalUsers?: number;
  totalPatients?: number;
  totalAppointments?: number;
  monthlyRevenue?: number;

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  logoUrl?: string;
}

export interface ClinicService {
  id: number;
  clinicId: number;
  serviceName: string;
  description?: string;
  category: ServiceCategory;
  price: number;
  durationMinutes: number;
  isActive: boolean;
  createdAt: string;
}

export interface ClinicStats {
  totalClinics: number;
  activeClinics: number;
  totalUsers: number;
  totalPatients: number;
  totalRevenue: number;
  averageRating?: number;
}

// ===================================================================
// ENUMS
// ===================================================================

export enum SubscriptionPlan {
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE'
}

export enum WorkingDay {
  SUNDAY = 'SUNDAY',
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY'
}

export enum ServiceCategory {
  CONSULTATION = 'CONSULTATION',
  SURGERY = 'SURGERY',
  DIAGNOSTIC = 'DIAGNOSTIC',
  THERAPY = 'THERAPY',
  EMERGENCY = 'EMERGENCY',
  PREVENTIVE = 'PREVENTIVE'
}

export enum ClinicStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_ACTIVATION = 'PENDING_ACTIVATION'
}

// ===================================================================
// REQUEST/RESPONSE INTERFACES
// ===================================================================

export interface CreateClinicRequest {
  name: string;
  description?: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  workingDays: WorkingDay[];
  subscriptionPlan: SubscriptionPlan;
  timezone?: string;
  language: 'ar' | 'en';
  currency: 'SAR' | 'USD' | 'EUR';
}

export interface UpdateClinicRequest {
  name?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  workingDays?: WorkingDay[];
  timezone?: string;
  language?: 'ar' | 'en';
  currency?: 'SAR' | 'USD' | 'EUR';
}

export interface ClinicFilters {
  name?: string;
  status?: ClinicStatus;
  subscriptionPlan?: SubscriptionPlan;
  city?: string;
  createdAfter?: string;
  createdBefore?: string;
}

// ===================================================================
// SUBSCRIPTION PLAN CONFIGURATIONS
// ===================================================================

export const SUBSCRIPTION_FEATURES = {
  [SubscriptionPlan.BASIC]: {
    name: 'الباقة الأساسية',
    price: 299,
    currency: 'SAR',
    period: 'monthly',
    maxUsers: 5,
    maxPatients: 1000,
    features: [
      'إدارة المرضى',
      'المواعيد الأساسية',
      'السجلات الطبية',
      'الفواتير البسيطة',
      'التقارير الأساسية'
    ],
    color: 'primary'
  },
  [SubscriptionPlan.PREMIUM]: {
    name: 'الباقة المتقدمة',
    price: 599,
    currency: 'SAR',
    period: 'monthly',
    maxUsers: 15,
    maxPatients: 5000,
    features: [
      'جميع مميزات الباقة الأساسية',
      'إدارة متعددة المستخدمين',
      'التقارير المتقدمة',
      'تكامل المختبرات',
      'الرسائل التلقائية',
      'النسخ الاحتياطي'
    ],
    color: 'accent'
  },
  [SubscriptionPlan.ENTERPRISE]: {
    name: 'باقة المؤسسات',
    price: 1199,
    currency: 'SAR',
    period: 'monthly',
    maxUsers: -1, // Unlimited
    maxPatients: -1, // Unlimited
    features: [
      'جميع مميزات الباقة المتقدمة',
      'مستخدمين غير محدودين',
      'مرضى غير محدودين',
      'تكامل API مخصص',
      'دعم فني مخصص',
      'تدريب الفريق',
      'تخصيص كامل للنظام'
    ],
    color: 'warn'
  }
};

// ===================================================================
// WORKING DAYS CONFIGURATION
// ===================================================================

export const WORKING_DAYS_CONFIG = {
  [WorkingDay.SUNDAY]: { name: 'الأحد', shortName: 'أحد' },
  [WorkingDay.MONDAY]: { name: 'الإثنين', shortName: 'إثنين' },
  [WorkingDay.TUESDAY]: { name: 'الثلاثاء', shortName: 'ثلاثاء' },
  [WorkingDay.WEDNESDAY]: { name: 'الأربعاء', shortName: 'أربعاء' },
  [WorkingDay.THURSDAY]: { name: 'الخميس', shortName: 'خميس' },
  [WorkingDay.FRIDAY]: { name: 'الجمعة', shortName: 'جمعة' },
  [WorkingDay.SATURDAY]: { name: 'السبت', shortName: 'سبت' }
};

// ===================================================================
// SERVICE CATEGORIES CONFIGURATION
// ===================================================================

export const SERVICE_CATEGORIES_CONFIG = {
  [ServiceCategory.CONSULTATION]: {
    name: 'استشارات',
    icon: 'medical_services',
    color: 'primary'
  },
  [ServiceCategory.SURGERY]: {
    name: 'العمليات الجراحية',
    icon: 'healing',
    color: 'warn'
  },
  [ServiceCategory.DIAGNOSTIC]: {
    name: 'التشخيص',
    icon: 'biotech',
    color: 'accent'
  },
  [ServiceCategory.THERAPY]: {
    name: 'العلاج',
    icon: 'therapy',
    color: 'primary'
  },
  [ServiceCategory.EMERGENCY]: {
    name: 'الطوارئ',
    icon: 'emergency',
    color: 'warn'
  },
  [ServiceCategory.PREVENTIVE]: {
    name: 'الوقاية',
    icon: 'shield',
    color: 'accent'
  }
};
