import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth/auth';

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
  private cdr = inject(ChangeDetectorRef);

  maxDate: string;

  constructor() {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 18);
    this.maxDate = today.toISOString().split('T')[0];
  }

  ageValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const birthDate = new Date(control.value);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age < 18 ? { underAge: true } : null;
  }

  registerForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      ]
    ],
    password: ['', [Validators.required, Validators.minLength(8)]],
    governmentId: [''],

    phone: [
      '',
      [
        Validators.pattern(/^[6-9]\d{9}$/)
      ]
    ],

    dateOfBirth: ['', this.ageValidator.bind(this)],
    address: ['']
  });

  loading = false;
  error = '';

  onSubmit() {
    if (this.registerForm.invalid) return;

    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    const raw = this.registerForm.getRawValue();

    const payload = {
      ...raw,
      governmentId: raw.governmentId || undefined,
      phone: raw.phone ? `+91${raw.phone}` : undefined,
      dateOfBirth: raw.dateOfBirth || undefined,
      address: raw.address || undefined,
    };

    this.authService.register(payload as any).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.error = typeof err.error === 'string' ? err.error
          : (err.error?.message || err.error?.title || 'Registration failed. Please try again.');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}