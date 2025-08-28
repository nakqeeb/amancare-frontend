// ===================================================================
// src/app/core/guards/clinic.guard.ts - حارس العيادة
// ===================================================================
import { Injectable, inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { Observable, map, take } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

@Injectable({
  providedIn: 'root'
})
export class ClinicGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> | boolean | UrlTree {
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (!user) {
          return this.router.createUrlTree(['/auth/login']);
        }

        // التحقق من وجود معرف العيادة في الرابط
        const clinicIdFromRoute = route.params['clinicId'];
        if (clinicIdFromRoute && user.role !== 'SYSTEM_ADMIN') {
          const routeClinicId = parseInt(clinicIdFromRoute, 10);

          // التحقق من أن المستخدم ينتمي لنفس العيادة
          if (routeClinicId !== user.clinicId) {
            this.notificationService.error('ليس لديك صلاحية للوصول إلى بيانات هذه العيادة');
            return this.router.createUrlTree(['/dashboard']);
          }
        }

        return true;
      })
    );
  }
}
