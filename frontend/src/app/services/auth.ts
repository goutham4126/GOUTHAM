import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private apiUrl = 'https://localhost:7128/api';

  currentUser = signal<any>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  isLoggedIn = computed(() => !!this.currentUser());

 
  constructor(private http: HttpClient, private router: Router) {
    this.initializeUser();
  }

  initializeUser() {
    const token = localStorage.getItem('token');
    if (!token) return;

    this.http.get<any>(`${this.apiUrl}/users/current`).subscribe({
      next: (user) => this.currentUser.set(user),
      error: () => this.logout(),
    });
  }

  login(email: string, password: string){
    this.loading.set(true);
    this.error.set(null);

    return this.http.post<any>(`${this.apiUrl}/auth/login`, { email, password });
  }

  register(data: any){
    this.loading.set(true);
    this.error.set(null);

    return this.http.post<any>(`${this.apiUrl}/auth/register`, data);
  }

  saveToken(token: string) {
    localStorage.setItem('token', token);
  }

  setUser(user: any) {
    this.currentUser.set(user);
  }

  logout() {
    localStorage.removeItem('token');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}