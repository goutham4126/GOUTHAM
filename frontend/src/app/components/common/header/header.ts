import { Component, inject } from '@angular/core';

import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth/auth';
import { LayoutService } from '../../../services/layout/layout';
import { ThemeService } from '../../../services/theme/theme';
import { NotificationService } from '../../../services/notification/notification.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './header.html'
})
export class Header {
  public authService = inject(AuthService);
  public layoutService = inject(LayoutService);
  public themeService = inject(ThemeService);
  public notificationService = inject(NotificationService);
  private router = inject(Router);

  isNotificationOpen = false;

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  markAsRead(id: number) {
    this.notificationService.markAsRead(id).subscribe({
      next: () => this.notificationService.updateLocalReadState(id),
      error: (err) => console.error('Error marking as read', err)
    });
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe({
      next: () => this.notificationService.updateAllLocalReadState(),
      error: (err) => console.error('Error marking all as read', err)
    });
  }
}
