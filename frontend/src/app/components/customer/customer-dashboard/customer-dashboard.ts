import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../../common/sidebar/sidebar';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Sidebar],
  template: `
    <div class="flex h-screen bg-gray-50">
      <app-sidebar></app-sidebar>
      
      <main class="flex-1 overflow-auto bg-gray-50 p-6">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class CustomerDashboard {
}
