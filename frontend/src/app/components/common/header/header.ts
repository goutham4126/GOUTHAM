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
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.074 2.019-.215 3m-2.85 2.548A14.2 14.2 0 0112 21.5a14.2 14.2 0 01-2.935-1.912" />
            </svg>
            <span class="font-bold text-xl text-gray-900 tracking-tight">CDIMS</span>
          </div>

          <nav class="hidden md:ml-6 md:flex md:space-x-8">
            <a routerLink="/" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
              Home
            </a>
            <a *ngIf="!authService.isAuthenticated()" routerLink="/login" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
              Information
            </a>
            <a *ngIf="authService.isAuthenticated()" routerLink="/{{authService.getRole()?.toLowerCase()}}/dashboard" class="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
              Dashboard
            </a>
          </nav>

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
