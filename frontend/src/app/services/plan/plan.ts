import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreatePlanDto, PlanDto } from '../../models/policy/plan';

@Injectable({
    providedIn: 'root'
})
export class PlanService {
    private apiUrl = 'https://localhost:7128/api/plans';

    constructor(private http: HttpClient) { }

    public getAllPlans(includeInactive: boolean = false): Observable<PlanDto[]> {
        return this.http.get<PlanDto[]>(`${this.apiUrl}?includeInactive=${includeInactive}`);
    }

    public getPlanById(id: string): Observable<PlanDto> {
        return this.http.get<PlanDto>(`${this.apiUrl}/${id}`);
    }

    public createPlan(dto: CreatePlanDto): Observable<PlanDto> {
        return this.http.post<PlanDto>(this.apiUrl, dto);
    }

    public updatePlan(id: string, dto: CreatePlanDto): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, dto);
    }

    public deletePlan(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
    }

    public resumePlan(id: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}/resume`, {}, { responseType: 'text' });
    }
}
