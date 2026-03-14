import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AmbeeDisasterData {
  date: string;
  lat: number;
  lng: number;
  continent: string;
  created_time: string;
  event_id: string;
  estimated_end_date: string;
  event_type: string;
}

export interface AmbeeHistoryResponse {
  message: string;
  data?: AmbeeDisasterData[];
  disasters?: AmbeeDisasterData[];
}

export interface VerificationResult {
  isVerified: boolean;
  confidenceScore: number;
  matchingDisasters: string[];
  nearbyClaimsCount: number;
  riskFlag: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeoVerificationService {
  private http = inject(HttpClient);
  private apiUrl = 'https://localhost:7128/api/geo-verification';

  getDisasterHistory(page: number = 1, limit: number = 30): Observable<AmbeeHistoryResponse> {
    return this.http.get<AmbeeHistoryResponse>(`${this.apiUrl}/history`, {
      params: { page, limit }
    });
  }

  verifyClaim(claimId: string): Observable<VerificationResult> {
    return this.http.get<VerificationResult>(`${this.apiUrl}/verify/${claimId}`);
  }
}
