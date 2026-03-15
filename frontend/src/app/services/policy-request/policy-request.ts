import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PolicyRequest } from '../../models/policy-request/policy-request';

@Injectable({
    providedIn: 'root'
})
export class PolicyRequestService {
    private apiUrl = 'https://localhost:7128/api/policy-requests';

    constructor(private http: HttpClient) { }

    public createRequest(planId: string, durationInMonths: number, paymentFrequency: string, panDocument: File, addressDocument: File, kycDetailsJson: string): Observable<PolicyRequest> {
        const formData = new FormData();
        formData.append('planId', planId);
        formData.append('durationInMonths', durationInMonths.toString());
        formData.append('paymentFrequency', paymentFrequency);
        formData.append('panDocument', panDocument);
        formData.append('addressDocument', addressDocument);
        formData.append('kycDetailsJson', kycDetailsJson);

        return this.http.post<PolicyRequest>(this.apiUrl, formData);
    }

    public getMyRequests(): Observable<PolicyRequest[]> {
        return this.http.get<PolicyRequest[]>(`${this.apiUrl}/my`);
    }

    public getAssignedRequests(): Observable<PolicyRequest[]> {
        return this.http.get<PolicyRequest[]>(`${this.apiUrl}/assigned`);
    }

    public approveRequest(requestId: string, remarks?: string): Observable<PolicyRequest> {
        return this.http.post<PolicyRequest>(`${this.apiUrl}/${requestId}/approve`, { remarks });
    }

    public rejectRequest(requestId: string, reason: string, remarks?: string): Observable<PolicyRequest> {
        return this.http.post<PolicyRequest>(`${this.apiUrl}/${requestId}/reject`, { reason, remarks });
    }
}
