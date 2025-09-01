// ===================================================================
// Profile Model
// src/app/features/profile/models/profile.model.ts
// ===================================================================

import { User, UserRole } from '../../users/models/user.model';

// Extended profile interface for current user
export interface UserProfile extends User {
  // Additional profile-specific fields
  bio?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  address?: Address;
  emergencyContact?: EmergencyContact;

  // Professional information
  yearsOfExperience?: number;
  education?: Education[];
  certifications?: Certification[];
  languages?: string[];

  // System preferences
  preferences?: UserPreferences;

  // Statistics
  statistics?: ProfileStatistics;

  // Security
  twoFactorEnabled?: boolean;
  securityQuestions?: SecurityQuestion[];
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface Education {
  id?: number;
  degree: string;
  institution: string;
  field: string;
  graduationYear: number;
  country?: string;
}

export interface Certification {
  id?: number;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  verificationUrl?: string;
}

export interface UserPreferences {
  // Appearance
  theme: 'light' | 'dark' | 'auto';
  language: 'ar' | 'en';
  fontSize: 'small' | 'medium' | 'large';
  colorScheme?: string;

  // Regional
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  firstDayOfWeek: 0 | 1 | 6; // 0=Sunday, 1=Monday, 6=Saturday
  currency: string;

  // Dashboard
  dashboardLayout: 'compact' | 'expanded' | 'custom';
  defaultLandingPage: string;
  widgetOrder?: string[];
  favoriteModules?: string[];

  // Notifications
  emailNotifications: NotificationSettings;
  smsNotifications: NotificationSettings;
  pushNotifications: NotificationSettings;
  inAppNotifications: NotificationSettings;

  // Privacy
  profileVisibility: 'public' | 'clinic' | 'private';
  showOnlineStatus: boolean;
  allowMessages: boolean;
  shareActivityStatus: boolean;

  // Accessibility
  highContrast: boolean;
  reduceMotion: boolean;
  screenReaderMode: boolean;
  keyboardShortcuts: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  appointments: boolean;
  patients: boolean;
  invoices: boolean;
  reports: boolean;
  systemUpdates: boolean;
  reminders: boolean;
  digest?: 'none' | 'daily' | 'weekly';
}

export interface ProfileStatistics {
  totalLogins: number;
  lastLoginAt: string;
  accountCreatedAt: string;
  profileCompleteness: number;

  // Activity stats
  appointmentsManaged: number;
  patientsHandled: number;
  invoicesProcessed: number;
  reportsGenerated: number;

  // This month
  loginsThisMonth: number;
  actionsThisMonth: number;

  // Storage
  storageUsed: number;
  storageLimit: number;
}

export interface SecurityQuestion {
  id: number;
  question: string;
  answer?: string; // Hashed on backend
}

// Activity history
export interface ActivityHistory {
  id: number;
  action: string;
  description: string;
  category: ActivityCategory;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  location?: string;
  success: boolean;
  metadata?: Record<string, any>;
}

export enum ActivityCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  PROFILE = 'PROFILE',
  SECURITY = 'SECURITY',
  PATIENT = 'PATIENT',
  APPOINTMENT = 'APPOINTMENT',
  MEDICAL_RECORD = 'MEDICAL_RECORD',
  INVOICE = 'INVOICE',
  REPORT = 'REPORT',
  SYSTEM = 'SYSTEM'
}

// Session management
export interface UserSession {
  id: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  ipAddress: string;
  location?: string;
  loginTime: string;
  lastActivityTime: string;
  isCurrentSession: boolean;
  isActive: boolean;
}

// Profile update requests
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  address?: Address;
  emergencyContact?: EmergencyContact;
  specialization?: string;
  licenseNumber?: string;
  yearsOfExperience?: number;
  languages?: string[];
}

export interface UpdatePreferencesRequest {
  theme?: 'light' | 'dark' | 'auto';
  language?: 'ar' | 'en';
  timezone?: string;
  dateFormat?: string;
  timeFormat?: '12h' | '24h';
  dashboardLayout?: 'compact' | 'expanded' | 'custom';
  defaultLandingPage?: string;
  emailNotifications?: Partial<NotificationSettings>;
  smsNotifications?: Partial<NotificationSettings>;
  profileVisibility?: 'public' | 'clinic' | 'private';
  showOnlineStatus?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  logoutOtherSessions?: boolean;
}

export interface UpdateProfilePictureRequest {
  imageData: string; // Base64 encoded image
  mimeType: string;
}

// Data export
export interface ProfileDataExport {
  profile: UserProfile;
  activityHistory: ActivityHistory[];
  preferences: UserPreferences;
  exportDate: string;
  format: 'json' | 'pdf' | 'csv';
}
