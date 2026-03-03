import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PolicyService } from '../../../services/policy/policy';
import { PolicyDto } from '../../../models/policy/policy';

@Component({
  selector: 'app-admin-policies',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-policies.html',
  styleUrl: './admin-policies.css'
})
export class AdminPolicies implements OnInit {
  private policyService = inject(PolicyService);
  private cdr = inject(ChangeDetectorRef);

  policies: PolicyDto[] = [];
  loadingPolicies = true;

  ngOnInit() {
    this.loadPolicies();
  }

  loadPolicies() {
    this.loadingPolicies = true;
    this.policyService.getAllPolicies().subscribe({
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
}
