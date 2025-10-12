// ===================================================================
// src/app/features/admin/models/audit.model.ts
// Audit Models - Matching Spring Boot DTOs
// ===================================================================

import { PageResponse } from '../../../core/models/api-response.model';

// ===================================================================
// AUDIT LOG RESPONSE - Matches Spring Boot AuditLogResponse
// ===================================================================
export interface AuditLogResponse {
  id: number;
  adminUserId: number;
  adminUsername: string;
  adminFullName: string;
  actionType: string;
  targetClinicId?: number;
  targetClinicName?: string;
  targetResourceType?: string;
  targetResourceId?: number;
  reason?: string;
  requestPath?: string;
  requestMethod?: string;
  ipAddress?: string;
  createdAt: string;
}

// ===================================================================
// AUDIT STATISTICS RESPONSE - Matches Spring Boot AuditStatisticsResponse
// ===================================================================
export interface AuditStatisticsResponse {
  totalActions: number;
  uniqueAdmins: number;
  uniqueClinics: number;
  criticalActions: number;
  actionTypeBreakdown: { [key: string]: number };
  resourceTypeBreakdown?: { [key: string]: number };
  clinicBreakdown?: { [key: string]: number };
  dailyActionCount?: { [key: string]: number };
}

// ===================================================================
// AUDIT FILTERS - For search and filtering
// ===================================================================
export interface AuditFilters {
  adminUserId?: number;
  clinicId?: number;
  actionType?: string;
  resourceType?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

// ===================================================================
// AUDIT PAGE RESPONSE - For paginated results
// ===================================================================
export interface AuditPageResponse extends PageResponse<AuditLogResponse> { }

// ===================================================================
// ACTION TYPES - Common audit action types
// ===================================================================
export enum AuditActionType {
  CONTEXT_SWITCH = 'CONTEXT_SWITCH',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  PERMANENT_DELETE = 'PERMANENT_DELETE',
  REACTIVATE = 'REACTIVATE',
  VIEW = 'VIEW',
  EXPORT = 'EXPORT',
  PAYMENT = 'PAYMENT',
  CANCEL = 'CANCEL',
  ACTIVATE = 'ACTIVATE',
  DEACTIVATE = 'DEACTIVATE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  FAILED_LOGIN = 'FAILED_LOGIN',
  SECURITY_BREACH = 'SECURITY_BREACH'
}

// ===================================================================
// RESOURCE TYPES - Common resource types in audit logs
// ===================================================================
export enum AuditResourceType {
  USER = 'USER',
  PATIENT = 'PATIENT',
  APPOINTMENT = 'APPOINTMENT',
  INVOICE = 'INVOICE',
  CLINIC = 'CLINIC',
  MEDICAL_RECORD = 'MEDICAL_RECORD',
  PAYMENT = 'PAYMENT',
  AUDIT_LOGS = 'AUDIT_LOGS'
}

// ===================================================================
// LABELS AND CONSTANTS
// ===================================================================
export const AUDIT_ACTION_TYPE_LABELS: { [key: string]: string } = {
  CONTEXT_SWITCH: 'تبديل السياق',
  CREATE: 'إنشاء',
  UPDATE: 'تحديث',
  DELETE: 'حذف',
  PERMANENT_DELETE: 'حذف نهائي',
  REACTIVATE: 'إعادة تفعيل',
  VIEW: 'عرض',
  EXPORT: 'تصدير',
  PAYMENT: 'دفع',
  CANCEL: 'إلغاء',
  ACTIVATE: 'تفعيل',
  DEACTIVATE: 'إلغاء التفعيل',
  LOGIN: 'تسجيل دخول',
  LOGOUT: 'تسجيل خروج',
  FAILED_LOGIN: 'فشل تسجيل الدخول',
  FAILED_CREATE: 'فشل الإنشاء',
  FAILED_UPDATE: 'فشل التحديث',
  FAILED_DELETE: 'فشل الحذف',
  SECURITY_BREACH: 'خرق أمني'
};

export const AUDIT_RESOURCE_TYPE_LABELS: { [key: string]: string } = {
  USER: 'مستخدم',
  PATIENT: 'مريض',
  APPOINTMENT: 'موعد',
  INVOICE: 'فاتورة',
  CLINIC: 'عيادة',
  MEDICAL_RECORD: 'سجل طبي',
  PAYMENT: 'دفعة',
  AUDIT_LOGS: 'سجلات المراجعة'
};

// ===================================================================
// HTTP METHOD LABELS
// ===================================================================
export const HTTP_METHOD_LABELS: { [key: string]: string } = {
  GET: 'قراءة',
  POST: 'إنشاء',
  PUT: 'تحديث',
  PATCH: 'تعديل',
  DELETE: 'حذف'
};

// ===================================================================
// CRITICAL ACTION TYPES - Actions that need immediate attention
// ===================================================================
export const CRITICAL_ACTION_TYPES = [
  'PERMANENT_DELETE',
  'FAILED_DELETE',
  'SECURITY_BREACH',
  'CONTEXT_SWITCH'
];

// ===================================================================
// AUDIT EXPORT PARAMETERS
// ===================================================================
export interface AuditExportParams {
  startDate: Date;
  endDate: Date;
}
