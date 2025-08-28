// ===================================================================
// src/app/core/interceptors/error.interceptor.ts - مقاطع الأخطاء
// ===================================================================
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'حدث خطأ غير متوقع';

      if (error.error instanceof ErrorEvent) {
        // خطأ من جانب العميل
        errorMessage = `خطأ: ${error.error.message}`;
      } else {
        // خطأ من جانب الخادم
        switch (error.status) {
          case 400:
            errorMessage = error.error?.message || 'بيانات غير صحيحة';
            break;
          case 401:
            errorMessage = 'غير مصرح لك بالوصول';
            break;
          case 403:
            errorMessage = 'ليس لديك صلاحية لتنفيذ هذا الإجراء';
            break;
          case 404:
            errorMessage = 'البيانات المطلوبة غير موجودة';
            break;
          case 409:
            errorMessage = 'البيانات موجودة مسبقاً';
            break;
          case 422:
            errorMessage = handleValidationErrors(error);
            break;
          case 500:
            errorMessage = 'خطأ في الخادم';
            break;
          case 503:
            errorMessage = 'الخدمة غير متاحة حالياً';
            break;
          default:
            errorMessage = error.error?.message || `خطأ: ${error.status}`;
        }
      }

      // عرض الإشعار إلا إذا كان طلب مصادقة
      if (!req.url.includes('/auth/') || error.status !== 401) {
        notificationService.error(errorMessage);
      }

      return throwError(() => error);
    })
  );
};

/**
 * معالجة أخطاء التحقق من صحة البيانات
 */
function handleValidationErrors(error: HttpErrorResponse): string {
  if (error.error?.errors && Array.isArray(error.error.errors)) {
    return error.error.errors.join('\n');
  }

  if (error.error?.message) {
    return error.error.message;
  }

  return 'البيانات المدخلة غير صحيحة';
}
