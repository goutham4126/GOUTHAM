import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PolicyRequestService } from '../../../services/policy-request/policy-request';
import { PolicyService } from '../../../services/policy/policy';
import { ToastService } from '../../../services/toast/toast';
import { PolicyRequest } from '../../../models/policy-request/policy-request';
import { AuthService } from '../../../services/auth/auth';

@Component({
    selector: 'app-customer-policy-requests',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './customer-policy-requests.html'
})
export class CustomerPolicyRequests implements OnInit {
    public policyRequestService = inject(PolicyRequestService);
    public policyService = inject(PolicyService);
    public authService = inject(AuthService);
    public toastService = inject(ToastService);
    private cdr = inject(ChangeDetectorRef);

    requests: PolicyRequest[] = [];
    loading = true;
    purchasingId: string | null = null;

    // Success Dialog Variables
    successDialogVisible = false;
    purchasedPolicyName: string | null = null;

    private router = inject(Router);

    ngOnInit() {
        this.loadRequests();
    }

    loadRequests() {
        this.loading = true;
        this.policyRequestService.getMyRequests().subscribe({
            next: (data) => {
                this.requests = data;
                this.loading = false;
                this.cdr.markForCheck();
            },
            error: (err) => {
                console.error('Error fetching policy requests', err);
                this.loading = false;
                this.cdr.markForCheck();
            }
        });
    }

    buyPolicy(req: PolicyRequest) {
        this.purchasingId = req.id;
        this.policyService.purchasePolicy(req.id).subscribe({
            next: () => {
                this.purchasedPolicyName = req.planName;
                this.successDialogVisible = true;

                this.purchasingId = null;
                this.cdr.markForCheck();
                this.loadRequests();
            },
            error: (err: any) => {
                console.error('Error purchasing policy', err);
                this.toastService.error('Failed to purchase policy. Please try again.');
                this.purchasingId = null;
                this.cdr.markForCheck();
            }
        });
    }

    closeSuccessDialog() {
        this.successDialogVisible = false;
        this.purchasedPolicyName = null;
        this.router.navigate(['/customer/policies']);
    }
}
