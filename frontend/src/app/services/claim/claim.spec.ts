import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ClaimService } from './claim';

describe('ClaimService', () => {
  let service: ClaimService;
  let httpMock: HttpTestingController;
  const baseUrl = 'https://localhost:7128/api/claims';

  const mockClaim = { id: 'c1', policyId: 'p1', description: 'Car accident', status: 'Pending', claimDate: '2024-01-01' };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [ClaimService] });
    service = TestBed.inject(ClaimService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => { expect(service).toBeTruthy(); });

  it('should submit a claim via POST', () => {
    const dto = { policyId: 'p1', description: 'Car accident' };
    service.submitClaim(dto as any).subscribe(res => { expect(res).toEqual(mockClaim as any); });
    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    req.flush(mockClaim);
  });

  it('should get my claims via GET /my', () => {
    service.getMyClaims().subscribe(claims => { expect(claims.length).toBe(1); });
    const req = httpMock.expectOne(`${baseUrl}/my`);
    expect(req.request.method).toBe('GET');
    req.flush([mockClaim]);
  });

  it('should get all claims via GET', () => {
    service.getAllClaims().subscribe(claims => { expect(claims).toBeTruthy(); });
    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush([mockClaim]);
  });

  it('should get assigned claims via GET /assigned', () => {
    service.getAssignedClaims().subscribe();
    const req = httpMock.expectOne(`${baseUrl}/assigned`);
    expect(req.request.method).toBe('GET');
    req.flush([mockClaim]);
  });

  it('should approve a claim via POST /{id}/approve', () => {
    service.approveClaim('c1', { approvedAmount: 1000, remarks: 'OK' } as any).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/c1/approve`);
    expect(req.request.method).toBe('POST');
    req.flush('Approved');
  });

  it('should reject a claim via POST /{id}/reject', () => {
    service.rejectClaim('c1', { remarks: 'Rejected' }).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/c1/reject`);
    expect(req.request.method).toBe('POST');
    req.flush('Rejected');
  });
});
