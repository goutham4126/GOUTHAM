import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PlanService } from '../../../services/plan/plan';
import { PolicyRequestService } from '../../../services/policy-request/policy-request';
import { PlanDto } from '../../../models/policy/plan';
import { PolicyRequest } from '../../../models/policy-request/policy-request';
import { ToastService } from '../../../services/toast/toast';

@Component({
    selector: 'app-customer-plans',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './customer-plans.html'
})
export class CustomerPlans implements OnInit {
    private planService = inject(PlanService);
    private policyRequestService = inject(PolicyRequestService);
    private toastService = inject(ToastService);
    public router = inject(Router);
    private cdr = inject(ChangeDetectorRef);

    plans: PlanDto[] = [];
    loading = true;

    // Request Modal State
    selectedPlan: PlanDto | null = null;
    durationInMonths: number = 12;
    paymentFrequency: string = 'Monthly';
    isRequesting: boolean = false;
    panDocument: File | null = null;
    addressDocument: File | null = null;

    // Success Dialog State
    successDialogVisible = false;
    createdRequest: PolicyRequest | null = null;

    ngOnInit() {
        this.loading = true;
        this.planService.getAllPlans().subscribe({
            next: (data) => {
                this.plans = data;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    promptRequest(plan: PlanDto) {
        this.selectedPlan = plan;
        this.durationInMonths = 12;
        this.paymentFrequency = 'Monthly';
    }

    cancelRequest() {
        this.selectedPlan = null;
        this.panDocument = null;
        this.addressDocument = null;
    }

    /** Dynamically calculates risk score based on business rules */
    get riskScore(): number {
        if (!this.selectedPlan) return 0;

        let score = 5; // Base score

        // Plan Risk
        const planName = this.selectedPlan.planType.toLowerCase();
        if (planName.includes('disaster')) {
            score += 20;
        } else {
            score += 15; // Fallback for Casualty and others
        }

        // Duration Risk: Capped at 15
        score += Math.min(15, 1.2 * (this.durationInMonths / 12));

        // Payment Frequency Risk
        if (this.paymentFrequency === 'Monthly') score += 6;
        else if (this.paymentFrequency === 'Quarterly') score += 3;
        // Yearly is 0

        // Coverage Risk: Capped at 15
        score += Math.min(15, (this.computedCoverage / 500000) * 2);

        return Math.min(100, Math.floor(score));
    }

    /** Returns risk level details based on calculated score */
    get riskLevel(): { label: string, colorClass: string, bgClass: string, indicatorClass: string } {
        const score = this.riskScore;
        if (score <= 30) {
            return { label: 'Low Risk', colorClass: 'text-green-700', bgClass: 'bg-green-50 border-green-200', indicatorClass: 'bg-green-500' };
        } else if (score <= 55) {
            return { label: 'Moderate Risk', colorClass: 'text-yellow-700', bgClass: 'bg-yellow-50 border-yellow-200', indicatorClass: 'bg-yellow-500' };
        } else if (score <= 75) {
            return { label: 'High Risk', colorClass: 'text-orange-700', bgClass: 'bg-orange-50 border-orange-200', indicatorClass: 'bg-orange-500' };
        } else {
            return { label: 'Very High Risk', colorClass: 'text-red-700', bgClass: 'bg-red-50 border-red-200', indicatorClass: 'bg-red-600' };
        }
    }

    /** Calculates the installment amount based on frequency */
    get computedInstallmentAmount(): number {
        if (!this.selectedPlan) return 0;
        const base = this.selectedPlan.premiumAmount;
        if (this.paymentFrequency === 'Quarterly') return base * 3;
        if (this.paymentFrequency === 'Yearly') return base * 12;
        return base; // Monthly
    }

    /** Calculates projected coverage for the chosen duration */
    get computedCoverage(): number {
        if (!this.selectedPlan) return 0;
        const selectedMonths = this.durationInMonths;
        const planDefaultMonths = this.selectedPlan.durationInMonths > 0 ? this.selectedPlan.durationInMonths : selectedMonths;
        return this.selectedPlan.coverageAmount * (selectedMonths / planDefaultMonths);
    }

    get frequencyLabel(): string {
        return this.paymentFrequency === 'Monthly' ? 'month'
            : this.paymentFrequency === 'Quarterly' ? 'quarter'
                : 'year';
    }

    onFileChange(event: any, docType: 'pan' | 'address') {
        const file = event.target.files[0];
        if (file) {
            if (docType === 'pan') this.panDocument = file;
            else this.addressDocument = file;
        }
    }

    confirmRequest() {
        if (this.selectedPlan && this.durationInMonths > 0 && this.panDocument && this.addressDocument) {
            this.isRequesting = true;
            this.policyRequestService.createRequest(
                this.selectedPlan.id,
                this.durationInMonths,
                this.paymentFrequency,
                this.panDocument,
                this.addressDocument
            ).subscribe({
                next: (request: PolicyRequest) => {
                    this.createdRequest = request;
                    this.selectedPlan = null;
                    this.panDocument = null;
                    this.addressDocument = null;
                    this.isRequesting = false;
                    this.successDialogVisible = true;
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error(err);
                    this.isRequesting = false;
                    this.toastService.error('Failed to submit policy request. Please try again.');
                    this.cdr.detectChanges();
                }
            });
        } else {
            this.toastService.error('Please fill all required fields and upload documents.');
        }
    }

    closeSuccessDialog() {
        this.successDialogVisible = false;
        this.createdRequest = null;
        this.router.navigate(['/customer/my-policy-requests']);
    }
}
