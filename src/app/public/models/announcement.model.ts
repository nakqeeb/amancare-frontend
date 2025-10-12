// src/app/public/models/announcement.model.ts

// ============================================================================
// ENUMS (Matching Backend)
// ============================================================================

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

// ============================================================================
// DTOs (Matching Backend)
// ============================================================================

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

export interface DoctorAvailability {
  doctorId: number;
  doctorName: string;
  specialization?: string;
  clinicId: number;
  clinicName: string;
  availableNow: boolean;
  availableUntil?: string;
  nextAvailableTime?: string;
  profileImage?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getAnnouncementTypeLabel(type: AnnouncementType): string {
  const labels: Record<AnnouncementType, string> = {
    [AnnouncementType.DOCTOR_AVAILABLE]: 'طبيب متاح',
    [AnnouncementType.CLINIC_HOURS]: 'ساعات العمل',
    [AnnouncementType.SPECIAL_OFFER]: 'عرض خاص',
    [AnnouncementType.HEALTH_TIP]: 'نصيحة صحية',
    [AnnouncementType.EMERGENCY]: 'طوارئ',
    [AnnouncementType.GENERAL]: 'إعلان عام'
  };
  return labels[type];
}

export function getAnnouncementTypeIcon(type: AnnouncementType): string {
  const icons: Record<AnnouncementType, string> = {
    [AnnouncementType.DOCTOR_AVAILABLE]: 'person_check',
    [AnnouncementType.CLINIC_HOURS]: 'schedule',
    [AnnouncementType.SPECIAL_OFFER]: 'local_offer',
    [AnnouncementType.HEALTH_TIP]: 'lightbulb',
    [AnnouncementType.EMERGENCY]: 'emergency',
    [AnnouncementType.GENERAL]: 'campaign'
  };
  return icons[type];
}

export function getAnnouncementTypeColor(type: AnnouncementType): string {
  const colors: Record<AnnouncementType, string> = {
    [AnnouncementType.DOCTOR_AVAILABLE]: '#4caf50',
    [AnnouncementType.CLINIC_HOURS]: '#2196f3',
    [AnnouncementType.SPECIAL_OFFER]: '#ff9800',
    [AnnouncementType.HEALTH_TIP]: '#00bcd4',
    [AnnouncementType.EMERGENCY]: '#f44336',
    [AnnouncementType.GENERAL]: '#667eea'
  };
  return colors[type];
}
