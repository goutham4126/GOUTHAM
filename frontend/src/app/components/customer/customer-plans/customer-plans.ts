import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PlanService } from '../../../services/plan';
import { PolicyService } from '../../../services/policy';
import { PlanDto } from '../../../models/policy/plan';
import { PolicyDto } from '../../../models/policy/policy';

@Component({
    selector: 'app-customer-plans',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './customer-plans.html'
})
export class CustomerPlans implements OnInit {
    private planService = inject(PlanService);
    private policyService = inject(PolicyService);
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

    /** Calculates the installment amount based on frequency */
    get computedInstallmentAmount(): number {
        if (!this.selectedPlan) return 0;
        const base = this.selectedPlan.premiumAmount;
        if (this.paymentFrequency === 'Quarterly') return base * 3;
        if (this.paymentFrequency === 'Yearly') return base * 12;
        return base; // Monthly
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
                    alert('Failed to purchase policy. Please try again.');
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
