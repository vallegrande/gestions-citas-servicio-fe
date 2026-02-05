import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot
} from '@angular/router';

import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }

    const roles = (route.data?.['roles'] as string[] | undefined) ?? [];
    if (roles.length > 0) {
      const allowed = roles.some((r) => this.auth.hasRole(r));
      if (!allowed) {
        this.router.navigate(['/dashboard']);
        return false;
      }
    }

    return true;
  }
}
