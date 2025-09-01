// ===================================================================
// Profile Guard
// src/app/features/profile/guards/profile.guard.ts
// ===================================================================

import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ProfileService } from '../services/profile.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const ProfileGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const profileService = inject(ProfileService);
  const router = inject(Router);

  // Check if user is authenticated
  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // Load profile if not already loaded
  const currentProfile = profileService.currentProfile();
  if (!currentProfile) {
    return profileService.loadCurrentProfile().pipe(
      map(() => true),
      catchError(() => {
        router.navigate(['/dashboard']);
        return of(false);
      })
    );
  }

  return true;
};
