import { Component, OnInit, inject, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClaimService } from '../../../services/claim/claim';
import { ClaimDto } from '../../../models/claim/claim';
import * as L from 'leaflet';

// Fix default marker icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const incidentIcon = L.divIcon({
  className: '',
  html: `
    <div class="pulse-marker">
      <div class="pulse-ring"></div>
      <div class="pulse-core"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -14],
});

@Component({
  selector: 'app-admin-claims',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
  templateUrl: './admin-claims.html',
  styleUrl: './admin-claims.css',
  encapsulation: ViewEncapsulation.None
})
export class AdminClaims implements OnInit {
  private claimService = inject(ClaimService);
  private cdr = inject(ChangeDetectorRef);

  claims: ClaimDto[] = [];
  loadingClaims = true;

  // Row Expansion State
  expandedClaimId: string | null = null;

  // Incident map instances for expanded claims
  private incidentMaps: Map<string, L.Map> = new Map();
  locationNames: Map<string, string> = new Map();

  ngOnInit() {
    this.loadClaims();
  }

  loadClaims() {
    this.loadingClaims = true;
    this.claimService.getAllClaims().subscribe({
      next: (data) => {
        this.claims = data;
        this.loadingClaims = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingClaims = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleExpand(claimId: string) {
    if (this.expandedClaimId === claimId) {
      this.destroyIncidentMap(claimId);
      this.expandedClaimId = null;
    } else {
      if (this.expandedClaimId) {
        this.destroyIncidentMap(this.expandedClaimId);
      }
      this.expandedClaimId = claimId;
      const claim = this.claims.find(c => c.id === claimId);
      if (claim?.incidentLatitude && claim?.incidentLongitude) {
        setTimeout(() => {
          this.initIncidentMap(claim);
        }, 150);
      }
    }
  }

  private async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (!response.ok) return 'Unknown location';
      const data = await response.json();
      const addr = data.address;
      if (!addr) return data.display_name || 'Unknown location';

      const parts: string[] = [];
      const place = addr.amenity || addr.building || addr.shop || addr.tourism || addr.leisure || '';
      const road = addr.road || addr.pedestrian || addr.footway || '';
      const neighbourhood = addr.neighbourhood || addr.suburb || addr.hamlet || '';
      const city = addr.city || addr.town || addr.village || addr.county || '';
      const state = addr.state || '';

      if (place) parts.push(place);
      if (road) parts.push(road);
      if (neighbourhood && neighbourhood !== road) parts.push(neighbourhood);
      if (city) parts.push(city);
      if (state && state !== city) parts.push(state);

      return parts.length > 0 ? parts.join(', ') : (data.display_name || 'Unknown location');
    } catch {
      return 'Unknown location';
    }
  }

  private async initIncidentMap(claim: ClaimDto) {
    const mapId = `admin-history-incident-map-${claim.id}`;
    const el = document.getElementById(mapId);
    if (!el || !claim.incidentLatitude || !claim.incidentLongitude) return;

    this.destroyIncidentMap(claim.id);

    const lat = claim.incidentLatitude;
    const lng = claim.incidentLongitude;

    const map = L.map(mapId, {
      scrollWheelZoom: true,
      dragging: true,
      zoomControl: true,
    }).setView([lat, lng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([lat, lng], { icon: incidentIcon }).addTo(map);

    this.incidentMaps.set(claim.id, map);

    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    const locationName = await this.reverseGeocode(lat, lng);
    this.locationNames.set(claim.id, locationName);

    marker.bindPopup(`
      <div class="map-popup-card">
        <div class="map-popup-header red">
          <span>Incident Location</span>
        </div>
        <div class="map-popup-body">
          <div class="map-popup-row map-popup-location"><span class="map-popup-place">${locationName}</span></div>
          <div class="map-popup-row"><span class="map-popup-label">Lat</span><span class="map-popup-value">${lat.toFixed(5)}</span></div>
          <div class="map-popup-row"><span class="map-popup-label">Lng</span><span class="map-popup-value">${lng.toFixed(5)}</span></div>
        </div>
      </div>
    `, { className: 'custom-popup', closeButton: false, minWidth: 220 }).openPopup();

    this.cdr.detectChanges();
  }

  private destroyIncidentMap(claimId: string) {
    const map = this.incidentMaps.get(claimId);
    if (map) {
      map.remove();
      this.incidentMaps.delete(claimId);
    }
  }

  async openDocument(url: string | undefined) {
    if (!url) {
      console.warn('No document URL provided');
      return;
    }
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      window.open(objectUrl, '_blank');
    } catch (error) {
      console.error('Error fetching document:', error);
      window.open(url, '_blank');
    }
  }
}

