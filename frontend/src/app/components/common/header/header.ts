import { Component } from '@angular/core';
import { Auth } from '../../../services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
})
export class Header {
  constructor(public auth: Auth) {}

  logout() {
    this.auth.logout();
  }
}