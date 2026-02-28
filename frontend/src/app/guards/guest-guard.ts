import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  const role = authService.getRole();
  switch (role) {
    case 'Admin':
      router.navigate(['/admin/dashboard']);
      break;
    case 'Customer':
      router.navigate(['/customer/dashboard']);
      break;
    case 'Agent':
      router.navigate(['/agent/dashboard']);
      break;
    case 'ClaimOfficer':
      router.navigate(['/claim-officer/dashboard']);
      break;
    default:
      router.navigate(['/']);
  }
  return false;
};
