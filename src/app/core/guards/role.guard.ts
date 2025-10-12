// ===================================================================
// src/app/core/guards/role.guard.ts - حارس الأدوار
// ===================================================================
import { Injectable, inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree, RouterStateSnapshot } from '@angular/router';
import { Observable, map, take } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { SystemAdminService } from '../services/system-admin.service';

@Injectable({
  providedIn: 'root'
})
/* export class RoleGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> | boolean | UrlTree {
    console.log(this.authService.currentUser());
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        console.log(user);
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
} */


export class RoleGuard implements CanActivate {
  private authService = inject(AuthService);
  private systemAdminService = inject(SystemAdminService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const currentUser = this.authService.currentUser();

    if (!currentUser) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }

    const requiredRoles = route.data['roles'] as string[];
    const requiresClinicContext = route.data['requiresClinicContext'] as boolean;
    const isWriteOperation = route.data['writeOperation'] as boolean;

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const userRole = currentUser.role;

    // SYSTEM_ADMIN special handling
    if (userRole === 'SYSTEM_ADMIN') {
      if (!isWriteOperation) {
        return true;
      }

      if (requiresClinicContext || isWriteOperation) {
        const hasContext = this.systemAdminService.canPerformWriteOperation();

        if (!hasContext) {
          this.router.navigate(['/admin/select-clinic-context'], {
            queryParams: { returnUrl: state.url }
          });
          return false;
        }
      }

      return true;
    }

    // Regular role checking
    if (requiredRoles.includes(userRole)) {
      return true;
    }

    const roleHierarchy = getRoleHierarchy(userRole);
    const hasPermission = requiredRoles.some(role => roleHierarchy.includes(role));

    if (!hasPermission) {
      this.notificationService.error('ليس لديك الصلاحية للوصول إلى هذه الصفحة');
      this.router.navigate(['/dashboard']);
    }

    return hasPermission;
  }
}

/**
 * Get role hierarchy for permission inheritance
 */
function getRoleHierarchy(role: string): string[] {
  const hierarchy: Record<string, string[]> = {
    'SUPER_ADMIN': ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PHARMACIST', 'LAB_TECHNICIAN', 'ACCOUNTANT'],
    'ADMIN': ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PHARMACIST', 'LAB_TECHNICIAN', 'ACCOUNTANT'],
    'DOCTOR': ['DOCTOR', 'NURSE'],
    'NURSE': ['NURSE'],
    'RECEPTIONIST': ['RECEPTIONIST'],
    'PHARMACIST': ['PHARMACIST'],
    'LAB_TECHNICIAN': ['LAB_TECHNICIAN'],
    'ACCOUNTANT': ['ACCOUNTANT'],
    'SYSTEM_ADMIN': ['SYSTEM_ADMIN'] // System admin is special, doesn't inherit
  };

  return hierarchy[role] || [role];
}

/**
 * Check if user has any of the required roles
 */
export function hasAnyRole(user: any, roles: string[]): boolean {
  if (!user || !user.role) return false;

  if (user.role === 'SYSTEM_ADMIN') {
    return true; // SYSTEM_ADMIN can access everything
  }

  const userRoleHierarchy = getRoleHierarchy(user.role);
  return roles.some(role => userRoleHierarchy.includes(role));
}

/**
 * Check if user has all of the required roles
 */
export function hasAllRoles(user: any, roles: string[]): boolean {
  if (!user || !user.role) return false;

  if (user.role === 'SYSTEM_ADMIN') {
    return true;
  }

  const userRoleHierarchy = getRoleHierarchy(user.role);
  return roles.every(role => userRoleHierarchy.includes(role));
}
