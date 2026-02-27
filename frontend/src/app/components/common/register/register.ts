import { Component, inject, signal } from '@angular/core';
import { Auth } from '../../../services/auth';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './register.html',
})
export class Register {

  private auth = inject(Auth);
  private router = inject(Router);

  // Form Signals
  firstName = signal('');
  lastName = signal('');
  email = signal('');
  password = signal('');
  governmentId = signal('');
  phone = signal('');
  address = signal('');
  dateOfBirth = signal('');

  // Captcha Signals
  generatedCaptcha = signal('');
  enteredCaptcha = signal('');
  captchaError = signal('');

  constructor() {
    this.generateCaptcha();
  }

  generateCaptcha() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let captcha = '';

    for (let i = 0; i < 6; i++) {
      captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    this.generatedCaptcha.set(captcha);
  }

  onRegister() {

    // Basic Validation
    if (
      !this.firstName().trim() ||
      !this.lastName().trim() ||
      !this.email().trim() ||
      !this.password().trim() ||
      !this.governmentId().trim() ||
      !this.phone().trim() ||
      !this.address().trim() ||
      !this.dateOfBirth()
    ) {
      alert("All fields are required");
      return;
    }

    // CAPTCHA Validation
    if (this.enteredCaptcha().trim() !== this.generatedCaptcha()) {
      this.captchaError.set("Invalid CAPTCHA");
      alert("Invalid Captcha !!");
      this.generateCaptcha();
      this.enteredCaptcha.set('');
      return;
    }

    this.captchaError.set('');

    const registerData = {
      firstName: this.firstName(),
      lastName: this.lastName(),
      email: this.email(),
      password: this.password(),
      governmentId: this.governmentId(),
      phone: this.phone(),
      address: this.address(),
      dateOfBirth: this.dateOfBirth()
    };

    this.auth.register(registerData).subscribe({
      next: () => {
        alert("User registered successfully");
        this.router.navigate(['/login']);
      },
      error: (err) => {
        alert(err?.error?.message || "Registration failed");
      }
    });
  }
}