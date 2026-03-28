import { Component, OnInit, inject, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PolicyService } from '../../../services/policy/policy';
import { PolicyDto } from '../../../models/policy/policy';
import { PolicyPaymentDto } from '../../../models/payment/payment';
import { ToastService } from '../../../services/toast/toast';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth/auth';

@Component({
  selector: 'app-customer-policies',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './customer-policies.html',
  styleUrl: './customer-policies.css',
  encapsulation: ViewEncapsulation.None
})
export class CustomerPolicies implements OnInit {
  private policyService = inject(PolicyService);
  private toastService = inject(ToastService);
  authService = inject(AuthService)
  private cdr = inject(ChangeDetectorRef);

  policies: PolicyDto[] = [];
  loadingPolicies = true;
  selectedPolicySummary: PolicyDto | null = null;
  selectedPolicyRiskScore: number = 0;
  originalBasePremium: number = 0;
  today: Date = new Date();

  get totalPolicies(): number {
    return this.policies.length;
  }

  get activePolicies(): number {
    return this.policies.filter(p => p.status === 'Active').length;
  }

  get totalPremiumPaid(): number {
    return this.policies.reduce((sum, p) => sum + (p.totalPaid || 0), 0);
  }

  ngOnInit() {
    this.loadPolicies();
  }

  loadPolicies() {
    this.loadingPolicies = true;
    this.policyService.getMyPolicies().subscribe({
      next: (data) => {
        this.policies = data;
        this.loadingPolicies = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingPolicies = false;
        this.cdr.detectChanges();
      }
    });
  }

  viewSummary(policy: PolicyDto) {
    this.selectedPolicySummary = policy;
    if (policy.planBasePremiumAmount && policy.plan.premiumAmount) {
      this.originalBasePremium = policy.plan.premiumAmount;
      const multiplier = policy.planBasePremiumAmount / policy.plan.premiumAmount;
      this.selectedPolicyRiskScore = Math.max(0, Math.round((multiplier - 1) * 100));
    } else {
      this.selectedPolicyRiskScore = 0;
      this.originalBasePremium = policy.plan?.premiumAmount || 0;
    }

    setTimeout(() => {
      document.getElementById('policy-summary-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  closeSummary() {
    this.selectedPolicySummary = null;
  }

  canPay(payment: PolicyPaymentDto, policy: PolicyDto): boolean {
    if (payment.status !== 'Pending') return false;

    // Must be due today or earlier
    const dueDate = new Date(payment.dueDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // end of current day
    if (dueDate > today) return false;

    // Must be the first pending payment in chronological order
    const nextPending = policy.payments
      .filter(p => p.status === 'Pending')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

    return nextPending?.id === payment.id;
  }

  payPremium(paymentId: string) {
    this.policyService.payPolicy(paymentId).subscribe({
      next: () => {
        this.toastService.success('Premium payment processed successfully!');
        this.loadPolicies();

        // Refresh the summary modal data if it's open
        if (this.selectedPolicySummary) {
          const updatedPolicy = this.policies.find(p => p.id === this.selectedPolicySummary!.id);
          if (updatedPolicy) {
            this.selectedPolicySummary = updatedPolicy;
          }
        }
      },
      error: (err) => {
        console.error(err);
        this.toastService.error('Failed to process payment');
      }
    });
  }
}
