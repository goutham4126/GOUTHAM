import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { roleGuard } from './role-guard';
import { AuthService } from '../../services/auth/auth';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { signal } from '@angular/core';

describe('roleGuard', () => {
  let mockAuthService: any;
  let mockRouter: { navigate: jasmine.Spy };

  const runGuard = (requiredRole = 'Admin') =>
    TestBed.runInInjectionContext(() =>
      roleGuard({ data: { role: requiredRole } } as any, {} as RouterStateSnapshot)
    );

  beforeEach(() => {
    mockRouter = { navigate: jasmine.createSpy() };
    mockAuthService = { currentUser: signal<any>(null) };
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  it('should allow access when role matches', () => {
    mockAuthService.currentUser.set({ role: 'Admin', token: 'tok' });
    expect(runGuard('Admin')).toBe(true);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should deny access when user is not logged in', () => {
    mockAuthService.currentUser.set(null);
    expect(runGuard('Admin')).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should deny access when role does not match', () => {
    mockAuthService.currentUser.set({ role: 'Customer', token: 'tok' });
    expect(runGuard('Admin')).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should allow Agent with Agent role', () => {
    mockAuthService.currentUser.set({ role: 'Agent', token: 'tok' });
    expect(runGuard('Agent')).toBe(true);
  });
});
