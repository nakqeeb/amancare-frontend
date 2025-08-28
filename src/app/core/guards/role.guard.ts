// ===================================================================
// src/app/core/guards/role.guard.ts - حارس الأدوار
// ===================================================================
import { Injectable, inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { Observable, map, take } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> | boolean | UrlTree {
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (!user) {
          this.notificationService.warning('يجب تسجيل الدخول أولاً');
          return this.router.createUrlTree(['/auth/login']);
        }

        const requiredRoles = route.data['roles'] as string[];
        if (!requiredRoles || requiredRoles.length === 0) {
          return true;
        }

        const hasRequiredRole = requiredRoles.includes(user.role);
        if (hasRequiredRole) {
          return true;
        }

        // المستخدم لا يملك الصلاحية المطلوبة
        this.notificationService.error('ليس لديك صلاحية للوصول إلى هذه الصفحة');
        return this.router.createUrlTree(['/dashboard']);
      })
    );
  }
}
