import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../../common/sidebar/sidebar';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Sidebar],
  templateUrl: './customer-dashboard.html'
})
export class CustomerDashboard {
}
