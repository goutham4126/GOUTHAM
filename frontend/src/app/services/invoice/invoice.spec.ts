import { TestBed } from '@angular/core/testing';

import { InvoiceService } from './invoice';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('InvoiceService', () => {
  let service: InvoiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(InvoiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
