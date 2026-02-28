import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PolicyService } from '../../../services/policy';
import { PolicyDto } from '../../../models/policy/policy';

interface DerivedCustomer {
  customerName: string;
  totalPolicies: number;
  activePolicies: number;
  totalPremiumGenerated: number;
}

@Component({
  selector: 'app-agent-customers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agent-customers.html',
  styleUrl: './agent-customers.css'
})
export class AgentCustomers implements OnInit {
  private policyService = inject(PolicyService);
  private cdr = inject(ChangeDetectorRef);

  customers: DerivedCustomer[] = [];
  loading = true;

  ngOnInit() {
    this.deriveCustomers();
  }

  deriveCustomers() {
    this.loading = true;
    this.policyService.getAssignedPolicies().subscribe({
      next: (policies: PolicyDto[]) => {

        // Group and reduce policies by CustomerName
        const customerMap = new Map<string, DerivedCustomer>();

        policies.forEach(p => {
          if (!customerMap.has(p.customerName)) {
            customerMap.set(p.customerName, {
              customerName: p.customerName,
              totalPolicies: 0,
              activePolicies: 0,
              totalPremiumGenerated: 0
            });
          }

          const c = customerMap.get(p.customerName)!;
          c.totalPolicies += 1;
          if (p.status === 'Active') {
            c.activePolicies += 1;
          }
          c.totalPremiumGenerated += p.totalPremium;
        });

        this.customers = Array.from(customerMap.values());
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
