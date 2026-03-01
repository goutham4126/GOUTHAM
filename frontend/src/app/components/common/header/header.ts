import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="bg-white shadow-sm border-b sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <div class="flex-shrink-0 flex items-center cursor-pointer" routerLink="/">
            <img src="/logo.png" alt="CDIMS Logo" class="h-8 w-auto mr-2" />
          </div>

          <div class="flex items-center space-x-4">
            <ng-container *ngIf="!authService.isAuthenticated()">
              <a routerLink="/login" class="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition">Log in</a>
              <a routerLink="/register" class="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition">Sign Up</a>
            </ng-container>
            
            <ng-container *ngIf="authService.isAuthenticated()">
              <div class="flex items-center space-x-3">
                <span class="text-sm text-gray-600 hidden sm:block">Hello, <span class="font-semibold text-gray-900">{{ authService.currentUser()?.fullName }}</span></span>
                <span class="px-2.5 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full border border-gray-200">
                  {{ authService.getRole() }}
                </span>
                <button (click)="logout()" class="ml-4 text-sm font-medium text-red-600 hover:text-red-800 transition">Logout</button>
              </div>
            </ng-container>
          </div>
        </div>
      </div>
    </header>
  `
})
export class Header {
  public authService = inject(AuthService);
  private router = inject(Router);

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
