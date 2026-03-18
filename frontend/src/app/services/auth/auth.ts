import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthResultDto, LoginDto, RegisterDto } from '../../models/auth/auth';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://localhost:7128/api/auth';

  // Expose state via signals
  public currentUser = signal<AuthResultDto | null>(null);

  constructor(private http: HttpClient) {
    this.loadTokenFromStorage();
  }

  private loadTokenFromStorage() {
    if (typeof localStorage !== 'undefined') {
      const userJson = localStorage.getItem('authUser');
      if (userJson) {
        try {
          const parsedUser = JSON.parse(userJson);
          if (parsedUser && parsedUser.token) {
            const decodedToken: any = jwtDecode(parsedUser.token);
            const actualRole = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decodedToken.role;

            parsedUser.role = actualRole;
            this.currentUser.set(parsedUser);
          } else {
            this.currentUser.set(null);
          }
        } catch (e) {
          console.error('Failed to parse stored auth token', e);
          this.currentUser.set(null);
        }
      }
    }
  }

  public register(dto: RegisterDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, dto);
  }

  public login(dto: LoginDto): Observable<AuthResultDto> {
    return this.http.post<AuthResultDto>(`${this.apiUrl}/login`, dto).pipe(
      tap(result => {
        if (typeof localStorage !== 'undefined') {
          try {
            const decodedToken: any = jwtDecode(result.token);
            const actualRole = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decodedToken.role;
            result.role = actualRole;
          } catch (e) {
            console.error('Invalid token received on login');
          }
          localStorage.setItem('authUser', JSON.stringify(result));
        }
        this.currentUser.set(result);
      })
    );
  }

  public logout() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('authUser');
    }
    this.currentUser.set(null);
  }

  public isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  public getToken(): string | null {
    return this.currentUser()?.token || null;
  }

  public getRole(): string | null {
    return this.currentUser()?.role || null;
  }
}
