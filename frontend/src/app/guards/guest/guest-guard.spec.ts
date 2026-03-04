import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { guestGuard } from './guest-guard';
import { AuthService } from '../../services/auth/auth';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('guestGuard', () => {
  let mockAuthService: { isAuthenticated: jasmine.Spy; getRole: jasmine.Spy };
  let mockRouter: { navigate: jasmine.Spy };

  const runGuard = () =>
    TestBed.runInInjectionContext(() =>
      guestGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

  beforeEach(() => {
    mockAuthService = { isAuthenticated: jasmine.createSpy(), getRole: jasmine.createSpy() };
    mockRouter = { navigate: jasmine.createSpy() };
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  it('should allow access when not authenticated', () => {
    mockAuthService.isAuthenticated.and.returnValue(false);
    expect(runGuard()).toBe(true);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should redirect Admin to /admin/dashboard', () => {
    mockAuthService.isAuthenticated.and.returnValue(true);
    mockAuthService.getRole.and.returnValue('Admin');
    expect(runGuard()).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
  });

  it('should redirect Customer to /customer/dashboard', () => {
    mockAuthService.isAuthenticated.and.returnValue(true);
    mockAuthService.getRole.and.returnValue('Customer');
    expect(runGuard()).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/customer/dashboard']);
  });

  it('should redirect Agent to /agent/dashboard', () => {
    mockAuthService.isAuthenticated.and.returnValue(true);
    mockAuthService.getRole.and.returnValue('Agent');
    expect(runGuard()).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/agent/dashboard']);
  });

  it('should redirect ClaimOfficer to /claim-officer/dashboard', () => {
    mockAuthService.isAuthenticated.and.returnValue(true);
    mockAuthService.getRole.and.returnValue('ClaimOfficer');
    expect(runGuard()).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/claim-officer/dashboard']);
  });

  it('should redirect unknown role to /', () => {
    mockAuthService.isAuthenticated.and.returnValue(true);
    mockAuthService.getRole.and.returnValue('Unknown');
    expect(runGuard()).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });
});
