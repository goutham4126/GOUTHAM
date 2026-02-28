import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PolicyDto, PurchasePolicyRequest } from '../models/policy/policy';

@Injectable({
    providedIn: 'root'
})
export class PolicyService {
    private apiUrl = 'https://localhost:7128/api/policies';

    constructor(private http: HttpClient) { }

    public purchasePolicy(dto: PurchasePolicyRequest): Observable<PolicyDto> {
        return this.http.post<PolicyDto>(`${this.apiUrl}/purchase`, dto);
    }

    public getMyPolicies(): Observable<PolicyDto[]> {
        return this.http.get<PolicyDto[]>(`${this.apiUrl}/my`);
    }

    public getPolicyById(id: string): Observable<PolicyDto> {
        return this.http.get<PolicyDto>(`${this.apiUrl}/${id}`);
    }

    public getAssignedPolicies(): Observable<PolicyDto[]> {
        return this.http.get<PolicyDto[]>(`${this.apiUrl}/assigned`);
    }

    public getAllPolicies(): Observable<PolicyDto[]> {
        return this.http.get<PolicyDto[]>(`${this.apiUrl}/all`);
    }

    public payPolicy(paymentId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/pay/${paymentId}`, {}, { responseType: 'text' });
    }
}
