import { Component, inject } from '@angular/core';
import { Auth } from '../../../services/auth';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  templateUrl: './customer-dashboard.html',
})
export class CustomerDashboard {
  private auth = inject(Auth);
  user = this.auth.currentUser;

}