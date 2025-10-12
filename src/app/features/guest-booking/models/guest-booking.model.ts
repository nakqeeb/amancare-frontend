// src/app/features/guest-booking/models/guest-booking.model.ts
import { BloodType } from '../../patients/models/patient.model';
import { AppointmentType } from '../../appointments/models/appointment.model';

/**
 * Guest booking request matching backend GuestBookingRequest DTO
 */
export interface GuestBookingRequest {
  // Patient Information (Required)
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: Gender;

  // Patient Information (Optional)
  dateOfBirth?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodType?: BloodType;
  allergies?: string;
  chronicDiseases?: string;
  notes?: string;

  // Appointment Information (Required)
  clinicId: number;
  doctorId: number;
  appointmentDate: string;  // YYYY-MM-DD
  appointmentTime: string;  // HH:mm:ss

  // Appointment Information (Optional)
  durationMinutes?: number;
  appointmentType?: AppointmentType;
  chiefComplaint?: string;
}

// ===================================================================
// GUEST BOOKING RESPONSE
// ===================================================================

/**
 * Guest booking response matching backend GuestBookingResponse DTO
 */
export interface GuestBookingResponse {
  appointmentId: number;
  patientNumber: string;       // Unique patient identifier for future bookings
  patientFullName: string;
  doctorName: string;
  specialization?: string;
  clinicName: string;
  appointmentDate: string;     // YYYY-MM-DD
  appointmentTime: string;     // HH:mm:ss
  email: string;
  message: string;
}


// ============================================================================
// ENUMS (Matching Backend)
// ============================================================================

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW'
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE'
}


// ============================================================================
// DTOs (Matching Backend)
// ============================================================================

export interface ClinicSummary {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
}

export interface ClinicDoctorSummary {
  doctorId: number;
  fullName: string;
  specialization?: string;
  email?: string;
  phone?: string;
}

export interface DoctorScheduleSummary {
  id: number;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  effectiveDate: string;
  expiryDate?: string;
}

export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY'
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface AvailableTimesResponse {
  date: string;
  timeSlots: TimeSlot[];
}

export interface GuestAppointmentResponse {
  id: number;
  confirmationCode: string;
  clinicId: number;
  clinicName: string;
  doctorId: number;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  status: AppointmentStatus;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  patientDateOfBirth?: string;
  patientGender?: Gender;
  notes?: string;
  createdAt: string;
}

export interface ConfirmAppointmentRequest {
  confirmationCode: string;
  email: string;
}

export interface CancelAppointmentRequest {
  confirmationCode: string;
  email: string;
  cancellationReason?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getDayOfWeekLabel(day: DayOfWeek): string {
  const labels: Record<DayOfWeek, string> = {
    [DayOfWeek.SUNDAY]: 'الأحد',
    [DayOfWeek.MONDAY]: 'الاثنين',
    [DayOfWeek.TUESDAY]: 'الثلاثاء',
    [DayOfWeek.WEDNESDAY]: 'الأربعاء',
    [DayOfWeek.THURSDAY]: 'الخميس',
    [DayOfWeek.FRIDAY]: 'الجمعة',
    [DayOfWeek.SATURDAY]: 'السبت'
  };
  return labels[day];
}

export function getStatusLabel(status: AppointmentStatus): string {
  const labels: Record<AppointmentStatus, string> = {
    [AppointmentStatus.PENDING]: 'قيد الانتظار',
    [AppointmentStatus.CONFIRMED]: 'مؤكد',
    [AppointmentStatus.CANCELLED]: 'ملغي',
    [AppointmentStatus.COMPLETED]: 'مكتمل',
    [AppointmentStatus.NO_SHOW]: 'لم يحضر'
  };
  return labels[status];
}

export function getStatusColor(status: AppointmentStatus): 'primary' | 'accent' | 'warn' | undefined {
  switch (status) {
    case AppointmentStatus.CONFIRMED:
      return 'primary';
    case AppointmentStatus.PENDING:
      return 'accent';
    case AppointmentStatus.CANCELLED:
    case AppointmentStatus.NO_SHOW:
      return 'warn';
    default:
      return undefined;
  }
}

export function getGenderLabel(gender: Gender): string {
  return gender === Gender.MALE ? 'ذكر' : 'أنثى';
}
