import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  activeTab = signal('home');

  packages = [
    { title: 'Natural Disaster', desc: 'Secure your assets against floods, earthquakes, and severe storms.', icon: 'bolt', active: false },
    { title: 'Personal Casualty', desc: 'Comprehensive coverage for unforeseen personal injuries and liabilities.', icon: 'medal', active: true },
    { title: 'Enterprise Risk', desc: 'Protect your business against catastrophic operational disruptions.', icon: 'crown', active: false },
    { title: 'Emergency Prep', desc: 'Proactive planning and rapid response funding for critical emergencies.', icon: 'grid', active: false }
  ];

  setTab(tab: string) {
    this.activeTab.set(tab);
  }
}
