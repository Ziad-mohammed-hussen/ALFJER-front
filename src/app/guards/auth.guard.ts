import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }

    const userRole = this.auth.getRole();
    const allowedRoles = route.data['roles'] as Array<string>;

    if (allowedRoles && !allowedRoles.includes(userRole || '')) {
      // Role not authorized, redirect to root or default layout
      this.router.navigate(['/']);
      return false;
    }

    return true;
  }
}
