import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class Auth {

  private apiUrl = 'https://localhost:7128/api';

  currentUser = signal<any | null>(null);
  isLoading = signal(false);

  constructor(private http: HttpClient, private router: Router) {}

  fetchCurrentUser() {
    const token = localStorage.getItem('token');
    if (!token) return;

    console.log(token);
    this.isLoading.set(true);

    this.http.get<any>(`${this.apiUrl}/users/current`)
      .subscribe({
        next: (user) => {
          this.currentUser.set(user);
          this.isLoading.set(false);
        },
        error: () => {
          this.logout();
        }
      });
  }

  login(email: string, password: string) {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, { email, password });
  }

  register(data: any) {
    return this.http.post<any>(`${this.apiUrl}/auth/register`, data);
  }

  logout() {
    localStorage.removeItem('token');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}