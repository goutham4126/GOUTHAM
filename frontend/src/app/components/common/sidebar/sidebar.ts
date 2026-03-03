import { Component, inject } from '@angular/core';

import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth/auth';
import { LayoutService } from '../../../services/layout/layout';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebar.html'
})
export class Sidebar {
  public authService = inject(AuthService);
  public layoutService = inject(LayoutService);

  onLinkClick() {
    this.layoutService.closeSidebar();
  }
}
