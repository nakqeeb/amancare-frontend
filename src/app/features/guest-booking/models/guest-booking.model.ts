// src/app/features/guest-booking/models/guest-booking.model.ts

import { Gender, BloodType } from '../../patients/models/patient.model';
import { AppointmentType } from '../../appointments/models/appointment.model';

export interface GuestBookingRequest {
  // Patient Information
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender: Gender;
  phone: string;
  email: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodType?: BloodType;
  allergies?: string;
  chronicDiseases?: string;
  notes?: string;

  // Appointment Information
  clinicId: number;
  doctorId: number;
  appointmentDate: string;
  appointmentTime: string;
  durationMinutes?: number;
  appointmentType?: AppointmentType;
  chiefComplaint?: string;
}

export interface GuestBookingResponse {
  appointmentId: number;
  patientNumber: string;
  patientFullName: string;
  doctorName: string;
  specialization?: string;
  clinicName: string;
  appointmentDate: string;
  appointmentTime: string;
  email: string;
  message: string;
}

export interface ClinicDoctorSummary {
  doctorId: number;
  fullName: string;
  specialization?: string;
  profileImage?: string;
  workingDays: WorkingDay[];
}

export interface WorkingDay {
  day: string;
  dayArabic: string;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
}
