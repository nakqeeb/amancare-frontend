// ===================================================================
// src/app/core/interceptors/error.interceptor.ts - مقاطع الأخطاء
// ===================================================================
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Log error to console in development
      if (!environment.production) {
        console.error('HTTP Error:', error);
      }

      // Handle different error types
      handleHttpError(error, notificationService, authService, router);

      return throwError(() => error);
    })
  );
};

/**
 * معالجة أخطاء HTTP المختلفة
 */
function handleHttpError(
  error: HttpErrorResponse,
  notificationService: NotificationService,
  authService: AuthService,
  router: Router
): void {
  let errorMessage = 'حدث خطأ غير متوقع';
  let showNotification = true;

  switch (error.status) {
    case 0:
      // Network error or server unreachable
      errorMessage = 'فشل في الاتصال بالخادم. تحقق من اتصالك بالإنترنت';
      break;

    case 400:
      // Bad Request
      errorMessage = extractErrorMessage(error) || 'طلب غير صالح';
      break;

    case 401:
      // Unauthorized
      if (!isAuthEndpoint(error.url!)) {
        errorMessage = 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى';
        authService.logout();
        router.navigate(['/auth/login']);
      } else {
        errorMessage = 'بيانات تسجيل الدخول غير صحيحة';
      }
      break;

    case 403:
      // Forbidden
      errorMessage = 'ليس لديك صلاحية للوصول إلى هذا المورد';
      break;

    case 404:
      // Not Found
      errorMessage = 'المورد المطلوب غير موجود';
      break;

    case 409:
      // Conflict
      errorMessage = extractErrorMessage(error) || 'تعارض في البيانات المدخلة';
      break;

    case 422:
      // Unprocessable Entity
      errorMessage = extractErrorMessage(error) || 'البيانات المدخلة غير صالحة';
      break;

    case 429:
      // Too Many Requests
      errorMessage = 'تم تجاوز عدد المحاولات المسموح. حاول مرة أخرى لاحقاً';
      break;

    case 500:
      // Internal Server Error
      errorMessage = 'خطأ في الخادم الداخلي. يرجى المحاولة لاحقاً';
      break;

    case 502:
      // Bad Gateway
      errorMessage = 'خطأ في بوابة الخادم';
      break;

    case 503:
      // Service Unavailable
      errorMessage = 'الخدمة غير متاحة حالياً. يرجى المحاولة لاحقاً';
      break;

    case 504:
      // Gateway Timeout
      errorMessage = 'انتهت مهلة الاتصال بالخادم';
      break;

    default:
      if (error.status >= 500) {
        errorMessage = 'خطأ في الخادم. يرجى المحاولة لاحقاً';
      } else if (error.status >= 400) {
        errorMessage = extractErrorMessage(error) || 'حدث خطأ في الطلب';
      }
      break;
  }

  // تجاهل إشعارات أخطاء معينة
  if (shouldSkipNotification(error)) {
    showNotification = false;
  }

  // إظهار الإشعار
  if (showNotification) {
    notificationService.error(errorMessage);
  }
}

/**
 * استخراج رسالة الخطأ من الاستجابة
 */
function extractErrorMessage(error: HttpErrorResponse): string | null {
  if (error.error) {
    // Spring Boot API Response format
    if (error.error.message) {
      return error.error.message;
    }

    // Validation errors
    if (error.error.errors && Array.isArray(error.error.errors)) {
      return error.error.errors.map((err: any) => err.defaultMessage || err).join(', ');
    }

    // Simple string error
    if (typeof error.error === 'string') {
      return error.error;
    }
  }

  return error.message || null;
}

/**
 * التحقق من كون الرابط خاص بالمصادقة
 */
function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return url.includes('/auth/login') ||
         url.includes('/auth/register') ||
         url.includes('/auth/refresh');
}

/**
 * تحديد ما إذا كان يجب تجاهل إشعار هذا الخطأ
 */
function shouldSkipNotification(error: HttpErrorResponse): boolean {
  // تجاهل أخطاء إشعارات معينة
  const skipNotificationUrls = [
    '/auth/refresh',
    '/validate',
    '/ping'
  ];

  const skipNotificationStatus = [
    401 // سيتم التعامل معه في auth interceptor
  ];

  if (error.url && skipNotificationUrls.some(url => error.url!.includes(url))) {
    return true;
  }

  if (skipNotificationStatus.includes(error.status)) {
    return true;
  }

  return false;
}
