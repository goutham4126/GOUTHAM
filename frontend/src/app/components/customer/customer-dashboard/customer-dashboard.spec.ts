import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomerDashboard } from './customer-dashboard';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../../../services/auth/auth';
import { LayoutService } from '../../../services/layout/layout';
import { signal } from '@angular/core';

describe('CustomerDashboard', () => {
  let component: CustomerDashboard;
  let fixture: ComponentFixture<CustomerDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerDashboard, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: { currentUser: signal(null), isAuthenticated: jasmine.createSpy().and.returnValue(true), getRole: jasmine.createSpy().and.returnValue('Customer') } },
        { provide: LayoutService, useValue: { isSidebarOpen: signal(false), closeSidebar: jasmine.createSpy() } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });
});
