import { TestBed } from '@angular/core/testing';

import { GlobalErrorHandler } from './global-error-handler';

describe('GlobalErrorHandler', () => {
  let item: GlobalErrorHandler;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    item = TestBed.inject(GlobalErrorHandler);
  });

  it('should be created', () => {
    expect(item).toBeTruthy();
  });
});
