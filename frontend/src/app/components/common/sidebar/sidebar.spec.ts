import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Sidebar } from './sidebar';
import { RouterTestingModule } from '@angular/router/testing';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth/auth';
import { LayoutService } from '../../../services/layout/layout';
import { signal } from '@angular/core';

describe('Sidebar', () => {
  let component: Sidebar;
  let fixture: ComponentFixture<Sidebar>;
  let mockLayoutService: any;

  beforeEach(async () => {
    mockLayoutService = { isSidebarOpen: signal(false), closeSidebar: jasmine.createSpy() };
    await TestBed.configureTestingModule({
      imports: [Sidebar, CommonModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: { currentUser: signal(null), isAuthenticated: jasmine.createSpy().and.returnValue(true), getRole: jasmine.createSpy().and.returnValue('Customer') } },
        { provide: LayoutService, useValue: mockLayoutService }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(Sidebar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });
  it('should call closeSidebar on link click', () => {
    component.onLinkClick();
    expect(mockLayoutService.closeSidebar).toHaveBeenCalled();
  });
});
