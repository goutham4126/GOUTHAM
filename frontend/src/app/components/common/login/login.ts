import { Component, inject, ChangeDetectorRef } from '@angular/core';
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
  private cdr = inject(ChangeDetectorRef);

  captchaText = '';
  captchaError = '';

  loginForm = this.fb.group({
    email: ['', [
      Validators.required,
      Validators.email,
      Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    ]],

    password: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(12)
    ]],

    captchaInput: ['', Validators.required]
  });

  showPassword = false;
  loading = false;
  error = '';

  constructor() {
    this.generateCaptcha();
  }

  // Generate 6 character captcha
  generateCaptcha() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let captcha = '';

    for (let i = 0; i < 6; i++) {
      captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    this.captchaText = captcha;
  }

  validateCaptcha(): boolean {
    const userInput = this.loginForm.get('captchaInput')?.value;

    if (userInput !== this.captchaText) {
      this.captchaError = 'Captcha does not match.';
      this.generateCaptcha();
      this.loginForm.get('captchaInput')?.setValue('');
      return false;
    }

    this.captchaError = '';
    return true;
  }

  onSubmit() {

    if (this.loginForm.invalid) return;

    if (!this.validateCaptcha()) {
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    const payload = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.authService.login(payload as any).subscribe({
      next: (res) => {

        switch (res.role) {
          case 'Admin': this.router.navigate(['/admin/dashboard']); break;
          case 'Customer': this.router.navigate(['/customer/dashboard']); break;
          case 'Agent': this.router.navigate(['/agent/dashboard']); break;
          case 'ClaimOfficer': this.router.navigate(['/claim-officer/dashboard']); break;
          default: this.router.navigate(['/']);
        }

      },
      error: (err) => {
        this.error = typeof err.error === 'string' ? err.error
          : (err.error?.message || err.error?.title || 'Invalid credentials. Please try again.');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}