import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PolicyRequestService } from '../../../services/policy-request/policy-request';
import { PolicyService } from '../../../services/policy/policy';
import { ToastService } from '../../../services/toast/toast';
import { PolicyRequest } from '../../../models/policy-request/policy-request';
import { AuthService } from '../../../services/auth/auth';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

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
    private http = inject(HttpClient);

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
        const amount = req.finalPremiumAmount;

        this.http.post<{orderId: string}>('https://localhost:7128/api/payments/create-order', { amount }).subscribe({
            next: (orderData) => {
                const options = {
                    key: environment.razorpay_key_id,
                    amount: amount * 100,
                    currency: "INR",
                    name: "Insure",
                    description: `Healthcare Subscription for ₹${amount}`,
                    order_id: orderData.orderId,
                    handler: (response: any) => {
                        this.processPurchase(req);
                    },
                    prefill: {
                        name: this.authService.currentUser()?.role || '',
                        email: '', // You can add actual user email here if available in AuthResultDto
                        contact: "9160804126",
                    },
                    theme: {
                        color: "#6366f1", // primary color
                    },
                    modal: {
                        ondismiss: () => {
                            this.toastService.error('Payment cancelled');
                            this.purchasingId = null;
                            this.cdr.markForCheck();
                        }
                    }
                };

                const paymentObject = new (window as any).Razorpay(options);
                
                paymentObject.on("payment.failed", (response: any) => {
                    this.toastService.error(`Payment failed! ${response.error.description || 'Please try again.'}`);
                });

                paymentObject.open();
            },
            error: (err) => {
                console.error('Error creating order', err);
                this.toastService.error('Payment initialization failed. Please try again.');
                this.purchasingId = null;
                this.cdr.markForCheck();
            }
        });
    }

    processPurchase(req: PolicyRequest) {
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
