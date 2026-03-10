import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Header } from './components/common/header/header';
import { Footer } from './components/common/footer/footer';
import { Sidebar } from './components/common/sidebar/sidebar';
import { ToastComponent } from './components/common/toast/toast';
import { IncomingCall } from './components/common/incoming-call/incoming-call';
import { AuthService } from './services/auth/auth';
import { NotificationService } from './services/notification/notification.service';
import { VideoCallService } from './services/video-call/video-call.service';
import { effect } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header, Footer, Sidebar, ToastComponent, IncomingCall],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
  public authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private videoCallService = inject(VideoCallService);

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user && user.token) {
        this.notificationService.startConnection(user.token);
        this.videoCallService.startConnection(user.token);
      } else {
        this.notificationService.stopConnection();
        this.videoCallService.stopConnection();
      }
    });
  }
}
