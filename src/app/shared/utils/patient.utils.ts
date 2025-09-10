// src/app/shared/utils/patient.utils.ts

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string | Date): number {
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
 * Get gender label in Arabic or English
 */
export function getGenderLabel(gender: 'MALE' | 'FEMALE', lang: 'ar' | 'en' = 'ar'): string {
  const labels = {
    ar: {
      MALE: 'ذكر',
      FEMALE: 'أنثى'
    },
    en: {
      MALE: 'Male',
      FEMALE: 'Female'
    }
  };

  return labels[lang][gender] || gender;
}

/**
 * Get blood type label
 */
export function getBloodTypeLabel(bloodType: string, lang: 'ar' | 'en' = 'ar'): string {
  const bloodTypes: Record<string, string> = {
    'A_POSITIVE': 'A+',
    'A_NEGATIVE': 'A-',
    'B_POSITIVE': 'B+',
    'B_NEGATIVE': 'B-',
    'AB_POSITIVE': 'AB+',
    'AB_NEGATIVE': 'AB-',
    'O_POSITIVE': 'O+',
    'O_NEGATIVE': 'O-'
  };

  return bloodTypes[bloodType] || bloodType;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';

  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');

  // Format based on length
  if (cleaned.length === 11) {
    // Iraqi mobile format: 0771 234 5678
    return cleaned.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
  } else if (cleaned.length === 10) {
    // Alternative format: 771 234 5678
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  }

  return phone;
}

/**
 * Get patient initials for avatar
 */
export function getPatientInitials(firstName: string, lastName: string): string {
  const firstInitial = firstName?.charAt(0) || '';
  const lastInitial = lastName?.charAt(0) || '';
  return `${firstInitial}${lastInitial}`.toUpperCase();
}

/**
 * Get patient status configuration
 */
export function getPatientStatus(isActive: boolean): {
  label: string;
  color: string;
  icon: string;
} {
  if (isActive) {
    return {
      label: 'نشط',
      color: 'primary',
      icon: 'check_circle'
    };
  }
  return {
    label: 'غير نشط',
    color: 'warn',
    icon: 'cancel'
  };
}

/**
 * Format date to Arabic format
 */
export function formatDateArabic(date: string | Date): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format date to short format
 */
export function formatDateShort(date: string | Date): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('ar-SA');
}

/**
 * Get time ago in Arabic
 */
export function getTimeAgo(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears > 0) {
    return `منذ ${diffYears} ${diffYears === 1 ? 'سنة' : 'سنوات'}`;
  } else if (diffMonths > 0) {
    return `منذ ${diffMonths} ${diffMonths === 1 ? 'شهر' : 'أشهر'}`;
  } else if (diffDays > 0) {
    return `منذ ${diffDays} ${diffDays === 1 ? 'يوم' : 'أيام'}`;
  } else if (diffHours > 0) {
    return `منذ ${diffHours} ${diffHours === 1 ? 'ساعة' : 'ساعات'}`;
  } else if (diffMins > 0) {
    return `منذ ${diffMins} ${diffMins === 1 ? 'دقيقة' : 'دقائق'}`;
  } else {
    return 'الآن';
  }
}

/**
 * Check if patient has critical info
 */
export function hasCriticalInfo(patient: any): boolean {
  return !!(patient.allergies || patient.chronicDiseases || patient.currentMedications);
}

/**
 * Get patient age group
 */
export function getAgeGroup(age: number): string {
  if (age < 1) return 'رضيع';
  if (age < 12) return 'طفل';
  if (age < 18) return 'مراهق';
  if (age < 60) return 'بالغ';
  return 'مسن';
}

/**
 * Validate Iraqi phone number
 */
export function isValidIraqiPhone(phone: string): boolean {
  // Iraqi mobile numbers start with 07 and have 11 digits
  const iraqiPhoneRegex = /^07[3-9]\d{8}$/;
  const cleaned = phone.replace(/\D/g, '');
  return iraqiPhoneRegex.test(cleaned);
}

/**
 * Validate national ID
 */
/* export function isValidNationalId(nationalId: string): boolean {
  // Basic validation - adjust based on your requirements
  return nationalId && nationalId.length >= 10 && /^\d+$/.test(nationalId);
}
 */
/**
 * Generate patient number
 */
export function generatePatientNumber(clinicPrefix: string = 'PAT'): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${clinicPrefix}-${year}${month}-${random}`;
}
