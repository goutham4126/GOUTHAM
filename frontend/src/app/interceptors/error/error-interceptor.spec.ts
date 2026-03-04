import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { errorInterceptor } from './error-interceptor';

describe('errorInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let mockRouter: any;

  beforeEach(() => {
    mockRouter = { navigate: jasmine.createSpy() };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: mockRouter }
      ]
    });
    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => httpMock.verify());

  it('should navigate to /error on 404', () => {
    httpClient.get('/api/missing').subscribe({ error: () => { } });
    const req = httpMock.expectOne('/api/missing');
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['/error'],
      jasmine.objectContaining({ queryParams: jasmine.objectContaining({ status: '404' }) })
    );
  });

  it('should navigate to /error on 500', () => {
    httpClient.get('/api/fail').subscribe({ error: () => { } });
    const req = httpMock.expectOne('/api/fail');
    req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['/error'],
      jasmine.objectContaining({ queryParams: jasmine.objectContaining({ status: '500' }) })
    );
  });

  it('should NOT navigate to /error on 401', () => {
    httpClient.get('/api/protected').subscribe({ error: () => { } });
    const req = httpMock.expectOne('/api/protected');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should pass the error along after handling', () => {
    let caughtError: any;
    httpClient.get('/api/fail').subscribe({ error: (e) => { caughtError = e; } });
    const req = httpMock.expectOne('/api/fail');
    req.flush('Error', { status: 500, statusText: 'Server Error' });
    expect(caughtError).toBeTruthy();
    expect(caughtError.status).toBe(500);
  });
});
