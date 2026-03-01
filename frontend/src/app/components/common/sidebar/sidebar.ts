import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="h-full flex flex-col pt-5 pb-4 overflow-y-auto">
      <div class="px-6 mb-6">
        <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Navigation</h3>
      </div>
      
      <nav class="mt-2 flex-1 px-4 space-y-2 relative" *ngIf="authService.isAuthenticated()">
        
        <!-- Customer Links -->
        <ng-container *ngIf="authService.getRole() === 'Customer'">
          <a routerLink="/customer/policies" routerLinkActive="bg-blue-50 text-blue-700" class="text-gray-700 hover:bg-gray-50 group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg">
            <svg class="text-gray-400 group-hover:text-blue-500 mr-3 flex-shrink-0 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            My Policies
          </a>
          <a routerLink="/customer/plans" routerLinkActive="bg-blue-50 text-blue-700" class="text-gray-700 hover:bg-gray-50 group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg mt-2">
            <svg class="text-gray-400 group-hover:text-blue-500 mr-3 flex-shrink-0 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Browse Plans
          </a>
          <a routerLink="/customer/claims" routerLinkActive="bg-blue-50 text-blue-700" class="text-gray-700 hover:bg-gray-50 group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg mt-2">
            <svg class="text-gray-400 group-hover:text-blue-500 mr-3 flex-shrink-0 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 9v2m0 4h.01" />
            </svg>
            File a Claim
          </a>
          <a routerLink="/customer/invoices" routerLinkActive="bg-blue-50 text-blue-700" class="text-gray-700 hover:bg-gray-50 group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg mt-2">
            <svg class="text-gray-400 group-hover:text-blue-500 mr-3 flex-shrink-0 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            My Invoices
          </a>
        </ng-container>

        <!-- Admin Links -->
        <ng-container *ngIf="authService.getRole() === 'Admin'">
          <a routerLink="/admin/users" routerLinkActive="bg-indigo-50 text-indigo-700" class="text-gray-700 hover:bg-gray-50 group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg">
            Manage Users
          </a>
          <a routerLink="/admin/plans" routerLinkActive="bg-indigo-50 text-indigo-700" class="text-gray-700 hover:bg-gray-50 group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg mt-2">
            Manage Plans
          </a>
          <a routerLink="/admin/policies" routerLinkActive="bg-indigo-50 text-indigo-700" class="text-gray-700 hover:bg-gray-50 group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg mt-2">
            System Policies
          </a>
          <a routerLink="/admin/claims" routerLinkActive="bg-indigo-50 text-indigo-700" class="text-gray-700 hover:bg-gray-50 group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg mt-2">
            System Claims
          </a>
        </ng-container>

        <!-- Agent Links -->
        <ng-container *ngIf="authService.getRole() === 'Agent'">
          <a routerLink="/agent/policies" routerLinkActive="bg-teal-50 text-teal-700" class="text-gray-700 hover:bg-gray-50 group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg">
            Assigned Policies
          </a>
          <a routerLink="/agent/customers" routerLinkActive="bg-teal-50 text-teal-700" class="text-gray-700 hover:bg-gray-50 group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg mt-2">
            My Customers
          </a>
        </ng-container>

        <!-- Claim Officer Links -->
        <ng-container *ngIf="authService.getRole() === 'ClaimOfficer'">
          <a routerLink="/claim-officer/dashboard" routerLinkActive="bg-orange-50 text-orange-700" class="text-gray-700 hover:bg-gray-50 group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg">
            Dashboard
          </a>
        </ng-container>

      </nav>
      
      <div *ngIf="!authService.isAuthenticated()" class="px-6 py-4 text-sm text-gray-500 text-center mt-10 border-t border-gray-100">
        Please log in to access the portal features.
      </div>
    </aside>
  `
})
export class Sidebar {
  public authService = inject(AuthService);
}
