import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Header } from './components/common/header/header';
import { Footer } from './components/common/footer/footer';
import { Sidebar } from './components/common/sidebar/sidebar';
import { ToastComponent } from './components/common/toast/toast';
import { AuthService } from './services/auth';
import { NotificationService } from './services/notification.service';
import { effect } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header, Footer, Sidebar, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
  public authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user && user.token) {
        this.notificationService.startConnection(user.token);
      } else {
        this.notificationService.stopConnection();
      }
    });
  }
}
