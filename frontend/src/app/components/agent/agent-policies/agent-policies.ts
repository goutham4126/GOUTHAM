import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { PolicyService } from '../../../services/policy/policy';
import { PolicyDto } from '../../../models/policy/policy';

@Component({
  selector: 'app-agent-policies',
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe],
  templateUrl: './agent-policies.html',
  styleUrl: './agent-policies.css'
})
export class AgentPolicies implements OnInit {
  private policyService = inject(PolicyService);
  private cdr = inject(ChangeDetectorRef);

  assignedPolicies: PolicyDto[] = [];
  loading = true;

  // Row Expansion State
  expandedPolicyId: string | null = null;

  ngOnInit() {
    this.loadPolicies();
  }

  loadPolicies() {
    this.loading = true;
    this.policyService.getAssignedPolicies().subscribe({
      next: (data) => {
        this.assignedPolicies = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get activePoliciesCount() {
    return this.assignedPolicies.filter(p => p.status === 'Active').length;
  }

  get totalValue() {
    return this.assignedPolicies.reduce((sum, p) => sum + p.totalPremium, 0);
  }

  toggleExpand(policyId: string) {
    if (this.expandedPolicyId === policyId) {
      this.expandedPolicyId = null;
    } else {
      this.expandedPolicyId = policyId;
    }
  }
}
