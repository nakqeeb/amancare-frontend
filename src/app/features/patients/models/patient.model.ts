// ===================================================================
// src/app/features/patients/models/patient.model.ts - Updated
// Complete Patient Models Matching Spring Boot DTOs
// ===================================================================

import { PageResponse } from "../../../core/models/api-response.model";

// ===================================================================
// MAIN PATIENT INTERFACE - Matches Spring Boot PatientResponse
// ===================================================================
export interface Patient {
  id: number;
  patientNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
  age?: number;
  gender: Gender;
  phone: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodType?: BloodType;
  allergies?: string;
  chronicDiseases?: string;
  notes?: string;
  isActive: boolean;
  clinicId: number;

  // Computed/Navigation properties
  appointmentsCount?: number;
  lastVisit?: string;
  totalInvoices?: number;
  outstandingBalance?: number;

  // Audit fields
  createdAt: string;
  updatedAt?: string;
}

// ===================================================================
// REQUEST DTOs - Matching Spring Boot Request DTOs
// ===================================================================

/**
 * CreatePatientRequest - Matches Spring Boot CreatePatientRequest
 */
export interface CreatePatientRequest {
  clinicId?: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodType?: BloodType;
  allergies?: string;
  chronicDiseases?: string;
  notes?: string;
}

/**
 * UpdatePatientRequest - Matches Spring Boot UpdatePatientRequest
 */
export interface UpdatePatientRequest {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: Gender;
  phone?: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodType?: BloodType;
  allergies?: string;
  chronicDiseases?: string;
  notes?: string;
}

// ===================================================================
// SEARCH & FILTERING
// ===================================================================

/**
 * PatientSearchCriteria - For search functionality
 */
// export interface PatientSearchCriteria {
//   searchTerm?: string;
//   gender?: Gender;
//   bloodType?: BloodType;
//   ageFrom?: number;
//   ageTo?: number;
//   isActive?: boolean;
//   city?: string;
//   lastVisitFrom?: string;
//   lastVisitTo?: string;
// }
/**
 * PatientSearchCriteria - Enhanced search functionality
 * Now includes gender, bloodType, and isActive filters
 */
export interface PatientSearchCriteria {
  searchTerm?: string;      // Text search (name, phone, patient number)
  gender?: Gender;           // Filter by gender
  bloodType?: BloodType;     // Filter by blood type
  isActive?: boolean;        // Filter by active status

  // Future expansion (not yet implemented in backend)
  ageFrom?: number;
  ageTo?: number;
  city?: string;
  lastVisitFrom?: string;
  lastVisitTo?: string;
}

// ===================================================================
// STATISTICS & SUMMARY INTERFACES
// ===================================================================

/**
 * PatientStatistics - Matches Spring Boot PatientStatistics
 */
export interface PatientStatistics {
  totalPatients: number;
  activePatients: number;
  inactivePatients: number;
  newPatientsThisMonth: number;
  malePatients: number;
  femalePatients: number;
  averageAge?: number;
  patientsWithAppointmentsToday?: number;
  patientsWithPendingInvoices?: number;
  totalOutstandingBalance?: number;
}

/**
 * PatientSummaryResponse - Matches Spring Boot PatientSummaryResponse
 */
export interface PatientSummaryResponse {
  id: number;
  patientNumber: string;
  fullName: string;
  age?: number;
  gender?: Gender;              // Added for enhanced search results
  phone: string;
  bloodType?: BloodType;        // Added for enhanced search results
  lastVisit?: string;
  isActive?: boolean;           // Added for enhanced search results
  appointmentTime?: string;
  appointmentType?: string;
  doctorName?: string;
  status?: string;
}

/**
 * PatientPageResponse - Extends PageResponse for patients
 */
// export interface PatientPageResponse {
//   patients: Patient[];
//   totalElements: number;
//   totalPages: number;
//   size: number;
//   number: number;
//   first: boolean;
//   last: boolean;
//   empty: boolean;
// }
export interface PatientPageResponse extends PageResponse<Patient> {
  // Additional fields specific to patient pagination if needed
  patients: Patient[]
}

// Permanent Delete Response Interface
export interface PermanentDeleteResponse {
  patientId: number;
  patientNumber: string;
  patientName: string;
  deletedAt: string;
  deletedByUserId: number;
  recordsDeleted: {
    appointments: number;
    medicalRecords: number;
    invoices: number;
  };
  confirmationMessage: string;
}

// Deletion Preview Interface
export interface DeletionPreview {
  canDelete: boolean;
  blockers?: string[];
  dataToDelete?: {
    appointments: number;
    medicalRecords: number;
    invoices: number;
    documents: number;
  };
}

// ===================================================================
// ENUMS & TYPES - Matching Spring Boot Enums
// ===================================================================

/**
 * Gender enum - Matches Spring Boot Gender enum
 * Backend accepts: MALE, FEMALE, M, F, ذكر, أنثى
 */
export type Gender = 'MALE' | 'FEMALE';


// export type BloodType =
//   'A_POSITIVE' | 'A_NEGATIVE' |
//   'B_POSITIVE' | 'B_NEGATIVE' |
//   'AB_POSITIVE' | 'AB_NEGATIVE' |
//   'O_POSITIVE' | 'O_NEGATIVE';
export type BloodType =
  // Symbol format (preferred for UI)
  | 'O+' | 'O-'
  | 'A+' | 'A-'
  | 'B+' | 'B-'
  | 'AB+' | 'AB-'
  // Enum format (for backward compatibility)
  | 'O_POSITIVE' | 'O_NEGATIVE'
  | 'A_POSITIVE' | 'A_NEGATIVE'
  | 'B_POSITIVE' | 'B_NEGATIVE'
  | 'AB_POSITIVE' | 'AB_NEGATIVE';

  /**
 * Blood type options for dropdowns
 */
// export const BLOOD_TYPE_OPTIONS: { value: BloodType; label: string; symbol: string }[] = [
//   { value: 'O+', label: 'O موجب', symbol: 'O+' },
//   { value: 'O-', label: 'O سالب', symbol: 'O-' },
//   { value: 'A+', label: 'A موجب', symbol: 'A+' },
//   { value: 'A-', label: 'A سالب', symbol: 'A-' },
//   { value: 'B+', label: 'B موجب', symbol: 'B+' },
//   { value: 'B-', label: 'B سالب', symbol: 'B-' },
//   { value: 'AB+', label: 'AB موجب', symbol: 'AB+' },
//   { value: 'AB-', label: 'AB سالب', symbol: 'AB-' }
// ];

// ===================================================================
// UTILITY INTERFACES
// ===================================================================

/**
 * PatientFilters - For advanced filtering
 */
export interface PatientFilters {
  isActive?: boolean;
  gender?: Gender;
  bloodType?: BloodType;
  ageRange?: {
    min: number;
    max: number;
  };
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  city?: string;
  hasAppointments?: boolean;
  hasPendingInvoices?: boolean;
}

/**
 * PatientValidation - For form validation
 */
export interface PatientValidationErrors {
  firstName?: string[];
  lastName?: string[];
  dateOfBirth?: string[];
  gender?: string[];
  phone?: string[];
  email?: string[];
  bloodType?: string[];
}

/**
 * PatientFormData - For form handling
 */
export interface PatientFormData {
  basicInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: Gender;
    bloodType?: BloodType;
  };
  contactInfo: {
    phone: string;
    email?: string;
    address?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
  };
  medicalInfo: {
    allergies?: string;
    chronicDiseases?: string;
    notes?: string;
  };
}

// ===================================================================
// DROPDOWN OPTIONS - For UI Components
// ===================================================================

/**
 * Blood type options for dropdowns
 */
export const BLOOD_TYPE_OPTIONS: { value: BloodType; label: string; arabic: string }[] = [
  { value: 'A_POSITIVE', label: 'A+', arabic: 'A موجب' },
  { value: 'A_NEGATIVE', label: 'A-', arabic: 'A سالب' },
  { value: 'B_POSITIVE', label: 'B+', arabic: 'B موجب' },
  { value: 'B_NEGATIVE', label: 'B-', arabic: 'B سالب' },
  { value: 'AB_POSITIVE', label: 'AB+', arabic: 'AB موجب' },
  { value: 'AB_NEGATIVE', label: 'AB-', arabic: 'AB سالب' },
  { value: 'O_POSITIVE', label: 'O+', arabic: 'O موجب' },
  { value: 'O_NEGATIVE', label: 'O-', arabic: 'O سالب' }
];

/**
 * Gender options for dropdowns
 */
export const GENDER_OPTIONS: { value: Gender; label: string; arabic: string; icon: string }[] = [
  { value: 'MALE', label: 'Male', arabic: 'ذكر', icon: 'person' },
  { value: 'FEMALE', label: 'Female', arabic: 'أنثى', icon: 'person_outline' }
];

// ===================================================================
// CONSTANTS
// ===================================================================

/**
 * Patient related constants
 */
export const PATIENT_CONSTANTS = {
  MAX_NAME_LENGTH: 100,
  MAX_PHONE_LENGTH: 15,
  MAX_EMAIL_LENGTH: 255,
  MAX_ADDRESS_LENGTH: 500,
  MAX_NOTES_LENGTH: 2000,
  MAX_ALLERGIES_LENGTH: 1000,
  MAX_CHRONIC_DISEASES_LENGTH: 1000,

  // Age constraints
  MIN_AGE: 0,
  MAX_AGE: 150,

  // Phone regex pattern
  PHONE_PATTERN: /^[\+]?[0-9]{9,15}$/,

  // Email regex pattern
  EMAIL_PATTERN: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
};

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Get blood type display label
 */
export function getBloodTypeLabel(bloodType: BloodType, language: 'en' | 'ar' = 'ar'): string {
  const option = BLOOD_TYPE_OPTIONS.find(opt => opt.value === bloodType);
  return option ? (language === 'ar' ? option.arabic : option.label) : bloodType;
}

/**
 * Get gender display label
 */
export function getGenderLabel(gender: Gender, language: 'en' | 'ar' = 'ar'): string {
  const option = GENDER_OPTIONS.find(opt => opt.value === gender);
  return option ? (language === 'ar' ? option.arabic : option.label) : gender;
}

/**
 * Validate phone number
 */
export function isValidPhone(phone: string): boolean {
  return PATIENT_CONSTANTS.PHONE_PATTERN.test(phone);
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
  return PATIENT_CONSTANTS.EMAIL_PATTERN.test(email);
}

/**
 * Format patient full name
 */
export function formatPatientFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

/**
 * Format patient display name with patient number
 */
export function formatPatientDisplayName(patient: Patient): string {
  return `${patient.fullName} (${patient.patientNumber})`;
}
