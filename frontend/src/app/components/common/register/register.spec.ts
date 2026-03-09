import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Register } from './register';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../../../services/auth/auth';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;
  let mockAuthService: { register: jasmine.Spy };
  let mockRouter: Router;

  beforeEach(async () => {
    mockAuthService = { register: jasmine.createSpy() };

    await TestBed.configureTestingModule({
      imports: [Register, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    mockRouter = TestBed.inject(Router);
    spyOn(mockRouter, 'navigate');

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });
  it('should have invalid form when empty', () => { expect(component.registerForm.valid).toBe(false); });

  it('should require firstName', () => {
    component.registerForm.controls['firstName'].setValue('');
    expect(component.registerForm.controls['firstName'].hasError('required')).toBe(true);
  });

  it('should require lastName', () => {
    component.registerForm.controls['lastName'].setValue('');
    expect(component.registerForm.controls['lastName'].hasError('required')).toBe(true);
  });

  it('should require valid email', () => {
    component.registerForm.controls['email'].setValue('bademail');
    expect(component.registerForm.controls['email'].hasError('email')).toBe(true);
  });

  it('should require password min 6 chars', () => {
    component.registerForm.controls['password'].setValue('abc');
    expect(component.registerForm.controls['password'].hasError('minlength')).toBe(true);
  });

  it('should not call register if form invalid', () => {
    component.onSubmit();
    expect(mockAuthService.register).not.toHaveBeenCalled();
  });

  it('should navigate to /login on successful registration', () => {
    mockAuthService.register.and.returnValue(of({}));
    component.registerForm.setValue({
      firstName: 'John', lastName: 'Doe', email: 'john@test.com', password: 'password123',
      governmentId: '', phone: '', dateOfBirth: '', address: ''
    });
    component.onSubmit();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should set error on registration failure', () => {
    mockAuthService.register.and.returnValue(throwError(() => ({ error: { title: 'Email already exists' } })));
    component.registerForm.setValue({
      firstName: 'John', lastName: 'Doe', email: 'john@test.com', password: 'password123',
      governmentId: '', phone: '', dateOfBirth: '', address: ''
    });
    component.onSubmit();
    expect(component.error).toBe('Email already exists');
    expect(component.loading).toBe(false);
  });
});
