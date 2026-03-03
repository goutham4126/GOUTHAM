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
    if (typeof sessionStorage !== 'undefined') {
      const userJson = sessionStorage.getItem('authUser');
      if (userJson) {
        try {
          const parsedUser = JSON.parse(userJson);
          if (parsedUser && parsedUser.token) {
            const decodedToken: any = jwtDecode(parsedUser.token);
            // Override any spoofed role with the real token payload
            // .NET default ClaimTypes.Role is usually a long schema URL
            // We check the standard shortname 'role' and the long schema URL
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
        if (typeof sessionStorage !== 'undefined') {
          // Decode immediately on login to ensure token validation works
          try {
            const decodedToken: any = jwtDecode(result.token);
            const actualRole = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decodedToken.role;
            result.role = actualRole;
          } catch (e) {
            console.error('Invalid token received on login');
          }
          sessionStorage.setItem('authUser', JSON.stringify(result));
        }
        this.currentUser.set(result);
      })
    );
  }

  public logout() {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('authUser');
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
