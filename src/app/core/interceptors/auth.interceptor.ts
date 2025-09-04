// ===================================================================
// src/app/core/interceptors/auth.interceptor.ts - مقاطع المصادقة المُحدث
// ===================================================================
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, BehaviorSubject, EMPTY } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const authService = inject(AuthService);

  // قائمة endpoints التي لا تحتاج إلى authentication token
  const publicAuthEndpoints = [
    '/auth/login',
    '/auth/register',
    '/auth/register-clinic',
    '/auth/refresh',
    '/auth/forgot-password',
    '/auth/validate-reset-token',
    '/auth/reset-password'
  ];

  // التحقق من كون الطلب لا يحتاج authentication
  const isPublicAuthEndpoint = publicAuthEndpoints.some(endpoint =>
    req.url.includes(endpoint)
  );

  // إذا كان طلب عام، أرسله بدون token
  if (isPublicAuthEndpoint) {
    return next(req);
  }

  // إضافة الرمز المميز للطلبات الأخرى (بما في ذلك auth endpoints المحمية)
  const token = authService.getToken();
  if (token) {
    req = addTokenToRequest(req, token);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // التعامل مع خطأ 401 (Unauthorized)
      if (error.status === 401 && token && !isPublicAuthEndpoint) {
        return handle401Error(req, next, authService);
      }

      return throwError(() => error);
    })
  );
};

/**
 * إضافة الرمز المميز للطلب
 */
function addTokenToRequest(request: HttpRequest<any>, token: string): HttpRequest<any> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

/**
 * معالجة خطأ 401 وتحديث الرمز المميز
 */
function handle401Error(
  request: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: AuthService
): Observable<HttpEvent<any>> {

  // تجنب محاولة refresh للطلبات العامة
  if (request.url.includes('/auth/refresh')) {
    authService.logout();
    return throwError(() => new Error('Refresh token expired'));
  }

  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((response) => {
        isRefreshing = false;
        refreshTokenSubject.next(response.accessToken);
        return next(addTokenToRequest(request, response.accessToken));
      }),
      catchError((error) => {
        isRefreshing = false;
        authService.logout();
        return throwError(() => error);
      })
    );
  } else {
    // انتظار انتهاء عملية تحديث الرمز المميز
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => {
        return next(addTokenToRequest(request, token!));
      })
    );
  }
}
