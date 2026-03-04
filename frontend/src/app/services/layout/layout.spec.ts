import { TestBed } from '@angular/core/testing';
import { LayoutService } from './layout';

describe('LayoutService', () => {
  let service: LayoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [LayoutService] });
    service = TestBed.inject(LayoutService);
  });

  it('should be created', () => { expect(service).toBeTruthy(); });
  it('should start with sidebar closed', () => { expect(service.isSidebarOpen()).toBe(false); });
  it('should toggle sidebar open', () => { service.toggleSidebar(); expect(service.isSidebarOpen()).toBe(true); });
  it('should toggle sidebar closed when already open', () => {
    service.toggleSidebar();
    service.toggleSidebar();
    expect(service.isSidebarOpen()).toBe(false);
  });
  it('should close sidebar', () => {
    service.toggleSidebar();
    service.closeSidebar();
    expect(service.isSidebarOpen()).toBe(false);
  });
  it('should remain closed when closeSidebar called while already closed', () => {
    service.closeSidebar();
    expect(service.isSidebarOpen()).toBe(false);
  });
});
