export interface RegisterDto {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    governmentId?: string;
    address?: string;
    phone?: string;
    dateOfBirth?: string; // ISO date string
}

export interface LoginDto {
    email: string;
    password?: string;
}

export interface AuthResultDto {
    userId: string;
    fullName: string;
    email: string;
    role: string;
    token: string;
}

export interface UserDto {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    isActive: boolean;
}

export interface UpdateRoleDto {
    role: string;
}
