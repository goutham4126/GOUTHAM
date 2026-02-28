import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const requiredRole = route.data?.['role'];

  const currentUser = authService.currentUser();

  if (currentUser && currentUser.role === requiredRole) {
    return true;
  }

  router.navigate(['/']); // Redirect unauthorized
  return false;
};
