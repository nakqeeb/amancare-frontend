// ===================================================================
// src/app/core/guards/auth.guard.ts - حارس المصادقة
// ===================================================================
import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, map, take } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  canActivate(): Observable<boolean | UrlTree> | boolean | UrlTree {
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        if (isAuthenticated) {
          return true;
        }

        // إشعار المستخدم وإعادة التوجيه لصفحة تسجيل الدخول
        this.notificationService.warning('يجب تسجيل الدخول أولاً');
        return this.router.createUrlTree(['/auth/login']);
      })
    );
  }
}
