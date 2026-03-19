import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApproveClaimRequest, ClaimDto, CreateClaimRequest, RejectClaimRequest, AddClaimTrackingRequest } from '../../models/claim/claim';

@Injectable({
    providedIn: 'root'
})
export class ClaimService {
    private apiUrl = 'https://localhost:7128/api/claims';

    constructor(private http: HttpClient) { }

    public submitClaim(dto: CreateClaimRequest): Observable<ClaimDto> {
        return this.http.post<ClaimDto>(this.apiUrl, dto);
    }

    public getMyClaims(): Observable<ClaimDto[]> {
        return this.http.get<ClaimDto[]>(`${this.apiUrl}/my`);
    }

    public getAllClaims(): Observable<ClaimDto[]> {
        return this.http.get<ClaimDto[]>(this.apiUrl);
    }

    public getAssignedClaims(): Observable<ClaimDto[]> {
        return this.http.get<ClaimDto[]>(`${this.apiUrl}/assigned`);
    }

    public approveClaim(id: string, dto: ApproveClaimRequest): Observable<any> {
        return this.http.post(`${this.apiUrl}/${id}/approve`, dto, { responseType: 'text' });
    }

    public rejectClaim(id: string, dto: RejectClaimRequest): Observable<any> {
        return this.http.post(`${this.apiUrl}/${id}/reject`, dto, { responseType: 'text' });
    }

    public scheduleCall(claimId: string, scheduledDate: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/${claimId}/schedule`, { scheduledDate }, { responseType: 'text' });
    }

    public completeVerification(claimId: string, remarks?: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/${claimId}/complete-verification`, { remarks }, { responseType: 'text' });
    }

    public addTrackingStage(claimId: string, dto: AddClaimTrackingRequest): Observable<any> {
        return this.http.post(`${this.apiUrl}/${claimId}/tracking`, dto);
    }
}
