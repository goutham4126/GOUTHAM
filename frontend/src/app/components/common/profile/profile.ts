import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../services/user/user';
import { UpdateProfileDto, UserDto } from '../../../models/auth/auth';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [ReactiveFormsModule],
    templateUrl: './profile.html',
    styleUrl: './profile.css'
})
export class Profile implements OnInit, OnDestroy {
    private userService = inject(UserService);
    private cdr = inject(ChangeDetectorRef);
    private fb = inject(FormBuilder);

    @ViewChild('video') videoElementRef?: ElementRef<HTMLVideoElement>;
    @ViewChild('canvas') canvasElementRef?: ElementRef<HTMLCanvasElement>;
    @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

    stream: MediaStream | null = null;
    capturedImage: string | null = null;
    cameraOpen = false;
    cameraError = '';

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
        bankAccountNumber: [''],
        ifscCode: [''],
        dateOfBirth: ['']
    });

    // Verification states
    ifscStatus: 'idle' | 'verifying' | 'verified' | 'error' = 'idle';
    ifscDetails: any = null;
    ifscError: string = '';

    bankStatus: 'idle' | 'verifying' | 'verified' | 'error' = 'idle';
    bankDetails: any = null;
    bankError: string = '';

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
            bankAccountNumber: this.user.bankAccountNumber ?? '',
            ifscCode: this.user.ifscCode ?? '',
            dateOfBirth: this.user.dateOfBirth
                ? new Date(this.user.dateOfBirth).toISOString().substring(0, 10)
                : ''
        });
        this.saveError = null;
        this.saveSuccess = false;
        this.editMode = true;
        this.capturedImage = null;
        this.cameraOpen = false;
        this.cameraError = '';
        
        // Trigger initial verification if details exist
        if (this.user.ifscCode) {
            this.verifyIfsc();
        }
        this.cdr.detectChanges();
    }

    cancelEdit() {
        this.editMode = false;
        this.saveError = null;
        this.stopCamera();
        this.capturedImage = null;
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
            bankAccountNumber: raw.bankAccountNumber || null,
            ifscCode: raw.ifscCode || null,
            isIfscVerified: this.ifscStatus === 'verified',
            isBankAccountVerified: this.bankStatus === 'verified',
            dateOfBirth: raw.dateOfBirth || null,
            profileImageBase64: this.capturedImage || undefined
        };

        this.userService.updateMyProfile(dto).subscribe({
            next: (updated) => {
                this.user = updated;
                this.saving = false;
                this.saveSuccess = true;
                this.editMode = false;
                this.stopCamera();
                this.capturedImage = null;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.saveError = err?.error?.title || 'Failed to save. Please try again.';
                this.saving = false;
                this.cdr.detectChanges();
            }
        });
    }

    async verifyIfsc() {
        const ifsc = this.editForm.get('ifscCode')?.value;
        if (!ifsc || ifsc.length < 11) {
            this.ifscStatus = 'idle';
            this.ifscDetails = null;
            this.ifscError = '';
            this.bankStatus = 'idle';
            this.bankDetails = null;
            return;
        }

        this.ifscStatus = 'verifying';
        this.ifscError = '';
        this.cdr.detectChanges();

        try {
            const response = await fetch(`https://gouthamdazler.app.n8n.cloud/webhook/bank/verify?ifsc=${ifsc}`);
            const data = await response.json();
            
            if (data.success && data.ifsc_details) {
                this.ifscStatus = 'verified';
                this.ifscDetails = data.ifsc_details;
                // If bank account is also filled, trigger its verification automatically
                if (this.editForm.get('bankAccountNumber')?.value) {
                    this.verifyBankAccount();
                }
            } else {
                this.ifscStatus = 'error';
                this.ifscError = data.message || 'Invalid IFSC Code';
            }
        } catch (error) {
            this.ifscStatus = 'error';
            this.ifscError = 'Failed to verify IFSC Code';
        }
        this.cdr.detectChanges();
    }

    async verifyBankAccount() {
        const bankAccount = this.editForm.get('bankAccountNumber')?.value;
        const ifsc = this.editForm.get('ifscCode')?.value;

        if (!bankAccount || !ifsc || this.ifscStatus !== 'verified') {
            this.bankStatus = 'idle';
            this.bankDetails = null;
            this.bankError = '';
            return;
        }

        this.bankStatus = 'verifying';
        this.bankError = '';
        this.cdr.detectChanges();

        try {
            const response = await fetch(`https://gouthamdazler.app.n8n.cloud/webhook/bank/account/verify?ifsc=${ifsc}&account_number=${bankAccount}`);
            const data = await response.json();

            if (data.success && data.account_details && data.account_details.account_exists) {
                this.bankStatus = 'verified';
                this.bankDetails = data.account_details;
            } else {
                this.bankStatus = 'error';
                this.bankError = data.message || 'Bank account verification failed';
            }
        } catch (error) {
            this.bankStatus = 'error';
            this.bankError = 'Failed to verify bank account';
        }
        this.cdr.detectChanges();
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

    async toggleCamera() {
        if (this.cameraOpen) {
            this.stopCamera();
        } else {
            await this.startCamera();
        }
    }

    triggerFileUpload() {
        this.fileInputRef?.nativeElement.click();
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                this.capturedImage = reader.result as string;
                this.cdr.detectChanges();
            };
            reader.readAsDataURL(file);
        }
    }

    async startCamera() {
        this.cameraError = '';
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
            this.cameraOpen = true;
            this.cdr.detectChanges();

            if (this.videoElementRef?.nativeElement) {
                this.videoElementRef.nativeElement.srcObject = this.stream;
            }
        } catch (err) {
            this.cameraError = 'Could not access camera. Please check permissions.';
            console.error("Camera error", err);
        }
        this.cdr.detectChanges();
    }

    capturePhoto() {
        const video = this.videoElementRef?.nativeElement;
        const canvas = this.canvasElementRef?.nativeElement;

        if (!video || !canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        if (video.videoWidth === 0 || video.videoHeight === 0) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        this.capturedImage = canvas.toDataURL('image/jpeg');
        this.stopCamera();
    }

    retakePhoto() {
        this.capturedImage = null;
        this.startCamera();
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        this.cameraOpen = false;
        this.cdr.detectChanges();
    }

    ngOnDestroy() {
        this.stopCamera();
    }
}
