import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  const baseUrl = 'https://localhost:7128/api/users';

  const mockUser = { id: 'u1', firstName: 'John', lastName: 'Doe', email: 'john@test.com', role: 'Customer' };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [UserService] });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => { expect(service).toBeTruthy(); });

  it('should get current user via GET /me', () => {
    service.getMe().subscribe(u => { expect(u.email).toBe('john@test.com'); });
    const req = httpMock.expectOne(`${baseUrl}/me`);
    expect(req.request.method).toBe('GET');
    req.flush(mockUser);
  });

  it('should update profile via PUT /me', () => {
    const dto = { firstName: 'Jane', lastName: 'Doe' };
    service.updateMyProfile(dto as any).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/me`);
    expect(req.request.method).toBe('PUT');
    req.flush({ ...mockUser, firstName: 'Jane' });
  });

  it('should get all users via GET', () => {
    service.getAllUsers().subscribe(users => { expect(users.length).toBe(1); });
    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush([mockUser]);
  });

  it('should update user role via PUT /{id}/role', () => {
    service.updateUserRole('u1', { role: 'Admin' } as any).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/u1/role`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('should delete user via DELETE /{id}', () => {
    service.deleteUser('u1').subscribe();
    const req = httpMock.expectOne(`${baseUrl}/u1`);
    expect(req.request.method).toBe('DELETE');
    req.flush('Deleted');
  });
});
