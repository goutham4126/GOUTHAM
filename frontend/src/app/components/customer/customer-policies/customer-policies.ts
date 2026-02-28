import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PolicyService } from '../../../services/policy';
import { PolicyDto } from '../../../models/policy/policy';
import { PolicyPaymentDto } from '../../../models/payment/payment';

@Component({
  selector: 'app-customer-policies',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-policies.html',
  styleUrl: './customer-policies.css'
})
export class CustomerPolicies implements OnInit {
  private policyService = inject(PolicyService);
  private cdr = inject(ChangeDetectorRef);

  policies: PolicyDto[] = [];
  loadingPolicies = true;
  selectedPolicySummary: PolicyDto | null = null;
  today: Date = new Date();

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
        alert('Premium payment processed successfully!');
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
        alert('Failed to process payment');
      }
    });
  }
}
