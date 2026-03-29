export interface RegisterDto {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    governmentId?: string;
    address?: string;
    dateOfBirth?: string; // ISO date string
    bankAccountNumber?: string;
    ifscCode?: string;
    isIfscVerified?: boolean;
    isBankAccountVerified?: boolean;
    profileImageBase64?: string;
}

export interface UpdateProfileDto {
    firstName: string;
    lastName: string;
    phone?: string | null;
    address?: string | null;
    governmentId?: string | null;
    dateOfBirth?: string | null;
    bankAccountNumber?: string | null;
    ifscCode?: string | null;
    isIfscVerified?: boolean;
    isBankAccountVerified?: boolean;
    profileImageBase64?: string;
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
    isDeleted?: boolean;
    governmentId?: string | null;
    address?: string | null;
    phone?: string | null;
    dateOfBirth?: string | null;
    bankAccountNumber?: string | null;
    ifscCode?: string | null;
    isIfscVerified?: boolean;
    isBankAccountVerified?: boolean;
    createdAt?: string | null;
    profileImageUrl?: string | null;
}

export interface UpdateRoleDto {
    role: string;
}
