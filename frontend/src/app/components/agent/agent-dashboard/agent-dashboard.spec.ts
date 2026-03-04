import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgentDashboard } from './agent-dashboard';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../../../services/auth/auth';
import { LayoutService } from '../../../services/layout/layout';
import { signal } from '@angular/core';

describe('AgentDashboard', () => {
  let component: AgentDashboard;
  let fixture: ComponentFixture<AgentDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgentDashboard, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: { currentUser: signal(null), isAuthenticated: jasmine.createSpy().and.returnValue(true), getRole: jasmine.createSpy().and.returnValue('Agent') } },
        { provide: LayoutService, useValue: { isSidebarOpen: signal(false), closeSidebar: jasmine.createSpy() } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AgentDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });
});
