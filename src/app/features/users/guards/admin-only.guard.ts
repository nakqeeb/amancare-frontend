// ===================================================================
// Admin Only Guard
// src/app/features/users/guards/admin-only.guard.ts
// ===================================================================
import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AdminOnlyGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): boolean {
    const currentUser = this.authService.currentUser();

    if (currentUser &&
      (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SYSTEM_ADMIN)) {
      return true;
    }

    this.router.navigate(['/dashboard']);
    return false;
  }
}
