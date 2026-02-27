import { Component, inject, signal } from '@angular/core';
import { Auth } from '../../../services/auth';
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
  private auth = inject(Auth);
  private router = inject(Router);

  email = signal('');
  password = signal('');

  // Captcha signals
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

  login() {

    if (!this.email().trim() || !this.password().trim()) {
      alert("Email and Password required");
      return;
    }

    if (this.enteredCaptcha().trim() !== this.generatedCaptcha()) {
      this.captchaError.set("Invalid CAPTCHA");
      alert("Invalid Captcha !!")
      this.generateCaptcha();
      this.enteredCaptcha.set('');
      return; 
    }

    this.captchaError.set('');

    this.auth.login(this.email(), this.password()).subscribe({
      next: (res) => {

        localStorage.setItem("token", res.token);

        this.auth.fetchCurrentUser();

        console.log(res);

        setTimeout(() => {
          if (res.role === "Admin") {
            this.router.navigate(["/admin/dashboard"]);
          } else if (res.role === "Agent") {
            this.router.navigate(["/agent/dashboard"]);
          } else if (res.role === "ClaimOfficer") {
            this.router.navigate(["/claims-officer/dashboard"]);
          } else {
            this.router.navigate(["/customer/dashboard"]);
          }
        }, 50);

      }
    });
  }
  
}