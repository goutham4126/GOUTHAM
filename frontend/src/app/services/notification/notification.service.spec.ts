import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NotificationService } from './notification.service';
import { ToastService } from '../toast/toast';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;
  const baseUrl = 'https://localhost:7128/api/Notifications';
  const mockNotif: any = { id: 1, userId: 'u1', title: 'Test', message: 'Notification', isRead: false, createdAt: new Date() };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NotificationService, ToastService]
    });
    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => { expect(service).toBeTruthy(); });
  it('should start with empty notifications', () => { expect(service.notifications()).toEqual([]); });
  it('should start with 0 unread count', () => { expect(service.unreadCount()).toBe(0); });

  it('should mark notification as read via PUT', () => {
    service.markAsRead(1).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/1/mark-read`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('should mark all as read via PUT', () => {
    service.markAllAsRead().subscribe();
    const req = httpMock.expectOne(`${baseUrl}/mark-all-read`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('should update local read state', () => {
    service.notifications.set([mockNotif]);
    service.unreadCount.set(1);
    service.updateLocalReadState(1);
    expect(service.notifications()[0].isRead).toBe(true);
    expect(service.unreadCount()).toBe(0);
  });

  it('should not go below 0 unread count', () => {
    service.notifications.set([{ ...mockNotif, isRead: true }]);
    service.unreadCount.set(0);
    service.updateLocalReadState(1);
    expect(service.unreadCount()).toBe(0);
  });

  it('should update all to read state', () => {
    service.notifications.set([{ ...mockNotif, id: 1 }, { ...mockNotif, id: 2 }]);
    service.unreadCount.set(2);
    service.updateAllLocalReadState();
    expect(service.notifications().every(n => n.isRead)).toBe(true);
    expect(service.unreadCount()).toBe(0);
  });

  it('should stop connection without error if not started', () => {
    expect(() => service.stopConnection()).not.toThrow();
  });
});
