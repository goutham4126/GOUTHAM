import { Component, OnInit, inject, ChangeDetectorRef, AfterViewInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import * as L from 'leaflet';

import { ClaimService } from '../../../services/claim/claim';
import { PolicyService } from '../../../services/policy/policy';
import { ClaimDto } from '../../../models/claim/claim';
import { ToastService } from '../../../services/toast/toast';
import { PolicyDto } from '../../../models/policy/policy';
import { ENV_CONFIG } from '../../../utils/storage.constants';
import { VideoCallService } from '../../../services/video-call/video-call.service';
import { UserService } from '../../../services/user/user';

// Fix default marker icon paths (known webpack/angular issue)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Blue pulsing circle for current location
const currentLocationIcon = L.divIcon({
  className: '',
  html: `
    <div class="current-loc-marker">
      <div class="current-loc-ring"></div>
      <div class="current-loc-core"></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});

// Red marker for user-selected incident location
const incidentIcon = L.divIcon({
  className: '',
  html: `
    <div class="incident-marker">
      <div class="incident-pin"></div>
      <div class="incident-shadow"></div>
    </div>
  `,
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  popupAnchor: [0, -36],
});

@Component({
  selector: 'app-customer-claims',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './customer-claims.html',
  styleUrl: './customer-claims.css',
  encapsulation: ViewEncapsulation.None
})
export class CustomerClaims implements OnInit, AfterViewInit, OnDestroy {
  private claimService = inject(ClaimService);
  private policyService = inject(PolicyService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  public videoCallService = inject(VideoCallService);

  claims: ClaimDto[] = [];
  policies: PolicyDto[] = [];

  loadingClaims = true;
  loadingPolicies = true;
  isProcessingUpload = false;
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  // Map state
  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  private currentLocationMarker: L.Marker | null = null;
  selectedLatitude: number | null = null;
  selectedLongitude: number | null = null;
  selectedLocationName: string | null = null;
  currentLocationName: string | null = null;
  isLocating = false;
  locationError: string | null = null;
  maxDate: string = '';

  private userService = inject(UserService);
  bankStatus: 'idle' | 'verifying' | 'verified' | 'error' = 'idle';
  bankError: string = '';

  private fb = inject(FormBuilder);
  claimForm: FormGroup = this.fb.group({
    policyId: ['', Validators.required],
    reason: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(1)]],
    incidentLatitude: [null as number | null],
    incidentLongitude: [null as number | null],
    incidentDate: [null as string | null, [Validators.required, this.futureDateValidator()]]
  });

  private futureDateValidator() {
    return (control: any) => {
      if (!control.value) return null;
      // String comparison is safe for YYYY-MM-DD format
      return control.value > this.maxDate ? { futureDate: true } : null;
    };
  }

  isInvalid(controlName: string): boolean {
    const control = this.claimForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  isPolicyDropdownOpen = false;

  togglePolicyDropdown() {
    this.isPolicyDropdownOpen = !this.isPolicyDropdownOpen;
  }

  selectPolicy(policyId: string) {
    this.claimForm.patchValue({ policyId });
    this.isPolicyDropdownOpen = false;
  }

  get selectedPolicyName(): string {
    const policyId = this.claimForm.get('policyId')?.value;
    if (!policyId) return 'Select a policy to claim against...';
    const policy = this.availablePolicies.find(p => p.id === policyId);
    return policy ? `${policy.plan.name} (Policy #${policy.id.substring(0,8)})` : 'Select a policy to claim against...';
  }

  ngOnInit() {
    this.maxDate = new Date().toISOString().split('T')[0];
    this.loadPolicies();
    this.loadClaims();
    this.verifyUserBankDetails();
  }

  async verifyUserBankDetails() {
    this.bankStatus = 'verifying';
    this.cdr.detectChanges();

    this.userService.getMe().subscribe({
      next: async (user) => {
        if (!user.bankAccountNumber || !user.ifscCode) {
            this.bankStatus = 'error';
            this.bankError = 'Bank details are missing from your profile. Please update them to raise a claim.';
            this.cdr.detectChanges();
            return;
        }

        if (user.isIfscVerified && user.isBankAccountVerified) {
            this.bankStatus = 'verified';
        } else {
            this.bankStatus = 'error';
            this.bankError = 'Bank details are not verified. Please update and verify them in your profile.';
        }
        this.cdr.detectChanges();
      },
      error: () => {
         this.bankStatus = 'error';
         this.bankError = 'Failed to fetch user profile details.';
         this.cdr.detectChanges();
      }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => this.initMap(), 100);
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private initMap() {
    const mapEl = document.getElementById('claim-incident-map');
    if (!mapEl) return;

    this.map = L.map('claim-incident-map').setView([20.5937, 78.9629], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.setIncidentLocation(e.latlng.lat, e.latlng.lng);
    });

    // Auto-fetch current location
    this.fetchCurrentLocation();
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

      // Build a concise, precise location name
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

  private fetchCurrentLocation() {
    if (!navigator.geolocation || !this.map) return;

    this.isLocating = true;
    this.locationError = null;
    this.cdr.detectChanges();

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Reverse geocode the current location
        const locationName = await this.reverseGeocode(lat, lng);
        this.currentLocationName = locationName;

        if (this.map) {
          this.map.setView([lat, lng], 14);

          this.currentLocationMarker = L.marker([lat, lng], { icon: currentLocationIcon })
            .addTo(this.map)
            .bindPopup(`
              <div class="map-popup-card">
                <div class="map-popup-header blue">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                  <span>Your Location</span>
                </div>
                <div class="map-popup-body">
                  <div class="map-popup-row map-popup-location"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg><span class="map-popup-place">${locationName}</span></div>
                  <div class="map-popup-row"><span class="map-popup-label">Lat</span><span class="map-popup-value">${lat.toFixed(5)}</span></div>
                  <div class="map-popup-row"><span class="map-popup-label">Lng</span><span class="map-popup-value">${lng.toFixed(5)}</span></div>
                </div>
              </div>
            `, { className: 'custom-popup', closeButton: false, minWidth: 220 })
            .openPopup();
        }

        this.isLocating = false;
        this.cdr.detectChanges();
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        this.isLocating = false;
        this.locationError = 'Could not detect location. Please select manually.';
        this.cdr.detectChanges();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  private async setIncidentLocation(lat: number, lng: number) {
    this.selectedLatitude = lat;
    this.selectedLongitude = lng;
    this.selectedLocationName = null;
    this.claimForm.patchValue({
      incidentLatitude: lat,
      incidentLongitude: lng
    });

    if (this.marker && this.map) {
      this.marker.setLatLng([lat, lng]);
    } else if (this.map) {
      this.marker = L.marker([lat, lng], { icon: incidentIcon }).addTo(this.map);
    }

    // Show popup immediately with loading state
    this.marker?.bindPopup(`
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
    `, { className: 'custom-popup', closeButton: false, minWidth: 220 }).openPopup();

    this.cdr.detectChanges();

    // Reverse geocode and update popup
    const locationName = await this.reverseGeocode(lat, lng);
    this.selectedLocationName = locationName;

    this.marker?.bindPopup(`
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

  clearMapSelection() {
    if (this.marker && this.map) {
      this.map.removeLayer(this.marker);
      this.marker = null;
    }
    this.selectedLatitude = null;
    this.selectedLongitude = null;
    this.selectedLocationName = null;
    this.claimForm.patchValue({
      incidentLatitude: null,
      incidentLongitude: null
    });
    this.cdr.detectChanges();
  }

  loadPolicies() {
    this.loadingPolicies = true;
    this.policyService.getMyPolicies().subscribe({
      next: (data) => {
        this.policies = data.filter(p => p.status === 'Active');
        this.loadingPolicies = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingPolicies = false;
        this.cdr.detectChanges();
      }
    });
  }

  get availablePolicies(): PolicyDto[] {
    return this.policies.filter(p =>
      !this.claims.some(c => c.policyId === p.id && (c.status === 'Approved' || c.status === 'Pending'))
    );
  }

  loadClaims() {
    this.loadingClaims = true;
    this.claimService.getMyClaims().subscribe({
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

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      // Create image preview if it's an image
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagePreview = e.target.result;
          this.cdr.detectChanges();
        };
        reader.readAsDataURL(file);
      } else {
        this.imagePreview = null;
      }
      
      this.cdr.detectChanges();
    }
  }

  async computeFileHash(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return '0x' + hashHex;
  }

  async uploadToVercelBlob(file: File): Promise<string> {
    const fileName = encodeURIComponent(file.name);
    const response = await fetch(`https://blob.vercel-storage.com/claim_reports/${fileName}`, {
      method: 'PUT',
      headers: {
        'authorization': `Bearer ${ENV_CONFIG.VERCEL_BLOB_RW_TOKEN}`,
        'x-api-version': '7'
      },
      body: file
    });

    if (!response.ok) {
      throw new Error('Failed to upload to Vercel Blob.');
    }

    const data = await response.json();
    return data.url;
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

  async submitClaim() {
    if (this.claimForm.valid) {
      this.isProcessingUpload = true;
      this.cdr.detectChanges();

      let documentUrl = 'N/A';
      let documentHash = 'N/A';

      try {
        if (this.selectedFile) {
          console.log('Computing SHA-256 hash...');
          documentHash = await this.computeFileHash(this.selectedFile);

          console.log('Uploading to Vercel Blob...');
          documentUrl = await this.uploadToVercelBlob(this.selectedFile);
          console.log('Upload successful:', documentUrl);
        }
      } catch (error) {
        console.error('Error processing document upload:', error);
        this.toastService.error('Failed to upload document. Please try again.');
        this.isProcessingUpload = false;
        this.cdr.detectChanges();
        return;
      }

      const payload = {
        ...this.claimForm.value,
        documentUrl,
        documentHash
      };

      this.claimService.submitClaim(payload).subscribe({
        next: () => {
          this.loadClaims();
          this.claimForm.reset({ policyId: '', reason: '', amount: 0, incidentLatitude: null, incidentLongitude: null, incidentDate: null });
          this.selectedFile = null;
          this.clearMapSelection();
          this.isProcessingUpload = false;
          this.toastService.success('Claim submitted successfully. It is now Pending review.');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.isProcessingUpload = false;
          this.toastService.error('Failed to submit claim. Please check your inputs.');
          this.cdr.detectChanges();
        }
      });
    } else {
      this.toastService.warning('Please complete the required claim fields.');
    }
  }

  joinScheduledCall(claim: ClaimDto) {
    this.videoCallService.joinScheduledCall(claim.id);
    this.router.navigate(['/video-call', claim.id]);
  }
}
