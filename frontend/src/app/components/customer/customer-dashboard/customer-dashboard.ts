import { Component } from '@angular/core';

import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../../common/sidebar/sidebar';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [RouterOutlet, Sidebar],
  templateUrl: './customer-dashboard.html'
})
export class CustomerDashboard {
}
