import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeAr from '@angular/common/locales/ar-SA';
import { App } from './app/app';
import { appConfig } from './app/app.config';


// تسجيل البيانات المحلية للعربية
registerLocaleData(localeAr);

bootstrapApplication(App, appConfig)
  .catch(err => console.error('خطأ في تشغيل التطبيق:', err));
