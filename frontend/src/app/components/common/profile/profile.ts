import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../services/user';
import { UpdateProfileDto, UserDto } from '../../../models/auth/auth';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './profile.html',
    styleUrl: './profile.css'
})
export class Profile implements OnInit {
    private userService = inject(UserService);
    private cdr = inject(ChangeDetectorRef);
    private fb = inject(FormBuilder);

    user: UserDto | null = null;
    loading = true;
    error: string | null = null;

    // Edit mode
    editMode = false;
    saving = false;
    saveError: string | null = null;
    saveSuccess = false;

    editForm = this.fb.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        phone: [''],
        address: [''],
        governmentId: [''],
        dateOfBirth: ['']
    });

    ngOnInit() {
        this.userService.getMe().subscribe({
            next: (data) => {
                this.user = data;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.error = 'Failed to load profile. Please try again.';
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    openEdit() {
        if (!this.user) return;
        this.editForm.patchValue({
            firstName: this.user.firstName,
            lastName: this.user.lastName,
            phone: this.user.phone ?? '',
            address: this.user.address ?? '',
            governmentId: this.user.governmentId ?? '',
            dateOfBirth: this.user.dateOfBirth
                ? new Date(this.user.dateOfBirth).toISOString().substring(0, 10)
                : ''
        });
        this.saveError = null;
        this.saveSuccess = false;
        this.editMode = true;
        this.cdr.detectChanges();
    }

    cancelEdit() {
        this.editMode = false;
        this.saveError = null;
        this.cdr.detectChanges();
    }

    saveProfile() {
        if (this.editForm.invalid) return;
        this.saving = true;
        this.saveError = null;
        this.saveSuccess = false;

        const raw = this.editForm.getRawValue();
        const dto: UpdateProfileDto = {
            firstName: raw.firstName!,
            lastName: raw.lastName!,
            phone: raw.phone || null,
            address: raw.address || null,
            governmentId: raw.governmentId || null,
            dateOfBirth: raw.dateOfBirth || null
        };

        this.userService.updateMyProfile(dto).subscribe({
            next: (updated) => {
                this.user = updated;
                this.saving = false;
                this.saveSuccess = true;
                this.editMode = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.saveError = err?.error?.title || 'Failed to save. Please try again.';
                this.saving = false;
                this.cdr.detectChanges();
            }
        });
    }

    getInitials(): string {
        if (!this.user) return '?';
        const first = this.user.firstName?.charAt(0) ?? '';
        const last = this.user.lastName?.charAt(0) ?? '';
        return (first + last).toUpperCase();
    }

    formatDate(dateStr: string | null | undefined): string {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '—';
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
}
