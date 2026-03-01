import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UpdateProfileDto, UpdateRoleDto, UserDto } from '../models/auth/auth';

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

    public updateUserRole(id: string, dto: UpdateRoleDto): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}/role`, dto);
    }

    public deleteUser(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
    }
}
