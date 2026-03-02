import { Component } from '@angular/core';

import { RouterModule } from '@angular/router';
import { Sidebar } from '../../common/sidebar/sidebar';

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [RouterModule, Sidebar],
  templateUrl: './agent-dashboard.html',
  styleUrl: './agent-dashboard.css'
})
export class AgentDashboard {
}
