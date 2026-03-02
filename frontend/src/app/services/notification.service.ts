import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as signalR from '@microsoft/signalr';
import { Observable } from 'rxjs';
import { NotificationMessage } from '../models/notification.model';
import { ToastService } from './toast';
import { signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private hubConnection: signalR.HubConnection | undefined;
    private readonly apiUrl = 'https://localhost:7128/api/Notifications';
    private readonly hubUrl = 'https://localhost:7128/hubs/notifications';

    public notifications = signal<NotificationMessage[]>([]);
    public unreadCount = signal<number>(0);

    constructor(private http: HttpClient, private toastService: ToastService) { }

    public startConnection(token: string) {
        if (this.hubConnection?.state === signalR.HubConnectionState.Connected) return;

        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(this.hubUrl, {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect()
            .build();

        this.hubConnection.start()
            .then(() => {
                console.log('SignalR Notification Hub connected');
                this.fetchInitialNotifications();
            })
            .catch(err => console.error('Error starting SignalR connection: ' + err));

        this.hubConnection.on('ReceiveNotification', (notification: NotificationMessage) => {
            // Add new notification to top of list
            this.notifications.update(current => [notification, ...current]);

            // Update unread count
            this.unreadCount.update(count => count + 1);

            // Trigger standard toast notification
            this.toastService.success(`${notification.title}: ${notification.message}`);
        });
    }

    public stopConnection() {
        this.hubConnection?.stop()
            .then(() => console.log('SignalR Notification Hub disconnected'))
            .catch(err => console.error('Error stopping SignalR connection: ' + err));
    }

    public fetchInitialNotifications() {
        this.http.get<NotificationMessage[]>(this.apiUrl).subscribe({
            next: (data) => {
                this.notifications.set(data);
            },
            error: (err) => console.error('Error fetching notifications:', err)
        });

        this.http.get<{ count: number }>(`${this.apiUrl}/unread-count`).subscribe({
            next: (res) => {
                this.unreadCount.set(res.count);
            },
            error: (err) => console.error('Error fetching unread count:', err)
        });
    }

    public markAsRead(id: number): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}/mark-read`, {});
    }

    public markAllAsRead(): Observable<any> {
        return this.http.put(`${this.apiUrl}/mark-all-read`, {});
    }

    // Local state update after successful mark as read
    public updateLocalReadState(id: number) {
        this.notifications.update(notifications => {
            const index = notifications.findIndex(n => n.id === id);
            if (index !== -1 && !notifications[index].isRead) {
                const updated = [...notifications];
                updated[index] = { ...updated[index], isRead: true };

                this.unreadCount.update(count => Math.max(0, count - 1));
                return updated;
            }
            return notifications;
        });
    }

    // Update all state locally
    public updateAllLocalReadState() {
        this.notifications.update(notifications =>
            notifications.map(n => ({ ...n, isRead: true }))
        );
        this.unreadCount.set(0);
    }
}
