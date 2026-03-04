import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { InvoiceService } from './invoice';

describe('InvoiceService', () => {
  let service: InvoiceService;
  let httpMock: HttpTestingController;
  const baseUrl = 'https://localhost:7128/api/invoices';
  const mockInvoice = { id: 'inv1', referenceId: 'ref1', type: 'PolicyPurchase', fileUrl: 'http://example.com/doc.pdf', createdAt: '2024-01-01' };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [InvoiceService] });
    service = TestBed.inject(InvoiceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => { expect(service).toBeTruthy(); });

  it('should get my invoices via GET /my', () => {
    service.getMyInvoices().subscribe(invoices => {
      expect(invoices.length).toBe(1);
      expect(invoices[0].type).toBe('PolicyPurchase');
    });
    const req = httpMock.expectOne(`${baseUrl}/my`);
    expect(req.request.method).toBe('GET');
    req.flush([mockInvoice]);
  });

  it('should return empty list when no invoices', () => {
    service.getMyInvoices().subscribe(invoices => { expect(invoices.length).toBe(0); });
    const req = httpMock.expectOne(`${baseUrl}/my`);
    req.flush([]);
  });
});
