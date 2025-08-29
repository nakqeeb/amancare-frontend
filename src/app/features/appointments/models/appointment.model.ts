// ===================================================================
// 2. APPOINTMENT MODEL
// src/app/features/appointments/models/appointment.model.ts
// ===================================================================
export interface Appointment {
  id?: number;
  patientId: number;
  patientName?: string;
  patientPhone?: string;
  doctorId: number;
  doctorName?: string;
  clinicId?: number;
  appointmentDate: string;
  appointmentTime: string;
  duration: number; // بالدقائق
  type: AppointmentType;
  status: AppointmentStatus;
  chiefComplaint?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export enum AppointmentType {
  CONSULTATION = 'CONSULTATION',
  FOLLOW_UP = 'FOLLOW_UP',
  EMERGENCY = 'EMERGENCY',
  ROUTINE_CHECK = 'ROUTINE_CHECK',
  VACCINATION = 'VACCINATION',
  LAB_TEST = 'LAB_TEST'
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  RESCHEDULED = 'RESCHEDULED'
}

export interface CreateAppointmentRequest {
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  type: AppointmentType;
  chiefComplaint?: string;
  notes?: string;
}

export interface UpdateAppointmentRequest extends CreateAppointmentRequest {
  status?: AppointmentStatus;
}

export interface AppointmentSearchCriteria {
  patientId?: number;
  doctorId?: number;
  clinicId?: number;
  status?: AppointmentStatus;
  type?: AppointmentType;
  fromDate?: string;
  toDate?: string;
  searchQuery?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  appointmentId?: number;
  patientName?: string;
}

export interface DoctorSchedule {
  doctorId: number;
  doctorName: string;
  availableDays: string[];
  workingHours: {
    start: string;
    end: string;
  };
  breakTime?: {
    start: string;
    end: string;
  };
  slotDuration: number; // بالدقائق
}
