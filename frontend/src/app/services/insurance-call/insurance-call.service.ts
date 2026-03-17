import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface InsuranceCallResponse {
    callId: string;
    status: string;
}

@Injectable({
    providedIn: 'root'
})
export class InsuranceCallService {
    private apiUrl = 'https://localhost:7128/api/insurance';

    constructor(private http: HttpClient) { }

    public initiateCall(): Observable<InsuranceCallResponse> {
        return this.http.post<InsuranceCallResponse>(`${this.apiUrl}/initiate-call`, {});
    }
}
