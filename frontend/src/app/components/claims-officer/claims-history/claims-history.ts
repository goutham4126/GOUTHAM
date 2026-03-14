import { Component, OnInit, inject, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ClaimService } from '../../../services/claim/claim';
import { ClaimDto } from '../../../models/claim/claim';
import { VideoCallService } from '../../../services/video-call/video-call.service';
import { GeoVerificationService, VerificationResult, AmbeeDisasterData } from '../../../services/geo-verification/geo-verification.service';
import { Router } from '@angular/router';
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
  selector: 'app-claims-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
  templateUrl: './claims-history.html',
  styleUrl: './claims-history.css',
  encapsulation: ViewEncapsulation.None
})
export class ClaimsHistory implements OnInit {
  public disasterHistory: AmbeeDisasterData[] = [];
  public verificationResults: Map<string, VerificationResult> = new Map();
  public isVerifying: Map<string, boolean> = new Map();
  private historyDisasterLayers: Map<string, L.LayerGroup> = new Map();

  private claimService = inject(ClaimService);
  private cdr = inject(ChangeDetectorRef);
  public videoCallService = inject(VideoCallService);
  private geoVerificationService = inject(GeoVerificationService);
  private router = inject(Router);

  assignedClaims: ClaimDto[] = [];
  loading = true;

  // Row Expansion State
  expandedClaimId: string | null = null;

  // Incident map instances for expanded claims
  private incidentMaps: Map<string, L.Map> = new Map();
  private historyMaps: Map<string, L.Map> = new Map();
  locationNames: Map<string, string> = new Map();

  ngOnInit() {
    this.loadClaims();
    this.fetchGlobalDisasterHistoryLight();
  }

  get historyClaims(): ClaimDto[] {
    return this.assignedClaims.filter(c => c.status !== 'Pending');
  }

  loadClaims() {
    this.loading = true;
    this.claimService.getAssignedClaims().subscribe({
      next: (data) => {
        this.assignedClaims = data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading claims:', err);
        this.assignedClaims = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  fetchGlobalDisasterHistoryLight() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    fetch('https://goutham4126.app.n8n.cloud/webhook/disasters', { signal: controller.signal })
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
          if (this.expandedClaimId) {
            this.updateHistoryMap(this.expandedClaimId);
          }
        }
      })
      .catch(err => {
        clearTimeout(timeoutId);
        console.error('Error fetching global disasters:', err);
      });
  }

  toggleExpand(claimId: string) {
    if (this.expandedClaimId === claimId) {
      this.destroyIncidentMap(claimId);
      this.destroyHistoryMap(claimId);
      this.expandedClaimId = null;
    } else {
      if (this.expandedClaimId) {
        this.destroyIncidentMap(this.expandedClaimId);
        this.destroyHistoryMap(this.expandedClaimId);
      }
      this.expandedClaimId = claimId;
      const claim = this.assignedClaims.find(c => c.id === claimId);
      if (claim?.incidentLatitude && claim?.incidentLongitude) {
        setTimeout(() => {
          this.initIncidentMap(claim);
          this.fetchVerificationDetails(claim);
          this.initHistoryMap(claim);
        }, 150);
      }
    }
  }

  fetchVerificationDetails(claim: ClaimDto) {
    this.isVerifying.set(claim.id, true);
    this.geoVerificationService.verifyClaim(claim.id).subscribe({
      next: (res) => {
        if (res) {
          this.verificationResults.set(claim.id, res);
        }
        this.isVerifying.set(claim.id, false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error verifying claim:', err);
        this.isVerifying.set(claim.id, false);
        this.cdr.detectChanges();
      }
    });

    if (this.disasterHistory.length > 0) {
      this.updateHistoryMap(claim.id);
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
    const mapId = `officer-history-incident-map-${claim.id}`;
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

  private initHistoryMap(claim: ClaimDto) {
    const mapId = `officer-history-archive-map-${claim.id}`;
    const el = document.getElementById(mapId);
    if (!el || !claim.incidentLatitude || !claim.incidentLongitude) return;

    this.destroyHistoryMap(claim.id);

    const lat = claim.incidentLatitude;
    const lng = claim.incidentLongitude;

    const map = L.map(mapId, {
      scrollWheelZoom: true,
      dragging: true,
      zoomControl: true,
    }).setView([lat, lng], 10);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors &amp; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    const historyLayer = L.layerGroup().addTo(map);
    this.historyDisasterLayers.set(claim.id, historyLayer);

    L.circleMarker([lat, lng], {
      radius: 8,
      fillColor: '#FF3B30',
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    }).addTo(map).bindPopup('<b>Current Incident</b>');

    this.historyMaps.set(claim.id, map);
    this.updateHistoryMap(claim.id);
  }

  private updateHistoryMap(claimId: string) {
    const map = this.historyMaps.get(claimId);
    const historyLayer = this.historyDisasterLayers.get(claimId);
    if (!map || !historyLayer || !this.disasterHistory || this.disasterHistory.length === 0) return;

    historyLayer.clearLayers();

    const bounds = L.latLngBounds([]);
    const claim = this.assignedClaims.find(c => c.id === claimId);
    if (claim && claim.incidentLatitude && claim.incidentLongitude) {
      bounds.extend([claim.incidentLatitude, claim.incidentLongitude]);
    }

    this.disasterHistory.forEach((d: AmbeeDisasterData) => {
      bounds.extend([d.lat, d.lng]);
      this.createDisasterMarker(map, d, historyLayer);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }

  private destroyHistoryMap(claimId: string) {
    const map = this.historyMaps.get(claimId);
    if (map) {
      map.remove();
      this.historyMaps.delete(claimId);
    }
  }

  private createDisasterMarker(map: L.Map, disaster: AmbeeDisasterData, layer?: L.LayerGroup) {
    const marker = L.circleMarker([disaster.lat, disaster.lng], {
      radius: 8,
      fillColor: '#FF9500',
      color: '#fff',
      weight: 1.5,
      opacity: 0.95,
      fillOpacity: 0.9
    });

    marker.addTo(layer ?? map);
    return marker;
  }

  async openDocument(url: string) {
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
