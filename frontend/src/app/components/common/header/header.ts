import { Component, inject } from '@angular/core';
import { Auth } from '../../../services/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.html',
})
export class Header {

  auth = inject(Auth);

  logout() {
    this.auth.logout();
  }
}