import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})

export class Auth {
  constructor(private http: HttpClient) {}

  currentUser = signal<any>(null);

  loadUserFromToken() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const decoded: any = jwtDecode(token);

    this.currentUser.set({
      id: decoded.nameId,
      email: decoded.email,
      role: decoded.role
    });
  }

  login(email: string, password: string) {
    return this.http.post<any>("https://localhost:7055/api/auth/login", {email,password});
  }

  register(userData: any) {
    return this.http.post<any>("https://localhost:7055/api/auth/register", userData);
  }

  logout() {
    localStorage.removeItem('token');
    this.currentUser.set(null);
  }
  
}