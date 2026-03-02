import { Component, inject } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
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
    governmentId: [''],
    phone: [''],
    dateOfBirth: [''],
    address: ['']
  });

  loading = false;
  error = '';

  onSubmit() {
    if (this.registerForm.invalid) return;

    this.loading = true;
    this.error = '';

    const raw = this.registerForm.getRawValue();
    // Send empty strings as null/undefined so backend doesn't store blank values
    const payload = {
      ...raw,
      governmentId: raw.governmentId || undefined,
      phone: raw.phone || undefined,
      dateOfBirth: raw.dateOfBirth || undefined,
      address: raw.address || undefined,
    };

    this.authService.register(payload as any).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.error = err?.error?.title || 'Registration failed. Please try again.';
        this.loading = false;
      }
    });
  }
}
