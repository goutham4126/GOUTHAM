import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    governmentId: ['']
  });

  loading = false;
  error = '';

  onSubmit() {
    if (this.registerForm.invalid) return;

    this.loading = true;
    this.error = '';

    const payload = this.registerForm.getRawValue();

    this.authService.register(payload as any).subscribe({
      next: () => {
        // Auto sign-in or redirect to login. Let's redirect to login for simplicity.
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.error = err?.error?.title || 'Registration failed. Please try again.';
        this.loading = false;
      }
    });
  }
}
