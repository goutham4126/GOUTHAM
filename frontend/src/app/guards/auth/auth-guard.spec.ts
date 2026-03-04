import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth-guard';
import { AuthService } from '../../services/auth/auth';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('authGuard', () => {
  let mockAuthService: { isAuthenticated: jasmine.Spy };
  let mockRouter: { navigate: jasmine.Spy };

  const runGuard = () =>
    TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

  beforeEach(() => {
    mockAuthService = { isAuthenticated: jasmine.createSpy() };
    mockRouter = { navigate: jasmine.createSpy() };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  it('should allow access when user is authenticated', () => {
    mockAuthService.isAuthenticated.and.returnValue(true);
    expect(runGuard()).toBe(true);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to /login when not authenticated', () => {
    mockAuthService.isAuthenticated.and.returnValue(false);
    expect(runGuard()).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });
});
