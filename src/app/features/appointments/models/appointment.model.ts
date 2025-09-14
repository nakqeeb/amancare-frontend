// src/app/features/appointments/models/appointment.model.ts
import { Patient } from '../../patients/models/patient.model';
import { User } from '../../../core/models/user.model';

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW'
}

export enum AppointmentType {
  CONSULTATION = 'CONSULTATION',
  FOLLOW_UP = 'FOLLOW_UP',
  EMERGENCY = 'EMERGENCY',
  ROUTINE_CHECK = 'ROUTINE_CHECK'
}

export interface Appointment {
  id: number;
  patient: Patient;
  doctor: User;
  appointmentDate: string;
  appointmentTime: string;
  durationMinutes: number;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  chiefComplaint?: string;
  notes?: string;
  cancellationReason?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: User;
  updatedBy?: User;
}

export interface CreateAppointmentRequest {
  clinicId?: number;
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  appointmentTime: string;
  durationMinutes: number;
  appointmentType: AppointmentType;
  chiefComplaint?: string;
  notes?: string;
}

export interface UpdateAppointmentRequest {
  appointmentDate?: string;
  appointmentTime?: string;
  durationMinutes?: number;
  appointmentType?: AppointmentType;
  chiefComplaint?: string;
  notes?: string;
}

export interface AppointmentResponse {
  id: number;
  patientId: number;
  patientName: string;
  patientNumber: string;
  patientPhone?: string;
  doctorId: number;
  doctorName: string;
  doctorSpecialization?: string;
  appointmentDate: string;
  appointmentTime: string;
  durationMinutes: number;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  chiefComplaint?: string;
  notes?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt?: string;
  createdByName?: string;
  updatedByName?: string;
}

export interface AppointmentSummaryResponse {
  id: number;
  patientName: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  status: AppointmentStatus;
  appointmentType: AppointmentType;
}

export interface AppointmentPageResponse {
  appointments: AppointmentResponse[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  first: boolean;
  last: boolean;
}

export interface AppointmentStatistics {
  date: string;
  totalAppointments: number;
  scheduledCount: number;
  confirmedCount: number;
  completedCount: number;
  cancelledCount: number;
  noShowCount: number;
  inProgressCount: number;
  appointmentsByType: { [key: string]: number };
  appointmentsByDoctor: { doctorName: string; count: number }[];
  averageDuration: number;
  peakHour: string;
}

// Helper functions for status and type labels
export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.SCHEDULED]: 'مجدول',
  [AppointmentStatus.CONFIRMED]: 'مؤكد',
  [AppointmentStatus.IN_PROGRESS]: 'جاري',
  [AppointmentStatus.COMPLETED]: 'مكتمل',
  [AppointmentStatus.CANCELLED]: 'ملغي',
  [AppointmentStatus.NO_SHOW]: 'لم يحضر'
};

export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  [AppointmentType.CONSULTATION]: 'استشارة',
  [AppointmentType.FOLLOW_UP]: 'متابعة',
  [AppointmentType.EMERGENCY]: 'طوارئ',
  [AppointmentType.ROUTINE_CHECK]: 'فحص دوري'
};

export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.SCHEDULED]: 'primary',
  [AppointmentStatus.CONFIRMED]: 'accent',
  [AppointmentStatus.IN_PROGRESS]: 'warn',
  [AppointmentStatus.COMPLETED]: 'success',
  [AppointmentStatus.CANCELLED]: 'danger',
  [AppointmentStatus.NO_SHOW]: 'muted'
};
