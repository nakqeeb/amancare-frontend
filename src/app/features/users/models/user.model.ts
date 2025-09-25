// ===================================================================
// Complete User Model
// src/app/features/users/models/user.model.ts
// ===================================================================

// Main User interface matching your backend User entity
// export interface User {
//   id?: number;
//   username: string;
//   email: string;
//   firstName: string;
//   lastName: string;
//   fullName?: string; // Computed field: firstName + lastName
//   phone?: string;
//   profilePicture?: string;

//   // Role and permissions
//   role: UserRole;
//   isActive: boolean;

//   // Clinic association
//   clinicId?: number;
//   clinicName?: string;

//   // Professional information (for doctors)
//   specialization?: string;
//   licenseNumber?: string;

//   // Timestamps
//   createdAt?: string;
//   updatedAt?: string;
//   lastLoginAt?: string;

//   // Audit fields
//   createdBy?: string;
//   updatedBy?: string;
// }

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  specialization?: string;
  isActive: boolean;
  clinicId: number;
  clinicName: string;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

export interface DoctorsResponse {
  message: string;
  success: boolean;
  timestamp: string;
  data: User[]
}
// User roles enum matching your backend
export enum UserRole {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  NURSE = 'NURSE',
  RECEPTIONIST = 'RECEPTIONIST'
}

// Request DTOs for API calls
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  specialization?: string;
  licenseNumber?: string;
  profilePicture?: string;
  isActive?: boolean; // Default true
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
  specialization?: string;
  licenseNumber?: string;
  profilePicture?: string;
  isActive?: boolean;
  newPassword?: string;
}

// Password management requests
export interface ChangePasswordRequest {
  currentPassword?: string; // Optional for admin changes
  newPassword: string;
}

export interface ResetPasswordRequest {
  userId: number;
}

export interface ResetPasswordResponse {
  temporaryPassword: string;
  expiresAt: string;
  mustChangeOnNextLogin: boolean;
}

// User filtering and searching
export interface UserFilters {
  role?: UserRole;
  isActive?: boolean;
  clinicId?: number;
  search?: string; // Search in name, email, username
  specialization?: string;

  // Pagination
  page?: number;
  size?: number;

  // Sorting
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

// User statistics for dashboard/reports
export interface UserStatsDto {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;

  // Count by roles
  systemAdminsCount: number;
  adminCount: number;
  doctorsCount: number;
  nursesCount: number;
  receptionistsCount: number;

  // Activity stats
  usersLoggedInToday: number;
  usersLoggedInThisWeek: number;
  usersLoggedInThisMonth: number;

  // Recent activity
  newUsersThisMonth: number;
  lastRegistrationDate?: string;
}

// User activity log
export interface UserActivityLog {
  id: number;
  userId: number;
  userName: string;
  action: UserActivityType;
  description: string;
  entityType?: string; // patient, appointment, invoice, etc.
  entityId?: number;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  timestamp: string;
  sessionId?: string;
}

export enum UserActivityType {
  // Authentication
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET = 'PASSWORD_RESET',

  // Profile management
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  PROFILE_PICTURE_CHANGED = 'PROFILE_PICTURE_CHANGED',

  // User management (admin actions)
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_ACTIVATED = 'USER_ACTIVATED',
  USER_DEACTIVATED = 'USER_DEACTIVATED',
  USER_DELETED = 'USER_DELETED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',

  // Patient management
  PATIENT_CREATED = 'PATIENT_CREATED',
  PATIENT_UPDATED = 'PATIENT_UPDATED',
  PATIENT_VIEWED = 'PATIENT_VIEWED',
  PATIENT_DELETED = 'PATIENT_DELETED',

  // Appointment management
  APPOINTMENT_CREATED = 'APPOINTMENT_CREATED',
  APPOINTMENT_UPDATED = 'APPOINTMENT_UPDATED',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  APPOINTMENT_COMPLETED = 'APPOINTMENT_COMPLETED',
  APPOINTMENT_NO_SHOW = 'APPOINTMENT_NO_SHOW',

  // Medical records
  MEDICAL_RECORD_CREATED = 'MEDICAL_RECORD_CREATED',
  MEDICAL_RECORD_UPDATED = 'MEDICAL_RECORD_UPDATED',
  MEDICAL_RECORD_VIEWED = 'MEDICAL_RECORD_VIEWED',
  MEDICAL_RECORD_DELETED = 'MEDICAL_RECORD_DELETED',
  MEDICAL_RECORD_LOCKED = 'MEDICAL_RECORD_LOCKED',

  // Financial management
  INVOICE_CREATED = 'INVOICE_CREATED',
  INVOICE_UPDATED = 'INVOICE_UPDATED',
  INVOICE_SENT = 'INVOICE_SENT',
  INVOICE_PAID = 'INVOICE_PAID',
  PAYMENT_RECORDED = 'PAYMENT_RECORDED',

  // Reports and exports
  REPORT_GENERATED = 'REPORT_GENERATED',
  DATA_EXPORTED = 'DATA_EXPORTED',

  // System administration
  SYSTEM_SETTINGS_CHANGED = 'SYSTEM_SETTINGS_CHANGED',
  BACKUP_CREATED = 'BACKUP_CREATED',
  BACKUP_RESTORED = 'BACKUP_RESTORED'
}

// Bulk operations
export interface BulkUserOperation {
  userIds: number[];
  operation: BulkOperationType;
  parameters?: Record<string, any>;
}

export enum BulkOperationType {
  ACTIVATE = 'ACTIVATE',
  DEACTIVATE = 'DEACTIVATE',
  DELETE = 'DELETE',
  CHANGE_ROLE = 'CHANGE_ROLE',
  RESET_PASSWORDS = 'RESET_PASSWORDS',
  SEND_NOTIFICATION = 'SEND_NOTIFICATION'
}

export interface BulkOperationResult {
  totalRequested: number;
  successful: number;
  failed: number;
  errors: BulkOperationError[];
}

export interface BulkOperationError {
  userId: number;
  userName: string;
  error: string;
}

// User preferences and settings
export interface UserPreferences {
  userId: number;
  language: 'ar' | 'en';
  theme: 'light' | 'dark' | 'auto';
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';

  // Notification preferences
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;

  // Dashboard preferences
  dashboardLayout: 'compact' | 'expanded';
  defaultView: 'dashboard' | 'patients' | 'appointments';

  // Privacy settings
  profileVisibility: 'public' | 'clinic' | 'private';
  showOnlineStatus: boolean;
}

// User session information
export interface UserSession {
  id: string;
  userId: number;
  userName: string;
  ipAddress: string;
  userAgent: string;
  loginTime: string;
  lastActivityTime: string;
  isActive: boolean;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  location?: string;
}

// Permission and role management
export interface UserPermissions {
  userId: number;
  role: UserRole;
  permissions: string[]; // Array of permission IDs
  customPermissions?: Record<string, boolean>; // Custom overrides
  effectivePermissions: string[]; // Final computed permissions
}

export interface RoleDefinition {
  role: UserRole;
  name: string;
  description: string;
  defaultPermissions: string[];
  isSystemRole: boolean;
  hierarchy: number; // Higher number = more privileges
}

// Import/Export interfaces
export interface UserImportRequest {
  users: CreateUserRequest[];
  skipDuplicates: boolean;
  sendWelcomeEmails: boolean;
  defaultPassword?: string;
}

export interface UserImportResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  duplicatesSkipped: number;
  errors: ImportError[];
  createdUsers: User[];
}

export interface ImportError {
  row: number;
  data: any;
  errors: string[];
}

export interface UserExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  includeInactive: boolean;
  roles?: UserRole[];
  fields?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
}

// Validation helpers
export interface UserValidation {
  isUsernameAvailable: (username: string) => Promise<boolean>;
  isEmailAvailable: (email: string) => Promise<boolean>;
  validatePassword: (password: string) => PasswordValidationResult;
  validatePhoneNumber: (phone: string) => boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0-100
  feedback: string[];
  requirements: PasswordRequirement[];
}

export interface PasswordRequirement {
  rule: string;
  description: string;
  met: boolean;
}

// Type guards and utilities
export const isSystemAdmin = (user: User): boolean => {
  return user.role === UserRole.SYSTEM_ADMIN;
};

export const isAdmin = (user: User): boolean => {
  return user.role === UserRole.ADMIN || user.role === UserRole.SYSTEM_ADMIN;
};

export const isDoctor = (user: User): boolean => {
  return user.role === UserRole.DOCTOR;
};

export const isNurse = (user: User): boolean => {
  return user.role === UserRole.NURSE;
};

export const isReceptionist = (user: User): boolean => {
  return user.role === UserRole.RECEPTIONIST;
};

export const canManageUsers = (user: User): boolean => {
  return isAdmin(user);
};

export const canViewMedicalRecords = (user: User): boolean => {
  return isDoctor(user) || isNurse(user) || isAdmin(user);
};

export const canManageMedicalRecords = (user: User): boolean => {
  return isDoctor(user) || isAdmin(user);
};

export const canViewReports = (user: User): boolean => {
  return isDoctor(user) || isAdmin(user);
};

export const canManageFinances = (user: User): boolean => {
  return isReceptionist(user) || isAdmin(user);
};

// Role hierarchy for permission checking
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.SYSTEM_ADMIN]: 100,
  [UserRole.ADMIN]: 80,
  [UserRole.DOCTOR]: 60,
  [UserRole.NURSE]: 40,
  [UserRole.RECEPTIONIST]: 20
};

export const hasHigherRole = (user1: User, user2: User): boolean => {
  return ROLE_HIERARCHY[user1.role] > ROLE_HIERARCHY[user2.role];
};

export const canManageUser = (currentUser: User, targetUser: User): boolean => {
  // System admin can manage anyone except themselves
  if (isSystemAdmin(currentUser)) {
    return currentUser.id !== targetUser.id;
  }

  // Admin can manage non-admin users in their clinic
  if (isAdmin(currentUser)) {
    return !isAdmin(targetUser) &&
           currentUser.clinicId === targetUser.clinicId &&
           currentUser.id !== targetUser.id;
  }

  return false;
};

// Default user preferences
export const DEFAULT_USER_PREFERENCES: Partial<UserPreferences> = {
  language: 'ar',
  theme: 'light',
  timezone: 'Asia/Riyadh',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  dashboardLayout: 'expanded',
  defaultView: 'dashboard',
  profileVisibility: 'clinic',
  showOnlineStatus: true
};
