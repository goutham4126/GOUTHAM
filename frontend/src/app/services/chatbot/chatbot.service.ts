import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatMessage {
  text: string;
  isUser: boolean;
  timestamp: Date;
  isPlanSelection?: boolean;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  benefits: string;
  premiumAmount: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private http = inject(HttpClient);
  private apiUrl = 'https://localhost:7128/api/chatbot';

  getChatResponse(message: string, planId?: string): Observable<{ response: string }> {
    return this.http.post<{ response: string }>(`${this.apiUrl}/chat`, { message, planId });
  }

  getPlans(): Observable<Plan[]> {
    return this.http.get<Plan[]>(`${this.apiUrl}/bot-plans`);
  }
}
