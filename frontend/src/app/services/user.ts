import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UpdateRoleDto, UserDto } from '../models/auth/auth';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = 'https://localhost:7128/api/users';

    constructor(private http: HttpClient) { }

    public getMe(): Observable<UserDto> {
        return this.http.get<UserDto>(`${this.apiUrl}/me`);
    }

    public getAllUsers(): Observable<UserDto[]> {
        return this.http.get<UserDto[]>(this.apiUrl);
    }

    public updateUserRole(id: string, dto: UpdateRoleDto): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}/role`, dto);
    }
}
