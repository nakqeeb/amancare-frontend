// =============================================================================
// Activity Models - نماذج الأنشطة
// src/app/features/admin/models/activity.model.ts
// =============================================================================

/**
 * Activity Log Response - matches backend ActivityLogResponse
 */
export interface ActivityLogResponse {
  id: number;
  clinicId: number;
  clinicName: string;
  userId: number;
  username: string;
  userFullName: string;
  userRole: string;
  actionType: ActionType;
  httpMethod: string;
  entityType: string;
  entityId?: number;
  entityName?: string;
  description: string;
  endpoint?: string;
  ipAddress?: string;
  timestamp: string; // LocalDateTime -> ISO string
  success: boolean;
  errorMessage?: string;
  durationMs?: number;
}

/**
 * Activity Statistics Response - matches backend ActivityStatisticsResponse
 */
export interface ActivityStatisticsResponse {
  totalActivities: number;
  uniqueUsers: number;
  actionTypeBreakdown: { [key: string]: number };
  entityTypeBreakdown: { [key: string]: number };
  userActivityBreakdown: { [key: string]: number };
  dailyActivityCount: { [key: string]: number };
  activitiesToday: number;
  activitiesThisWeek: number;
  activitiesThisMonth: number;
}

/**
 * Action Types - matches backend ActionType enum
 */
export enum ActionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  PATCH = 'PATCH',
  DELETE = 'DELETE'
}

/**
 * Activity Search Filters
 */
export interface ActivitySearchFilters {
  userId?: number;
  actionType?: ActionType;
  entityType?: string;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

/**
 * Entity Types (common)
 */
// Edited: Added Authentication and Registration types
export enum EntityType {
  PATIENT = 'Patient',
  APPOINTMENT = 'Appointment',
  MEDICAL_RECORD = 'MedicalRecord',
  INVOICE = 'Invoice',
  PAYMENT = 'Payment',
  USER = 'User',
  CLINIC = 'Clinic',
  AUTHENTICATION = 'Authentication',
  REGISTRATION = 'Registration'
}
// End of edit

/**
 * Action Type Labels (Arabic)
 */
export const ACTION_TYPE_LABELS: { [key in ActionType]: string } = {
  [ActionType.CREATE]: 'إنشاء',
  [ActionType.UPDATE]: 'تحديث',
  [ActionType.PATCH]: 'تعديل',
  [ActionType.DELETE]: 'حذف'
};

/**
 * Entity Type Labels (Arabic)
 */
// Edited: Added Authentication and Registration labels
export const ENTITY_TYPE_LABELS: { [key: string]: string } = {
  'Patient': 'مريض',
  'Appointment': 'موعد',
  'MedicalRecord': 'سجل طبي',
  'Invoice': 'فاتورة',
  'Payment': 'دفعة',
  'User': 'مستخدم',
  'Clinic': 'عيادة',
  'Authentication': 'تسجيل دخول',
  'Registration': 'تسجيل حساب'
};
// End of edit

/**
 * Activity Display Configuration
 */
export interface ActivityDisplayConfig {
  icon: string;
  color: string;
  label: string;
}

/**
 * Activity Type Configuration Map
 */
export const ACTIVITY_TYPE_CONFIG: { [key in ActionType]: ActivityDisplayConfig } = {
  [ActionType.CREATE]: {
    icon: 'add_circle',
    color: 'success',
    label: 'إنشاء'
  },
  [ActionType.UPDATE]: {
    icon: 'edit',
    color: 'primary',
    label: 'تحديث'
  },
  [ActionType.PATCH]: {
    icon: 'edit_note',
    color: 'accent',
    label: 'تعديل'
  },
  [ActionType.DELETE]: {
    icon: 'delete',
    color: 'warn',
    label: 'حذف'
  }
};
