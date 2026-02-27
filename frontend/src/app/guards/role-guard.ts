import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(Auth);
  const router = inject(Router);

  const user = auth.currentUser();
  const allowedRoles = route.data?.['roles'] || [];

  if (!user) {
    return false;
  }

  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    router.navigate(['/']);
    return false;
  }

  return true;
};