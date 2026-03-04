import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PolicyService } from './policy';

describe('PolicyService', () => {
  let service: PolicyService;
  let httpMock: HttpTestingController;
  const baseUrl = 'https://localhost:7128/api/policies';
  const mockPolicy = { id: 'pol1', planId: 'plan1', customerId: 'cust1', status: 'Active' };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [PolicyService] });
    service = TestBed.inject(PolicyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => { expect(service).toBeTruthy(); });

  it('should purchase policy via POST /purchase', () => {
    service.purchasePolicy({ planId: 'plan1' } as any).subscribe(r => { expect(r.id).toBe('pol1'); });
    const req = httpMock.expectOne(`${baseUrl}/purchase`);
    expect(req.request.method).toBe('POST');
    req.flush(mockPolicy);
  });

  it('should get my policies via GET /my', () => {
    service.getMyPolicies().subscribe(p => { expect(p.length).toBe(1); });
    const req = httpMock.expectOne(`${baseUrl}/my`);
    expect(req.request.method).toBe('GET');
    req.flush([mockPolicy]);
  });

  it('should get policy by id via GET /{id}', () => {
    service.getPolicyById('pol1').subscribe(p => { expect(p.id).toBe('pol1'); });
    const req = httpMock.expectOne(`${baseUrl}/pol1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPolicy);
  });

  it('should get assigned policies via GET /assigned', () => {
    service.getAssignedPolicies().subscribe();
    const req = httpMock.expectOne(`${baseUrl}/assigned`);
    expect(req.request.method).toBe('GET');
    req.flush([mockPolicy]);
  });

  it('should get all policies via GET /all', () => {
    service.getAllPolicies().subscribe();
    const req = httpMock.expectOne(`${baseUrl}/all`);
    expect(req.request.method).toBe('GET');
    req.flush([mockPolicy]);
  });

  it('should pay policy via POST /pay/{paymentId}', () => {
    service.payPolicy('pay1').subscribe();
    const req = httpMock.expectOne(`${baseUrl}/pay/pay1`);
    expect(req.request.method).toBe('POST');
    req.flush('OK');
  });
});
