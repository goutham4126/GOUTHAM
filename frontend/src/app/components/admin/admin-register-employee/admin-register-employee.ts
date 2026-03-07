import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../../services/user/user';
import { ToastService } from '../../../services/toast/toast';

@Component({
    selector: 'app-admin-register-employee',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './admin-register-employee.html',
    styleUrls: ['./admin-register-employee.css']
})
export class AdminRegisterEmployee implements OnInit {
    private fb = inject(FormBuilder);
    private route = inject(ActivatedRoute);
    private userService = inject(UserService);
    private toastService = inject(ToastService);
    private router = inject(Router);

    registerForm!: FormGroup;
    isSubmitting = false;
    role: 'Agent' | 'ClaimOfficer' = 'Agent';
    pageTitle = 'Employee Registration';

    ngOnInit(): void {
        const path = this.route.snapshot.routeConfig?.path;
        if (path === 'admin/register-agent') {
            this.role = 'Agent';
            this.pageTitle = 'Agent Registration';
        } else if (path === 'admin/register-claims-officer') {
            this.role = 'ClaimOfficer';
            this.pageTitle = 'Claims Officer Registration';
        }

        this.registerForm = this.fb.group({
            firstName: ['', [Validators.required, Validators.maxLength(50)]],
            lastName: ['', [Validators.required, Validators.maxLength(50)]],
            email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
            password: ['', [Validators.required, Validators.minLength(8)]],
            role: [this.role],
            governmentId: ['', [Validators.maxLength(50)]],
            phone: ['', [Validators.maxLength(15)]],
            address: ['', [Validators.maxLength(250)]],
            dateOfBirth: ['']
        });
    }

    onSubmit(): void {
        if (this.registerForm.invalid) {
            this.registerForm.markAllAsTouched();
            return;
        }

        this.isSubmitting = true;
        this.userService.registerEmployee(this.registerForm.value).subscribe({
            next: () => {
                this.toastService.success(`${this.role === 'Agent' ? 'Agent' : 'Claims Officer'} registered successfully!`);
                this.registerForm.reset({ role: this.role });
                this.isSubmitting = false;
                this.router.navigate(['/admin/users']);
            },
            error: (err: any) => {
                const message = err.error?.message || err.error || 'Failed to register employee';
                this.toastService.error(message);
                this.isSubmitting = false;
            }
        });
    }
}
