import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class LayoutService {
    isSidebarOpen = signal(false);

    toggleSidebar() {
        this.isSidebarOpen.update(state => !state);
    }

    closeSidebar() {
        this.isSidebarOpen.set(false);
    }
}
