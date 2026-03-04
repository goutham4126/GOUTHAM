import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { authInterceptor } from './auth-interceptor';
import { AuthService } from '../../services/auth/auth';
import { signal } from '@angular/core';

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let mockAuthService: any;
  let mockRouter: any;

  beforeEach(() => {
    mockRouter = { navigate: jasmine.createSpy() };
    mockAuthService = {
      getToken: jasmine.createSpy().and.returnValue(null),
      logout: jasmine.createSpy(),
      currentUser: signal(null)
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => httpMock.verify());

  it('should pass request without Authorization header when no token', () => {
    mockAuthService.getToken.and.returnValue(null);
    httpClient.get('/api/test').subscribe();
    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should add Authorization header when token exists', () => {
    mockAuthService.getToken.and.returnValue('test-token');
    httpClient.get('/api/test').subscribe();
    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush({});
  });

  it('should logout and navigate to /login on 401', () => {
    mockAuthService.getToken.and.returnValue('expired-token');
    httpClient.get('/api/protected').subscribe({ error: () => { } });
    const req = httpMock.expectOne('/api/protected');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should not call logout on non-401 errors', () => {
    mockAuthService.getToken.and.returnValue('token');
    httpClient.get('/api/test').subscribe({ error: () => { } });
    const req = httpMock.expectOne('/api/test');
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    expect(mockAuthService.logout).not.toHaveBeenCalled();
  });
});
