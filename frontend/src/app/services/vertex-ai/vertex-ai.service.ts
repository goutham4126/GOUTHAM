import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface AiSummaryResponse {
  summary: string;
}

@Injectable({
  providedIn: 'root'
})
export class VertexAiService {
  private http = inject(HttpClient);
  private apiUrl = `https://localhost:7128/api/vertex-ai`;

  getClaimSummary(claimId: string): Observable<string> {
    return this.http.get<AiSummaryResponse>(`${this.apiUrl}/claims/${claimId}/summary`)
      .pipe(map(res => res.summary));
  }
}
