import { Component } from '@angular/core';
import { Auth } from '../../../services/auth';
import { User } from '../../../services/user';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
})
export class Login {
  email = '';
  password = '';

  constructor(
    public auth: Auth,
    private userService: User,
    private router: Router
  ) {}

  onLogin() {
    this.auth.loading.set(true);

    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        this.auth.saveToken(res.token);

        this.userService.getCurrentUser().subscribe({
          next: (user) => {
            this.auth.setUser(user);
            this.auth.loading.set(false);

            switch (user.role) {
              case 'Admin':
                this.router.navigate(['/admin/dashboard']);
                break;
              case 'Agent':
                this.router.navigate(['/agent/dashboard']);
                break;
              case 'ClaimOfficer':
                this.router.navigate(['/claims-officer/dashboard']);
                break;
              default:
                this.router.navigate(['/customer/dashboard']);
            }
          },
          error: () => {
            this.auth.loading.set(false);
          },
        });
      },
      error: () => {
        this.auth.error.set('Invalid email or password');
        this.auth.loading.set(false);
      },
    });
  }
}