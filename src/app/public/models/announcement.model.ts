// src/app/public/models/announcement.model.ts

export interface Announcement {
  id: number;
  type: AnnouncementType;
  title: string;
  message: string;
  clinicId?: number;
  clinicName?: string;
  doctorId?: number;
  doctorName?: string;
  specialization?: string;
  priority: AnnouncementPriority;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  imageUrl?: string;
  actionUrl?: string;
  actionText?: string;
}

export enum AnnouncementType {
  DOCTOR_AVAILABLE = 'DOCTOR_AVAILABLE',
  CLINIC_HOURS = 'CLINIC_HOURS',
  SPECIAL_OFFER = 'SPECIAL_OFFER',
  HEALTH_TIP = 'HEALTH_TIP',
  EMERGENCY = 'EMERGENCY',
  GENERAL = 'GENERAL'
}

export enum AnnouncementPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export const ANNOUNCEMENT_TYPE_LABELS: { [key in AnnouncementType]: string } = {
  [AnnouncementType.DOCTOR_AVAILABLE]: 'طبيب متاح',
  [AnnouncementType.CLINIC_HOURS]: 'ساعات العمل',
  [AnnouncementType.SPECIAL_OFFER]: 'عرض خاص',
  [AnnouncementType.HEALTH_TIP]: 'نصيحة صحية',
  [AnnouncementType.EMERGENCY]: 'طوارئ',
  [AnnouncementType.GENERAL]: 'إعلان عام'
};

export const ANNOUNCEMENT_TYPE_ICONS: { [key in AnnouncementType]: string } = {
  [AnnouncementType.DOCTOR_AVAILABLE]: 'person_check',
  [AnnouncementType.CLINIC_HOURS]: 'schedule',
  [AnnouncementType.SPECIAL_OFFER]: 'local_offer',
  [AnnouncementType.HEALTH_TIP]: 'lightbulb',
  [AnnouncementType.EMERGENCY]: 'emergency',
  [AnnouncementType.GENERAL]: 'campaign'
};

export interface DoctorAvailability {
  doctorId: number;
  doctorName: string;
  specialization: string;
  clinicId: number;
  clinicName: string;
  availableNow: boolean;
  availableUntil?: string;
  nextAvailableTime?: string;
  profileImage?: string;
}
