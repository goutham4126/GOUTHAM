import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PlanService } from '../../../services/plan';
import { PolicyService } from '../../../services/policy';
import { PlanDto } from '../../../models/policy/plan';

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
        this.paymentFrequency = plan.paymentFrequency;
    }

    cancelPurchase() {
        this.selectedPlan = null;
    }

    confirmPurchase() {
        if (this.selectedPlan && this.durationInYears > 0) {
            // Map string enum to numeric if backend requires, or send string
            // Assuming backend accepts string matching the enum name
            const request = {
                planId: this.selectedPlan.id,
                durationInYears: this.durationInYears,
                paymentFrequency: this.paymentFrequency === 'Monthly' ? 0 : (this.paymentFrequency === 'Quarterly' ? 1 : 2)
            };

            this.policyService.purchasePolicy(request).subscribe({
                next: () => {
                    alert('Policy purchased successfully!');
                    this.cancelPurchase();
                    this.router.navigate(['/customer/dashboard']);
                },
                error: (err) => {
                    console.error(err);
                    alert('Failed to purchase policy. Please try again.');
                }
            });
        }
    }
}
