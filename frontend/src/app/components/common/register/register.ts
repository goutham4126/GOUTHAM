import { Component, inject, ChangeDetectorRef, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register implements OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('video') videoElementRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasElementRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  stream: MediaStream | null = null;
  capturedImage: string | null = null;
  cameraOpen = false;
  cameraError = '';

  maxDate: string;

  constructor() {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 18);
    this.maxDate = today.toISOString().split('T')[0];
  }

  ageValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const birthDate = new Date(control.value);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age < 18 ? { underAge: true } : null;
  }

  registerForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      ]
    ],
    password: ['', [Validators.required, Validators.minLength(8)]],
    governmentId: [''],
    bankAccountNumber: [''],
    ifscCode: [''],

    phone: [
      '',
      [
        Validators.pattern(/^[6-9]\d{9}$/)
      ]
    ],

    dateOfBirth: ['', this.ageValidator.bind(this)],
    address: ['']
  });

  showPassword = false;
  loading = false;
  error = '';

  onSubmit() {
    if (this.registerForm.invalid) return;

    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    const raw = this.registerForm.getRawValue();

    const payload = {
      ...raw,
      governmentId: raw.governmentId || undefined,
      bankAccountNumber: raw.bankAccountNumber || undefined,
      ifscCode: raw.ifscCode || undefined,
      phone: raw.phone ? `+91${raw.phone}` : undefined,
      dateOfBirth: raw.dateOfBirth || undefined,
      address: raw.address || undefined,
      profileImageBase64: this.capturedImage || undefined
    };

    this.authService.register(payload as any).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.error = typeof err.error === 'string' ? err.error
          : (err.error?.message || err.error?.title || 'Registration failed. Please try again.');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
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

    // Ensure video dimensions are loaded before capture
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