import { Component } from '@angular/core';
import { Auth } from '../../../services/auth';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { User } from '../../../services/user';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule,CommonModule],
  templateUrl: './register.html',
})
export class Register {
  user: any = {};

  constructor(
    public auth: Auth,
    private userService: User,
    private router: Router
  ) {}
  
  onRegister() {
  this.auth.loading.set(true);

  this.auth.register(this.user).subscribe({
    next: (res) => {
      this.auth.saveToken(res.token);

      this.userService.getCurrentUser().subscribe({
        next: (user) => {
          this.auth.setUser(user);
          this.auth.loading.set(false);
          this.router.navigate(['/customer/dashboard']);
        },
        error: () => {
          this.auth.loading.set(false);
        },
      });
    },
    error: () => {
      this.auth.error.set('Registration failed');
      this.auth.loading.set(false);
    },
  });
}
}