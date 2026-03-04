import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockAuthResult = {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJDdXN0b21lciIsImV4cCI6OTk5OTk5OTk5OX0.fake',
    email: 'test@example.com',
    role: 'Customer',
    firstName: 'Test',
    lastName: 'User'
  };

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with null currentUser when sessionStorage is empty', () => {
    expect(service.currentUser()).toBeNull();
  });

  it('should return false for isAuthenticated when not logged in', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should return null for getToken when not logged in', () => {
    expect(service.getToken()).toBeNull();
  });

  it('should return null for getRole when not logged in', () => {
    expect(service.getRole()).toBeNull();
  });

  it('should call register API with correct payload', () => {
    const dto = { firstName: 'John', lastName: 'Doe', email: 'john@test.com', password: 'pass123' };
    service.register(dto as any).subscribe();
    const req = httpMock.expectOne('https://localhost:7128/api/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush({});
  });

  it('should call login API', () => {
    service.login({ email: 'test@example.com', password: 'pass' } as any).subscribe();
    const req = httpMock.expectOne('https://localhost:7128/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockAuthResult);
  });

  it('should clear currentUser on logout', () => {
    service.currentUser.set(mockAuthResult as any);
    service.logout();
    expect(service.currentUser()).toBeNull();
  });

  it('should return true for isAuthenticated when user is set', () => {
    service.currentUser.set(mockAuthResult as any);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should return token when user is logged in', () => {
    service.currentUser.set(mockAuthResult as any);
    expect(service.getToken()).toBe(mockAuthResult.token);
  });

  it('should return role when user is logged in', () => {
    service.currentUser.set(mockAuthResult as any);
    expect(service.getRole()).toBe('Customer');
  });

  it('should remove authUser from sessionStorage on logout', () => {
    sessionStorage.setItem('authUser', JSON.stringify(mockAuthResult));
    service.logout();
    expect(sessionStorage.getItem('authUser')).toBeNull();
  });
});
