import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PlanService } from './plan';

describe('PlanService', () => {
  let service: PlanService;
  let httpMock: HttpTestingController;
  const baseUrl = 'https://localhost:7128/api/plans';
  const mockPlan = { id: 'plan1', name: 'Basic Plan', premiumAmount: 500, coverageAmount: 10000, durationInMonths: 12 };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [PlanService] });
    service = TestBed.inject(PlanService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => { expect(service).toBeTruthy(); });

  it('should get all plans via GET', () => {
    service.getAllPlans().subscribe(plans => { expect(plans.length).toBe(1); });
    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush([mockPlan]);
  });

  it('should get plan by id via GET /{id}', () => {
    service.getPlanById('plan1').subscribe(p => { expect(p.id).toBe('plan1'); });
    const req = httpMock.expectOne(`${baseUrl}/plan1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPlan);
  });

  it('should create plan via POST', () => {
    service.createPlan(mockPlan as any).subscribe();
    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    req.flush(mockPlan);
  });

  it('should update plan via PUT /{id}', () => {
    service.updatePlan('plan1', mockPlan as any).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/plan1`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('should delete plan via DELETE /{id}', () => {
    service.deletePlan('plan1').subscribe();
    const req = httpMock.expectOne(`${baseUrl}/plan1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
