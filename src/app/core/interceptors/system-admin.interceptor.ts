// src/app/core/interceptors/system-admin.interceptor.ts
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { SystemAdminService } from '../services/system-admin.service';

/**
 * Interceptor to handle SYSTEM_ADMIN specific headers for write operations
 * Adds X-Acting-Clinic-Id and X-Acting-Reason headers when needed
 */
export const systemAdminInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const authService = inject(AuthService);
  const systemAdminService = inject(SystemAdminService);

  const currentUser = authService.currentUser();

  // Only process for SYSTEM_ADMIN users
  if (!currentUser || currentUser.role !== 'SYSTEM_ADMIN') {
    return next(req);
  }

  // Check if this is a write operation (POST, PUT, PATCH, DELETE)
  const isWriteOperation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);

  // Skip for certain endpoints that don't need clinic context
  const skipEndpoints = [
    '/auth/',
    '/system-config/',
    '/analytics/',
    '/reports/system-wide'
  ];

  const shouldSkip = skipEndpoints.some(endpoint => req.url.includes(endpoint));

  if (!isWriteOperation || shouldSkip) {
    return next(req);
  }

  // Get the acting clinic context
  const actingClinicId = systemAdminService.getActingClinicId();
  const actingReason = systemAdminService.getActingReason();

  // For write operations, SYSTEM_ADMIN must specify which clinic they're acting for
  if (actingClinicId && actingReason) {
    // Clone the request and add headers
    const modifiedReq = req.clone({
      setHeaders: {
        'X-Acting-Clinic-Id': actingClinicId.toString(),
        'X-Acting-Reason': encodeURIComponent(actingReason) // Encode for Arabic text
      }
    });

    return next(modifiedReq);
  }

  // For read operations or when no clinic context is set, proceed normally
  return next(req);
};
