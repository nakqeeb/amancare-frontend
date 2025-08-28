// ===================================================================
// src/app/features/patients/models/patient.model.ts - نموذج المريض
// ===================================================================
export interface Patient {
  id?: number;
  patientNumber?: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  dateOfBirth?: string;
  age?: number;
  gender: 'MALE' | 'FEMALE';
  phone: string;
  email?: string;
  address?: string;
  bloodType?: BloodType;
  allergies?: string;
  chronicDiseases?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Navigation properties
  appointmentsCount?: number;
  lastVisit?: string;
  totalInvoices?: number;
  outstandingBalance?: number;
}

export type BloodType = 'A_POSITIVE' | 'A_NEGATIVE' | 'B_POSITIVE' | 'B_NEGATIVE' |
                       'AB_POSITIVE' | 'AB_NEGATIVE' | 'O_POSITIVE' | 'O_NEGATIVE';

export type Gender = 'MALE' | 'FEMALE';

export interface PatientSearchCriteria {
  searchTerm?: string;
  gender?: Gender;
  bloodType?: BloodType;
  ageFrom?: number;
  ageTo?: number;
  isActive?: boolean;
}

export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender: Gender;
  phone: string;
  email?: string;
  address?: string;
  bloodType?: BloodType;
  allergies?: string;
  chronicDiseases?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
}

export interface UpdatePatientRequest extends Partial<CreatePatientRequest> {
  isActive?: boolean;
}
