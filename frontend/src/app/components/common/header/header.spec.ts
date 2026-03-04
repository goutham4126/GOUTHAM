import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Header } from './header';
import { RouterTestingModule } from '@angular/router/testing';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth/auth';
import { LayoutService } from '../../../services/layout/layout';
import { ThemeService } from '../../../services/theme/theme';
import { NotificationService } from '../../../services/notification/notification.service';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;
  let mockAuthService: any;
  let mockLayoutService: any;
  let mockThemeService: any;
  let mockNotificationService: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockAuthService = { currentUser: signal(null), logout: jasmine.createSpy(), isAuthenticated: jasmine.createSpy().and.returnValue(true), getRole: jasmine.createSpy().and.returnValue('Customer') };
    mockLayoutService = { isSidebarOpen: signal(false), toggleSidebar: jasmine.createSpy() };
    mockThemeService = { isDarkMode: signal(false), toggleTheme: jasmine.createSpy() };
    mockNotificationService = {
      notifications: signal([]),
      unreadCount: signal(0),
      markAsRead: jasmine.createSpy().and.returnValue(of({})),
      markAllAsRead: jasmine.createSpy().and.returnValue(of({})),
      updateLocalReadState: jasmine.createSpy(),
      updateAllLocalReadState: jasmine.createSpy()
    };

    await TestBed.configureTestingModule({
      imports: [Header, CommonModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: LayoutService, useValue: mockLayoutService },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: NotificationService, useValue: mockNotificationService }
      ]
    }).compileComponents();

    mockRouter = TestBed.inject(Router);
    spyOn(mockRouter, 'navigate');

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should logout and navigate to /', () => {
    component.logout();
    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should call markAsRead and updateLocalReadState', () => {
    component.markAsRead(1);
    expect(mockNotificationService.markAsRead).toHaveBeenCalledWith(1);
    expect(mockNotificationService.updateLocalReadState).toHaveBeenCalledWith(1);
  });

  it('should call markAllAsRead and updateAllLocalReadState', () => {
    component.markAllAsRead();
    expect(mockNotificationService.markAllAsRead).toHaveBeenCalled();
    expect(mockNotificationService.updateAllLocalReadState).toHaveBeenCalled();
  });

  it('should initialize isNotificationOpen as false', () => {
    expect(component.isNotificationOpen).toBe(false);
  });
});
