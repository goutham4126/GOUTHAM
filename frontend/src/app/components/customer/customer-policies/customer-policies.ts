import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PolicyService } from '../../../services/policy';
import { PolicyDto } from '../../../models/policy/policy';

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
