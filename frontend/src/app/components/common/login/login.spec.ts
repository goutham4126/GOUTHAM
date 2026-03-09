import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Login } from './login';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../../../services/auth/auth';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let mockAuthService: { login: jasmine.Spy };
  let mockRouter: Router;

  beforeEach(async () => {
    mockAuthService = { login: jasmine.createSpy() };

    await TestBed.configureTestingModule({
      imports: [Login, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    mockRouter = TestBed.inject(Router);
    spyOn(mockRouter, 'navigate');

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should have invalid form when empty', () => { expect(component.loginForm.valid).toBe(false); });

  it('should validate email is required', () => {
    component.loginForm.controls['email'].setValue('');
    expect(component.loginForm.controls['email'].hasError('required')).toBe(true);
  });

  it('should validate email format', () => {
    component.loginForm.controls['email'].setValue('not-an-email');
    expect(component.loginForm.controls['email'].hasError('email')).toBe(true);
  });

  it('should validate password is required', () => {
    component.loginForm.controls['password'].setValue('');
    expect(component.loginForm.controls['password'].hasError('required')).toBe(true);
  });

  it('should have valid form with correct inputs', () => {
    component.loginForm.setValue({ email: 'user@test.com', password: 'password123' });
    expect(component.loginForm.valid).toBe(true);
  });

  it('should not submit when form is invalid', () => {
    component.onSubmit();
    expect(mockAuthService.login).not.toHaveBeenCalled();
  });

  it('should navigate to admin dashboard for Admin role', () => {
    mockAuthService.login.and.returnValue(of({ role: 'Admin', token: 'tok', email: 'a@b.com', firstName: 'A', lastName: 'B' }));
    component.loginForm.setValue({ email: 'admin@test.com', password: 'password123' });
    component.onSubmit();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
  });

  it('should navigate to customer dashboard for Customer role', () => {
    mockAuthService.login.and.returnValue(of({ role: 'Customer', token: 'tok', email: 'c@b.com', firstName: 'C', lastName: 'D' }));
    component.loginForm.setValue({ email: 'cust@test.com', password: 'password123' });
    component.onSubmit();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/customer/dashboard']);
  });

  it('should navigate to agent dashboard for Agent role', () => {
    mockAuthService.login.and.returnValue(of({ role: 'Agent', token: 'tok', email: 'ag@b.com', firstName: 'A', lastName: 'G' }));
    component.loginForm.setValue({ email: 'ag@test.com', password: 'password123' });
    component.onSubmit();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/agent/dashboard']);
  });

  it('should set error on login failure', () => {
    mockAuthService.login.and.returnValue(throwError(() => new Error('Invalid')));
    component.loginForm.setValue({ email: 'user@test.com', password: 'wrongpassword' });
    component.onSubmit();
    expect(component.error).toBe('Invalid credentials. Please try again.');
    expect(component.loading).toBe(false);
  });

  it('should start with loading=false and error empty', () => {
    expect(component.loading).toBe(false);
    expect(component.error).toBe('');
  });
});
