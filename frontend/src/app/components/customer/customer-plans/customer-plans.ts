import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PlanService } from '../../../services/plan/plan';
import { PolicyService } from '../../../services/policy/policy';
import { PlanDto } from '../../../models/policy/plan';
import { PolicyDto } from '../../../models/policy/policy';
import { ToastService } from '../../../services/toast/toast';

@Component({
    selector: 'app-customer-plans',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './customer-plans.html'
})
export class CustomerPlans implements OnInit {
    private planService = inject(PlanService);
    private policyService = inject(PolicyService);
    private toastService = inject(ToastService);
    public router = inject(Router);
    private cdr = inject(ChangeDetectorRef);

    plans: PlanDto[] = [];
    loading = true;

    // Purchase Modal State
    selectedPlan: PlanDto | null = null;
    durationInYears: number = 1;
    paymentFrequency: string = 'Monthly';

    // Success Dialog State
    successDialogVisible = false;
    purchasedPolicy: PolicyDto | null = null;

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

    promptPurchase(plan: PlanDto) {
        this.selectedPlan = plan;
        this.durationInYears = 1;
        this.paymentFrequency = 'Monthly';
    }

    cancelPurchase() {
        this.selectedPlan = null;
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
        score += Math.min(15, 1.2 * this.durationInYears);

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
        const selectedMonths = this.durationInYears * 12;
        const planDefaultMonths = this.selectedPlan.durationInMonths > 0 ? this.selectedPlan.durationInMonths : selectedMonths;
        return this.selectedPlan.coverageAmount * (selectedMonths / planDefaultMonths);
    }

    get frequencyLabel(): string {
        return this.paymentFrequency === 'Monthly' ? 'month'
            : this.paymentFrequency === 'Quarterly' ? 'quarter'
                : 'year';
    }

    confirmPurchase() {
        if (this.selectedPlan && this.durationInYears > 0) {
            const request = {
                planId: this.selectedPlan.id,
                durationInYears: this.durationInYears,
                paymentFrequency: this.paymentFrequency === 'Monthly' ? 0
                    : (this.paymentFrequency === 'Quarterly' ? 1 : 2)
            };

            this.policyService.purchasePolicy(request).subscribe({
                next: (policy: PolicyDto) => {
                    this.purchasedPolicy = policy;
                    this.selectedPlan = null;
                    this.successDialogVisible = true;
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error(err);
                    this.toastService.error('Failed to purchase policy. Please try again.');
                }
            });
        }
    }

    closeSuccessDialog() {
        this.successDialogVisible = false;
        this.purchasedPolicy = null;
        this.router.navigate(['/customer/policies']);
    }

    /** Returns the first paid payment amount from the purchased policy */
    get firstInstallmentPaid(): number {
        return this.purchasedPolicy?.payments.find(p => p.status === 'Paid')?.amount ?? 0;
    }
}
