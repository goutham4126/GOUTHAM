import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomerInvoices } from './customer-invoices';
import { CommonModule } from '@angular/common';
import { InvoiceService } from '../../../services/invoice/invoice';
import { of, throwError } from 'rxjs';

describe('CustomerInvoices', () => {
  let component: CustomerInvoices;
  let fixture: ComponentFixture<CustomerInvoices>;
  let mockInvoiceService: { getMyInvoices: jasmine.Spy };
  const mockInvoices: any = [
    { id: 'i1', type: 'PolicyPurchase', amount: 500 },
    { id: 'i2', type: 'ClaimStatus', amount: 200 },
    { id: 'i3', type: 'Payment', amount: 300 }
  ];

  beforeEach(async () => {
    mockInvoiceService = { getMyInvoices: jasmine.createSpy().and.returnValue(of(mockInvoices)) };
    await TestBed.configureTestingModule({
      imports: [CustomerInvoices, CommonModule],
      providers: [{ provide: InvoiceService, useValue: mockInvoiceService }]
    }).compileComponents();
    fixture = TestBed.createComponent(CustomerInvoices);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });
  it('should load and categorize invoices on init', () => {
    expect(component.policyInvoices.length).toBe(1);
    expect(component.claimInvoices.length).toBe(1);
    expect(component.paymentInvoices.length).toBe(1);
    expect(component.isLoading).toBe(false);
  });
  it('should set error on load failure', () => {
    spyOn(console, 'error');
    mockInvoiceService.getMyInvoices.and.returnValue(throwError(() => new Error()));
    component.loadInvoices();
    expect(component.error).toBe('Failed to load invoices. Please try again later.');
    expect(component.isLoading).toBe(false);
  });
  it('should identify image URLs', () => { expect(component.isImage('photo.jpg')).toBe(true); expect(component.isImage('')).toBe(false); });
  it('should identify PDF URLs', () => { expect(component.isPdf('file.pdf')).toBe(true); expect(component.isPdf('photo.jpg')).toBe(false); });
  it('should return null from getSafeUrl for null', () => { expect(component.getSafeUrl(null)).toBeNull(); });
  it('should close document viewer', () => {
    component.viewingDocumentUrl = 'http://example.com/doc';
    component.closeDocument();
    expect(component.viewingDocumentUrl).toBeNull();
  });
});
