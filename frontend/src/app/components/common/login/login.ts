import { Component, inject } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  loading = false;
  error = '';

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.error = '';

    this.authService.login(this.loginForm.getRawValue() as any).subscribe({
      next: (res) => {
        // Route based on role
        switch (res.role) {
          case 'Admin': this.router.navigate(['/admin/dashboard']); break;
          case 'Customer': this.router.navigate(['/customer/dashboard']); break;
          case 'Agent': this.router.navigate(['/agent/dashboard']); break;
          case 'ClaimOfficer': this.router.navigate(['/claim-officer/dashboard']); break;
          default: this.router.navigate(['/']);
        }
      },
      error: () => {
        this.error = 'Invalid credentials. Please try again.';
        this.loading = false;
      }
    });
  }
}
