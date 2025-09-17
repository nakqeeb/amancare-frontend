// ===================================================================
// Activity Model - Types and Interfaces
// src/app/shared/models/activity.model.ts
// ===================================================================

export enum ActivityType {
  // Patient Activities
  PATIENT_CREATED = 'PATIENT_CREATED',
  PATIENT_UPDATED = 'PATIENT_UPDATED',
  PATIENT_DELETED = 'PATIENT_DELETED',
  PATIENT_ACTIVATED = 'PATIENT_ACTIVATED',
  PATIENT_DEACTIVATED = 'PATIENT_DEACTIVATED',

  // Appointment Activities
  APPOINTMENT_SCHEDULED = 'APPOINTMENT_SCHEDULED',
  APPOINTMENT_CONFIRMED = 'APPOINTMENT_CONFIRMED',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  APPOINTMENT_COMPLETED = 'APPOINTMENT_COMPLETED',
  APPOINTMENT_RESCHEDULED = 'APPOINTMENT_RESCHEDULED',
  APPOINTMENT_IN_PROGRESS = 'APPOINTMENT_IN_PROGRESS',
  APPOINTMENT_NO_SHOW = 'APPOINTMENT_NO_SHOW',

  // Invoice Activities
  INVOICE_CREATED = 'INVOICE_CREATED',
  INVOICE_PAID = 'INVOICE_PAID',
  INVOICE_PARTIALLY_PAID = 'INVOICE_PARTIALLY_PAID',
  INVOICE_CANCELLED = 'INVOICE_CANCELLED',
  INVOICE_OVERDUE = 'INVOICE_OVERDUE',

  // Medical Record Activities
  MEDICAL_RECORD_CREATED = 'MEDICAL_RECORD_CREATED',
  MEDICAL_RECORD_UPDATED = 'MEDICAL_RECORD_UPDATED',
  PRESCRIPTION_ISSUED = 'PRESCRIPTION_ISSUED',
  LAB_RESULTS_ADDED = 'LAB_RESULTS_ADDED',

  // User Activities
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DEACTIVATED = 'USER_DEACTIVATED',

  // System Activities
  REPORT_GENERATED = 'REPORT_GENERATED',
  BACKUP_COMPLETED = 'BACKUP_COMPLETED',
  SETTINGS_UPDATED = 'SETTINGS_UPDATED'
}

export enum ActivityPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: Date;
  userId: number;
  userName?: string;
  userRole?: string;
  entityId?: number;
  entityType?: string;
  entityName?: string;
  metadata?: Record<string, any>;
  priority: ActivityPriority;
  icon?: string;
  iconColor?: string;
  actionUrl?: string;
  clinicId?: number;
}

export interface ActivityFilter {
  types?: ActivityType[];
  userId?: number;
  entityType?: string;
  dateFrom?: Date;
  dateTo?: Date;
  priority?: ActivityPriority;
  limit?: number;
}

export interface ActivityGroup {
  date: Date;
  activities: Activity[];
}

// Activity Configuration
export const ACTIVITY_CONFIG: Record<ActivityType, {
  icon: string;
  color: string;
  priority: ActivityPriority;
  titleTemplate: string;
}> = {
  // Patient Activities
  [ActivityType.PATIENT_CREATED]: {
    icon: 'person_add',
    color: 'success',
    priority: ActivityPriority.HIGH,
    titleTemplate: 'تم إضافة مريض جديد'
  },
  [ActivityType.PATIENT_UPDATED]: {
    icon: 'edit',
    color: 'info',
    priority: ActivityPriority.LOW,
    titleTemplate: 'تم تحديث بيانات مريض'
  },
  [ActivityType.PATIENT_DELETED]: {
    icon: 'person_remove',
    color: 'error',
    priority: ActivityPriority.HIGH,
    titleTemplate: 'تم حذف مريض'
  },
  [ActivityType.PATIENT_ACTIVATED]: {
    icon: 'check_circle',
    color: 'success',
    priority: ActivityPriority.MEDIUM,
    titleTemplate: 'تم تفعيل مريض'
  },
  [ActivityType.PATIENT_DEACTIVATED]: {
    icon: 'cancel',
    color: 'warn',
    priority: ActivityPriority.MEDIUM,
    titleTemplate: 'تم إلغاء تفعيل مريض'
  },

  // Appointment Activities
  [ActivityType.APPOINTMENT_SCHEDULED]: {
    icon: 'event',
    color: 'primary',
    priority: ActivityPriority.HIGH,
    titleTemplate: 'تم حجز موعد جديد'
  },
  [ActivityType.APPOINTMENT_CONFIRMED]: {
    icon: 'event_available',
    color: 'success',
    priority: ActivityPriority.MEDIUM,
    titleTemplate: 'تم تأكيد موعد'
  },
  [ActivityType.APPOINTMENT_CANCELLED]: {
    icon: 'event_busy',
    color: 'error',
    priority: ActivityPriority.HIGH,
    titleTemplate: 'تم إلغاء موعد'
  },
  [ActivityType.APPOINTMENT_COMPLETED]: {
    icon: 'event_note',
    color: 'success',
    priority: ActivityPriority.MEDIUM,
    titleTemplate: 'اكتمل موعد'
  },
  [ActivityType.APPOINTMENT_RESCHEDULED]: {
    icon: 'event_repeat',
    color: 'warn',
    priority: ActivityPriority.MEDIUM,
    titleTemplate: 'تم إعادة جدولة موعد'
  },
  [ActivityType.APPOINTMENT_IN_PROGRESS]: {
    icon: 'event_repeat',
    color: 'primary',
    priority: ActivityPriority.MEDIUM,
    titleTemplate: 'الموعد قيد التنفيذ'
  },
  [ActivityType.APPOINTMENT_NO_SHOW]: {
    icon: 'event_busy',
    color: 'error',
    priority: ActivityPriority.HIGH,
    titleTemplate: 'لم يحضر المريض للموعد'
  },

  // Invoice Activities
  [ActivityType.INVOICE_CREATED]: {
    icon: 'receipt',
    color: 'primary',
    priority: ActivityPriority.MEDIUM,
    titleTemplate: 'تم إصدار فاتورة جديدة'
  },
  [ActivityType.INVOICE_PAID]: {
    icon: 'payment',
    color: 'success',
    priority: ActivityPriority.HIGH,
    titleTemplate: 'تم دفع فاتورة'
  },
  [ActivityType.INVOICE_PARTIALLY_PAID]: {
    icon: 'payments',
    color: 'warn',
    priority: ActivityPriority.MEDIUM,
    titleTemplate: 'دفع جزئي لفاتورة'
  },
  [ActivityType.INVOICE_CANCELLED]: {
    icon: 'receipt_long',
    color: 'error',
    priority: ActivityPriority.MEDIUM,
    titleTemplate: 'تم إلغاء فاتورة'
  },
  [ActivityType.INVOICE_OVERDUE]: {
    icon: 'warning',
    color: 'error',
    priority: ActivityPriority.CRITICAL,
    titleTemplate: 'فاتورة متأخرة'
  },

  // Medical Record Activities
  [ActivityType.MEDICAL_RECORD_CREATED]: {
    icon: 'medical_services',
    color: 'primary',
    priority: ActivityPriority.HIGH,
    titleTemplate: 'تم إضافة سجل طبي'
  },
  [ActivityType.MEDICAL_RECORD_UPDATED]: {
    icon: 'edit_note',
    color: 'info',
    priority: ActivityPriority.LOW,
    titleTemplate: 'تم تحديث سجل طبي'
  },
  [ActivityType.PRESCRIPTION_ISSUED]: {
    icon: 'medication',
    color: 'accent',
    priority: ActivityPriority.MEDIUM,
    titleTemplate: 'تم إصدار وصفة طبية'
  },
  [ActivityType.LAB_RESULTS_ADDED]: {
    icon: 'biotech',
    color: 'info',
    priority: ActivityPriority.MEDIUM,
    titleTemplate: 'تم إضافة نتائج مختبر'
  },

  // User Activities
  [ActivityType.USER_LOGIN]: {
    icon: 'login',
    color: 'default',
    priority: ActivityPriority.LOW,
    titleTemplate: 'تسجيل دخول'
  },
  [ActivityType.USER_LOGOUT]: {
    icon: 'logout',
    color: 'default',
    priority: ActivityPriority.LOW,
    titleTemplate: 'تسجيل خروج'
  },
  [ActivityType.USER_CREATED]: {
    icon: 'person_add',
    color: 'primary',
    priority: ActivityPriority.MEDIUM,
    titleTemplate: 'تم إضافة مستخدم جديد'
  },
  [ActivityType.USER_UPDATED]: {
    icon: 'manage_accounts',
    color: 'info',
    priority: ActivityPriority.LOW,
    titleTemplate: 'تم تحديث بيانات مستخدم'
  },
  [ActivityType.USER_DEACTIVATED]: {
    icon: 'person_off',
    color: 'warn',
    priority: ActivityPriority.MEDIUM,
    titleTemplate: 'تم إلغاء تفعيل مستخدم'
  },

  // System Activities
  [ActivityType.REPORT_GENERATED]: {
    icon: 'assessment',
    color: 'primary',
    priority: ActivityPriority.LOW,
    titleTemplate: 'تم إنشاء تقرير'
  },
  [ActivityType.BACKUP_COMPLETED]: {
    icon: 'backup',
    color: 'success',
    priority: ActivityPriority.LOW,
    titleTemplate: 'اكتمل النسخ الاحتياطي'
  },
  [ActivityType.SETTINGS_UPDATED]: {
    icon: 'settings',
    color: 'default',
    priority: ActivityPriority.LOW,
    titleTemplate: 'تم تحديث الإعدادات'
  }
};
