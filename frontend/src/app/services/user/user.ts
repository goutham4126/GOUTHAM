import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UpdateProfileDto, UpdateRoleDto, UserDto } from '../../models/auth/auth';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = 'https://localhost:7128/api/users';

    constructor(private http: HttpClient) { }

    public getMe(): Observable<UserDto> {
        return this.http.get<UserDto>(`${this.apiUrl}/me`);
    }

    public updateMyProfile(dto: UpdateProfileDto): Observable<UserDto> {
        return this.http.put<UserDto>(`${this.apiUrl}/me`, dto);
    }

    public getAllUsers(): Observable<UserDto[]> {
        return this.http.get<UserDto[]>(this.apiUrl);
    }

    public registerEmployee(dto: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/register`, dto);
    }

    public updateUserRole(id: string, dto: UpdateRoleDto): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}/role`, dto);
    }

    public deactivateUser(id: string): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${id}/deactivate`, {}, { responseType: 'text' });
    }

    public resumeUser(id: string): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${id}/resume`, {}, { responseType: 'text' });
    }
}
