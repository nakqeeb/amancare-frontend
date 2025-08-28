export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1',
  appName: 'نظام أمان كير',
  version: '1.0.0',
  defaultLanguage: 'ar',
  supportedLanguages: ['ar', 'en'],
  tokenKey: 'amancare_token',
  refreshTokenKey: 'amancare_refresh_token',
  userKey: 'amancare_user',
  clinicKey: 'amancare_clinic',

  // إعدادات التطبيق
  app: {
    itemsPerPage: 10,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
    sessionTimeout: 30 * 60 * 1000, // 30 دقيقة
    autoSaveInterval: 5 * 60 * 1000, // 5 دقائق
  },

  // إعدادات UI
  ui: {
    theme: 'default',
    rtl: true,
    showAnimation: true,
    toastrTimeout: 5000,
    loadingTimeout: 30000,
  },

  // إعدادات التقويم
  calendar: {
    firstDayOfWeek: 6, // السبت
    workingHours: {
      start: '08:00',
      end: '22:00'
    },
    defaultAppointmentDuration: 30, // بالدقائق
    timeSlotInterval: 15, // بالدقائق
  }
};
