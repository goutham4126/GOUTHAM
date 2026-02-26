import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class User {
  private apiUrl = 'https://localhost:7128/api';

  constructor(private http: HttpClient) {}

  getCurrentUser() {
    return this.http.get<any>(`${this.apiUrl}/users/current`);
  }
}