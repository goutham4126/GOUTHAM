import { Component, OnInit, inject, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AmbeeDisasterData } from '../../../services/geo-verification/geo-verification.service';
import * as L from 'leaflet';

// Fix default marker icon paths (if not already fixed globally, good to have it here)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

@Component({
  selector: 'app-disaster-monitor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './disaster-monitor.html',
  styleUrl: './disaster-monitor.css',
  encapsulation: ViewEncapsulation.None
})
export class DisasterMonitor implements OnInit {
  public disasterHistory: AmbeeDisasterData[] = [];
  public filteredDisasters: AmbeeDisasterData[] = [];
  public globalLoading = false;
  public globalError: string | null = null;
  public globalHistoryMap: L.Map | null = null;
  public globalDisasterLayer: L.LayerGroup | null = null;

  // Filter Data
  public availableTypes: string[] = [];
  public availableContinents: string[] = [];

  // Filter State
  public selectedTypes: { [key: string]: boolean } = {};
  public selectedContinents: { [key: string]: boolean } = {};
  public timeFilter: string = 'all'; // '24h', '7d', '30d', 'all'
  public sortBy: string = 'newest'; // 'newest', 'oldest'
  public searchQuery: string = '';

  // UI State
  public expandedSections = {
    type: true,
    location: true,
    time: true
  };

  public getEventTypeName(code: string): string {
    const mapping: Record<string, string> = {
      'TN': 'Tsunamis',
      'EQ': 'Earth Quake',
      'TC': 'Tropical Cyclones',
      'WF': 'Wildfires',
      'FL': 'Floods',
      'ET': 'Extreme Temperature',
      'DR': 'Droughts',
      'SW': 'Severe storms',
      'SI': 'Sea Ice',
      'VO': 'Volcano',
      'LS': 'Landslides',
      'Misc': 'Miscellaneous'
    };
    return mapping[code] ? `${code} - ${mapping[code]}` : code;
  }

  public getEventTypeColor(code: string): string {
    const mapping: Record<string, string> = {
      'TN': '#00BCD4', // Cyan
      'EQ': '#FF9800', // Orange
      'TC': '#009688', // Teal
      'WF': '#F44336', // Red
      'FL': '#2196F3', // Blue
      'ET': '#FFC107', // Amber
      'DR': '#FFA000', // Amber-Dark
      'SW': '#673AB7', // Deep Purple
      'SI': '#80DEEA', // Light Teal
      'VO': '#D32F2F', // Dark Red
      'LS': '#795548', // Brown
      'Misc': '#9E9E9E', // Grey
    };
    return mapping[code] || '#FF9500'; // Default Orange
  }

  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.fetchGlobalDisasterHistory();
  }

  fetchGlobalDisasterHistory() {
    this.globalLoading = true;
    this.globalError = null;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    fetch('https://gouthamdazler.app.n8n.cloud/webhook/disasters', { signal: controller.signal })
      .then(r => {
        clearTimeout(timeoutId);
        if (!r.ok) throw new Error(`HTTP Error: ${r.status}`);
        return r.json();
      })
      .then(res => {
        const data = Array.isArray(res) ? res[0] : res;
        const disasterList = data.disasters || data.data;

        if (disasterList && Array.isArray(disasterList)) {
          this.disasterHistory = disasterList;
          this.extractFilterOptions();
          this.applyFilters();
          this.initGlobalHistoryMap();
        } else {
          throw new Error('No disaster data found');
        }
        this.globalLoading = false;
        this.cdr.detectChanges();
      })
      .catch(err => {
        clearTimeout(timeoutId);
        this.globalError = err.name === 'AbortError' ? 'Timeout' : err.message;
        this.globalLoading = false;
        this.cdr.detectChanges();
      });
  }

  extractFilterOptions() {
    const types = new Set<string>();
    const continents = new Set<string>();

    this.disasterHistory.forEach(d => {
      if (d.event_type) types.add(d.event_type);
      if (d.continent) continents.add(d.continent);
    });

    this.availableTypes = Array.from(types).sort();
    this.availableContinents = Array.from(continents).sort();
  }

  toggleSection(section: 'type' | 'location' | 'time') {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  toggleType(type: string) {
    this.selectedTypes[type] = !this.selectedTypes[type];
    this.applyFilters();
  }

  toggleContinent(cont: string) {
    this.selectedContinents[cont] = !this.selectedContinents[cont];
    this.applyFilters();
  }

  setTimeFilter(filter: string) {
    this.timeFilter = filter;
    this.applyFilters();
  }

  onSearchChange() {
    this.applyFilters();
  }

  onSortChange(event: any) {
    this.sortBy = event.target.value;
    this.applyFilters();
  }

  clearAllFilters() {
    this.selectedTypes = {};
    this.selectedContinents = {};
    this.timeFilter = 'all';
    this.searchQuery = '';
    this.sortBy = 'newest';
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    const hasTypes = Object.values(this.selectedTypes).some(v => v);
    const hasContinents = Object.values(this.selectedContinents).some(v => v);
    return hasTypes || hasContinents || this.timeFilter !== 'all' || this.searchQuery.trim() !== '' || this.sortBy !== 'newest';
  }

  applyFilters() {
    const now = new Date().getTime();
    const msInDay = 24 * 60 * 60 * 1000;

    const activeTypes = Object.keys(this.selectedTypes).filter(k => this.selectedTypes[k]);
    const activeContinents = Object.keys(this.selectedContinents).filter(k => this.selectedContinents[k]);
    const query = this.searchQuery.toLowerCase().trim();

    this.filteredDisasters = this.disasterHistory.filter(d => {
      // Search Query Filter
      if (query) {
        const matchType = d.event_type?.toLowerCase().includes(query) || false;
        const matchId = d.event_id?.toLowerCase().includes(query) || false;
        if (!matchType && !matchId) return false;
      }

      // Type Filter
      if (activeTypes.length > 0) {
        if (!d.event_type || !activeTypes.includes(d.event_type)) return false;
      }

      // Continent Filter
      if (activeContinents.length > 0) {
        if (!d.continent || !activeContinents.includes(d.continent)) return false;
      }

      // Time Filter
      if (this.timeFilter !== 'all') {
        const eventDate = new Date(d.date).getTime();
        const diffDays = (now - eventDate) / msInDay;

        if (this.timeFilter === '24h' && diffDays > 1) return false;
        if (this.timeFilter === '7d' && diffDays > 7) return false;
        if (this.timeFilter === '30d' && diffDays > 30) return false;
      }

      return true;
    });

    // Sort
    this.filteredDisasters.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return this.sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    // Update map if it exists
    this.updateMapWithFilters();
  }

  private updateMapWithFilters() {
    if (!this.globalHistoryMap || !this.globalDisasterLayer) return;

    this.clearGlobalDisasterMarkers();

    if (this.filteredDisasters.length === 0) return;

    const bounds = L.latLngBounds([]);
    this.filteredDisasters.forEach((d: AmbeeDisasterData) => {
      bounds.extend([d.lat, d.lng]);
      this.createDisasterMarker(this.globalHistoryMap!, d);
    });

    if (bounds.isValid()) {
      this.globalHistoryMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
    }
  }

  private clearGlobalDisasterMarkers() {
    if (this.globalDisasterLayer) {
      this.globalDisasterLayer.clearLayers();
    }
  }

  private getDisasterPopupHtml(disaster: AmbeeDisasterData): string {
    const eventTime = new Date(disaster.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    const eventType = disaster.event_type ? this.getEventTypeName(disaster.event_type) : 'Disaster';

    return `
      <div class="disaster-popup-card">
        <div class="disaster-popup-header">
          <span class="disaster-popup-title">${eventType}</span>
          <span class="disaster-popup-date">${eventTime}</span>
        </div>
        <div class="disaster-popup-body">
          <div class="flex flex-col gap-1.5">
            <div class="flex justify-between items-center">
              <strong>Event ID</strong>
              <span>#${disaster.event_id?.substring(0, 12)}</span>
            </div>
            <div class="flex justify-between items-center">
              <strong>Coordinates</strong>
              <span>${disaster.lat.toFixed(4)}, ${disaster.lng.toFixed(4)}</span>
            </div>
            ${disaster.continent ? `
            <div class="flex justify-between items-center">
              <strong>Region</strong>
              <span>${disaster.continent}</span>
            </div>` : ''}
            ${disaster.estimated_end_date ? `
            <div class="flex justify-between items-center">
              <strong>Est. End</strong>
              <span>${new Date(disaster.estimated_end_date).toLocaleDateString()}</span>
            </div>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  private getDisasterTooltipHtml(disaster: AmbeeDisasterData): string {
    return `
      <div class="disaster-tooltip-card">
        <strong>${disaster.event_type ? this.getEventTypeName(disaster.event_type) : 'Disaster'}</strong><br/>
        ${new Date(disaster.date).toLocaleDateString()} • ${disaster.lat.toFixed(2)}, ${disaster.lng.toFixed(2)}
      </div>
    `;
  }

  private createDisasterMarker(map: L.Map, disaster: AmbeeDisasterData, layer?: L.LayerGroup) {
    const color = disaster.event_type ? this.getEventTypeColor(disaster.event_type) : '#FF9500';
    const marker = L.circleMarker([disaster.lat, disaster.lng], {
      radius: 8,
      fillColor: color,
      color: '#fff',
      weight: 1.5,
      opacity: 0.95,
      fillOpacity: 0.9
    });

    marker.addTo(layer ?? this.globalDisasterLayer ?? map);

    marker.bindPopup(this.getDisasterPopupHtml(disaster), {
      className: 'custom-popup disaster-popup-card',
      closeButton: false,
      minWidth: 260
    });

    marker.bindTooltip(this.getDisasterTooltipHtml(disaster), {
      className: 'disaster-tooltip',
      direction: 'top',
      offset: [0, -12],
      sticky: true,
      opacity: 0.95
    });

    marker.on('mouseover', () => marker.openPopup());
    marker.on('mouseout', () => marker.closePopup());

    return marker;
  }

  private initGlobalHistoryMap() {
    setTimeout(() => {
      const mapId = 'global-disaster-map';
      const el = document.getElementById(mapId);
      if (!el || !this.disasterHistory.length) return;

      if (this.globalHistoryMap) {
        this.globalHistoryMap.remove();
      }

      const map = L.map(mapId, {
        scrollWheelZoom: true,
        dragging: true,
        zoomControl: true,
      }).setView([20, 0], 2);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors &amp; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);

      this.globalDisasterLayer = L.layerGroup().addTo(map);
      this.globalHistoryMap = map;
      this.updateMapWithFilters();
    }, 100);
  }
}
