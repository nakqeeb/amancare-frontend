// ===================================================================
// src/app/features/schedules/models/schedule.model.ts
// Models matching Spring Boot DTOs for Schedule Management
// ===================================================================

export interface DoctorSchedule {
  id: number;
  doctorId: number;
  doctorName: string;
  doctorSpecialization?: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
  effectiveDate?: string;
  endDate?: string;
  scheduleType: ScheduleType;
  notes?: string;
  isActive: boolean;
  clinicId: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateDoctorScheduleRequest {
  doctorId: number;
  workingDays: DayOfWeek[];
  startTime: string;
  endTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
  effectiveDate?: string;
  endDate?: string;
  scheduleType: ScheduleType;
  notes?: string;
}

export interface UpdateDoctorScheduleRequest {
  workingDays?: DayOfWeek[];
  startTime?: string;
  endTime?: string;
  breakStartTime?: string;
  breakEndTime?: string;
  effectiveDate?: string;
  endDate?: string;
  scheduleType?: ScheduleType;
  notes?: string;
  isActive?: boolean;
}

export interface DoctorUnavailability {
  id: number;
  doctorId: number;
  doctorName: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  reason: string;
  isAllDay: boolean;
  unavailabilityType: UnavailabilityType;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateUnavailabilityRequest {
  doctorId: number;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  reason: string;
  isAllDay: boolean;
  unavailabilityType: UnavailabilityType;
  notes?: string;
}

export interface DoctorScheduleResponse {
  id: number;
  doctorId: number;
  doctorName: string;
  doctorSpecialization?: string;
  dayOfWeek: DayOfWeek;
  dayOfWeekArabic: string;
  startTime: string;
  endTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
  effectiveDate?: string;
  endDate?: string;
  scheduleType: ScheduleType;
  scheduleTypeArabic: string;
  notes?: string;
  isActive: boolean;
  workingHours: number;
  totalSlots: number;
  availableSlots?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface UnavailabilityResponse {
  id: number;
  doctorId: number;
  doctorName: string;
  doctorSpecialization?: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  reason: string;
  isAllDay: boolean;
  unavailabilityType: UnavailabilityType;
  unavailabilityTypeArabic: string;
  notes?: string;
  duration: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface DoctorSummaryResponse {
  id: number;
  fullName: string;
  specialization?: string;
  isAvailable?: boolean;
  nextAvailableSlot?: string;
  totalScheduledHours?: number;
  activeSchedules?: number;
}

export interface AvailabilityCheckResponse {
  doctorId: number;
  date: string;
  time: string;
  isAvailable: boolean;
  conflictReason?: string;
  nextAvailableTime?: string;
}

export interface ScheduleStatistics {
  totalSchedules: number;
  activeDoctors: number;
  inactiveDoctors: number;
  totalWorkingHours: number;
  averageWorkingHoursPerDoctor: number;
  doctorsWithBreaks: number;
  weekendWorkingDoctors: number;
  schedulesThisWeek: number;
  unavailabilityPeriodsActive: number;
  mostBusyDay: DayOfWeek;
  leastBusyDay: DayOfWeek;
}

export interface WeeklyScheduleView {
  doctorId: number;
  doctorName: string;
  specialization?: string;
  weeklySchedules: {
    [key in DayOfWeek]?: {
      schedule: DoctorSchedule;
      unavailabilities: DoctorUnavailability[];
      workingHours: number;
      availableSlots: number;
    };
  };
  totalWeeklyHours: number;
  isFullTime: boolean;
}

// ===================================================================
// ENUMS
// ===================================================================

export enum DayOfWeek {
  SUNDAY = 'SUNDAY',
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY'
}

export enum ScheduleType {
  REGULAR = 'REGULAR',
  TEMPORARY = 'TEMPORARY',
  EMERGENCY = 'EMERGENCY',
  ON_CALL = 'ON_CALL',
  VACATION_COVER = 'VACATION_COVER'
}

export enum UnavailabilityType {
  VACATION = 'VACATION',
  SICK_LEAVE = 'SICK_LEAVE',
  EMERGENCY = 'EMERGENCY',
  PERSONAL = 'PERSONAL',
  CONFERENCE = 'CONFERENCE',
  TRAINING = 'TRAINING',
  OTHER = 'OTHER'
}

// ===================================================================
// UTILITY TYPES & CONSTANTS
// ===================================================================

export interface ScheduleSearchCriteria {
  doctorId?: number;
  dayOfWeek?: DayOfWeek;
  scheduleType?: ScheduleType;
  isActive?: boolean;
  effectiveDateFrom?: string;
  effectiveDateTo?: string;
  startTime?: string;
  endTime?: string;
}

export interface UnavailabilitySearchCriteria {
  doctorId?: number;
  startDate?: string;
  endDate?: string;
  unavailabilityType?: UnavailabilityType;
  isActive?: boolean;
}

export const DAY_OF_WEEK_ARABIC: Record<DayOfWeek, string> = {
  [DayOfWeek.SUNDAY]: 'الأحد',
  [DayOfWeek.MONDAY]: 'الإثنين',
  [DayOfWeek.TUESDAY]: 'الثلاثاء',
  [DayOfWeek.WEDNESDAY]: 'الأربعاء',
  [DayOfWeek.THURSDAY]: 'الخميس',
  [DayOfWeek.FRIDAY]: 'الجمعة',
  [DayOfWeek.SATURDAY]: 'السبت'
};

export const SCHEDULE_TYPE_ARABIC: Record<ScheduleType, string> = {
  [ScheduleType.REGULAR]: 'منتظم',
  [ScheduleType.TEMPORARY]: 'مؤقت',
  [ScheduleType.EMERGENCY]: 'طارئ',
  [ScheduleType.ON_CALL]: 'نوبة استدعاء',
  [ScheduleType.VACATION_COVER]: 'تغطية إجازة'
};

export const UNAVAILABILITY_TYPE_ARABIC: Record<UnavailabilityType, string> = {
  [UnavailabilityType.VACATION]: 'إجازة',
  [UnavailabilityType.SICK_LEAVE]: 'إجازة مرضية',
  [UnavailabilityType.EMERGENCY]: 'طارئ',
  [UnavailabilityType.PERSONAL]: 'شخصي',
  [UnavailabilityType.CONFERENCE]: 'مؤتمر',
  [UnavailabilityType.TRAINING]: 'تدريب',
  [UnavailabilityType.OTHER]: 'أخرى'
};

export const DEFAULT_WORKING_HOURS = {
  START: '08:00',
  END: '17:00',
  BREAK_START: '12:00',
  BREAK_END: '13:00'
};

export const TIME_SLOT_DURATION = 30; // minutes
