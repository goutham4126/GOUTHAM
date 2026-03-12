import { Component, OnInit, inject, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ClaimService } from '../../../services/claim/claim';
import { ClaimDto } from '../../../models/claim/claim';
import { ToastService } from '../../../services/toast/toast';
import { VideoCallService } from '../../../services/video-call/video-call.service';
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
  selector: 'app-claims-officer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
  templateUrl: './claims-officer-dashboard.html',
  styleUrl: './claims-officer-dashboard.css',
  encapsulation: ViewEncapsulation.None
})
export class ClaimsOfficerDashboard implements OnInit {
  private claimService = inject(ClaimService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  public videoCallService = inject(VideoCallService);
  private router = inject(Router);

  assignedClaims: ClaimDto[] = [];
  loading = true;

  // Approval Modal State
  selectedClaimId: string | null = null;
  approvalAmount: number = 0;
  approvalRemarks: string = '';

  // Rejection Modal State
  selectedRejectClaimId: string | null = null;
  rejectionRemarks: string = '';
  isRejecting = false;

  // Success Dialog State
  successDialogVisible = false;
  approvedClaimAmount: number = 0;
  approvedClaimId: string | null = null;

  // Row Expansion State
  expandedClaimId: string | null = null;

  isApproving = false;


  // Incident map instances for expanded claims
  private incidentMaps: Map<string, L.Map> = new Map();
  locationNames: Map<string, string> = new Map();

  toggleExpand(claimId: string) {
    // Clean up previous map if collapsing
    if (this.expandedClaimId === claimId) {
      this.destroyIncidentMap(claimId);
      this.expandedClaimId = null;
    } else {
      // Clean up old expanded map
      if (this.expandedClaimId) {
        this.destroyIncidentMap(this.expandedClaimId);
      }
      this.expandedClaimId = claimId;
      // Initialize map after DOM renders
      const claim = this.assignedClaims.find(c => c.id === claimId);
      if (claim?.incidentLatitude && claim?.incidentLongitude) {
        setTimeout(() => this.initIncidentMap(claim), 150);
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
    const mapId = `officer-incident-map-${claim.id}`;
    const el = document.getElementById(mapId);
    if (!el || !claim.incidentLatitude || !claim.incidentLongitude) return;

    // Destroy existing map on this element if any
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

    const marker = L.marker([lat, lng], { icon: incidentIcon })
      .addTo(map)
      .bindPopup(`
        <div class="map-popup-card">
          <div class="map-popup-header red">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <span>Incident Location</span>
          </div>
          <div class="map-popup-body">
            <div class="map-popup-row map-popup-location"><svg class="map-popup-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.07-5.07l-2.83 2.83M9.76 14.24l-2.83 2.83m11.14 0l-2.83-2.83M9.76 9.76L6.93 6.93"/></svg><span class="map-popup-place loading">Resolving location...</span></div>
            <div class="map-popup-row"><span class="map-popup-label">Lat</span><span class="map-popup-value">${lat.toFixed(5)}</span></div>
            <div class="map-popup-row"><span class="map-popup-label">Lng</span><span class="map-popup-value">${lng.toFixed(5)}</span></div>
          </div>
        </div>
      `, { className: 'custom-popup', closeButton: false, minWidth: 220 })
      .openPopup();

    this.incidentMaps.set(claim.id, map);

    // Reverse geocode and update popup + header
    const locationName = await this.reverseGeocode(lat, lng);
    this.locationNames.set(claim.id, locationName);

    marker.bindPopup(`
      <div class="map-popup-card">
        <div class="map-popup-header red">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          <span>Incident Location</span>
        </div>
        <div class="map-popup-body">
          <div class="map-popup-row map-popup-location"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg><span class="map-popup-place">${locationName}</span></div>
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

  ngOnInit() {
    this.loadClaims();
  }

  loadClaims() {
    this.loading = true;
    this.claimService.getAssignedClaims().subscribe({
      next: (data) => {
        this.assignedClaims = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  promptApprove(claim: ClaimDto) {
    this.selectedClaimId = claim.id;
    this.approvalAmount = claim.claimAmount;
    this.approvalRemarks = '';
  }

  cancelApprove() {
    this.selectedClaimId = null;
    this.approvalAmount = 0;
    this.approvalRemarks = '';
  }

  confirmApprove() {
    if (this.selectedClaimId && this.approvalAmount >= 0) {
      this.isApproving = true;

      const reqId = this.selectedClaimId;
      const reqAmount = this.approvalAmount;
      const reqRemarks = this.approvalRemarks;

      this.claimService.approveClaim(reqId, {
        approvedAmount: reqAmount,
        notes: 'Approved via Evaluation Desk',
        remarks: reqRemarks
      }).subscribe({
        next: () => {
          this.approvedClaimAmount = reqAmount;
          this.approvedClaimId = reqId;
          this.isApproving = false;
          this.successDialogVisible = true;
          this.cancelApprove();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.toastService.error('Failed to approve claim');
          this.isApproving = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  closeSuccessDialog() {
    this.successDialogVisible = false;
    this.approvedClaimId = null;
    this.approvedClaimAmount = 0;
    this.loadClaims();
  }

  promptReject(id: string) {
    this.selectedRejectClaimId = id;
    this.rejectionRemarks = '';
  }

  cancelReject() {
    this.selectedRejectClaimId = null;
    this.rejectionRemarks = '';
  }

  confirmReject() {
    if (this.selectedRejectClaimId) {
      this.isRejecting = true;
      const reqId = this.selectedRejectClaimId;
      const reqRemarks = this.rejectionRemarks;

      this.claimService.rejectClaim(reqId, { remarks: reqRemarks }).subscribe({
        next: () => {
          this.toastService.success('Claim rejected successfully');
          this.isRejecting = false;
          this.selectedRejectClaimId = null;
          this.loadClaims();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.toastService.error('Failed to reject claim');
          this.isRejecting = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  // Schedule Call Modal State
  selectedScheduleClaimId: string | null = null;
  scheduleDateTime: string = '';
  isScheduling = false;

  promptSchedule(claimId: string) {
    this.selectedScheduleClaimId = claimId;
    // Default to tomorrow at 10:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    this.scheduleDateTime = tomorrow.toISOString().slice(0, 16);
  }

  cancelSchedule() {
    this.selectedScheduleClaimId = null;
    this.scheduleDateTime = '';
  }

  confirmSchedule() {
    if (!this.selectedScheduleClaimId || !this.scheduleDateTime) return;
    this.isScheduling = true;
    this.claimService.scheduleCall(this.selectedScheduleClaimId, this.scheduleDateTime).subscribe({
      next: () => {
        this.toastService.success('Video call scheduled successfully!');
        this.isScheduling = false;
        this.cancelSchedule();
        this.loadClaims();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.toastService.error('Failed to schedule call');
        this.isScheduling = false;
        this.cdr.detectChanges();
      }
    });
  }
  // Complete Verification Modal State
  selectedVerifyClaimId: string | null = null;
  verificationRemarks: string = '';
  isCompletingVerification = false;

  promptCompleteVerification(claimId: string) {
    this.selectedVerifyClaimId = claimId;
    this.verificationRemarks = '';
  }

  cancelCompleteVerification() {
    this.selectedVerifyClaimId = null;
    this.verificationRemarks = '';
  }

  confirmCompleteVerification() {
    if (!this.selectedVerifyClaimId) return;
    this.isCompletingVerification = true;
    this.claimService.completeVerification(this.selectedVerifyClaimId, this.verificationRemarks || undefined).subscribe({
      next: () => {
        this.toastService.success('Video verification marked as completed!');
        this.isCompletingVerification = false;
        this.cancelCompleteVerification();
        this.loadClaims();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.toastService.error('Failed to complete verification');
        this.isCompletingVerification = false;
        this.cdr.detectChanges();
      }
    });
  }

  initiateVideoCall(claim: ClaimDto) {
    this.videoCallService.initiateCall(claim.id);
    this.router.navigate(['/video-call', claim.id]);
  }

  joinScheduledCall(claim: ClaimDto) {
    this.videoCallService.joinScheduledCall(claim.id);
    this.router.navigate(['/video-call', claim.id]);
  }
}
