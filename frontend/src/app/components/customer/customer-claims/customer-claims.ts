import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClaimService } from '../../../services/claim';
import { PolicyService } from '../../../services/policy';
import { ClaimDto } from '../../../models/claim/claim';
import { PolicyDto } from '../../../models/policy/policy';

@Component({
  selector: 'app-customer-claims',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './customer-claims.html',
  styleUrl: './customer-claims.css'
})
export class CustomerClaims implements OnInit {
  private claimService = inject(ClaimService);
  private policyService = inject(PolicyService);
  private cdr = inject(ChangeDetectorRef);

  claims: ClaimDto[] = [];
  policies: PolicyDto[] = []; // Needed for the dropdown

  loadingClaims = true;
  loadingPolicies = true;

  private fb = inject(FormBuilder);
  claimForm: FormGroup = this.fb.group({
    policyId: ['', Validators.required],
    reason: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(1)]],
    documentUrl: [''],
    documentHash: [''],
    blockchainTxHash: ['']
  });

  ngOnInit() {
    this.loadPolicies();
    this.loadClaims();
  }

  loadPolicies() {
    this.loadingPolicies = true;
    this.policyService.getMyPolicies().subscribe({
      next: (data) => {
        // Filter out inactive policies if needed, or allow all
        this.policies = data.filter(p => p.status === 'Active');
        this.loadingPolicies = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingPolicies = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadClaims() {
    this.loadingClaims = true;
    this.claimService.getMyClaims().subscribe({
      next: (data) => {
        this.claims = data;
        this.loadingClaims = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingClaims = false;
        this.cdr.detectChanges();
      }
    });
  }

  submitClaim() {
    if (this.claimForm.valid) {
      // Per user request, allow but do not require mock links
      const payload = {
        ...this.claimForm.value,
        documentUrl: this.claimForm.value.documentUrl || 'N/A',
        documentHash: this.claimForm.value.documentHash || 'Pending_Hash',
        blockchainTxHash: this.claimForm.value.blockchainTxHash || 'Pending_Tx'
      };

      this.claimService.submitClaim(payload).subscribe({
        next: () => {
          this.loadClaims();
          this.claimForm.reset({
            policyId: '',
            reason: '',
            amount: 0,
            documentUrl: '',
            documentHash: '',
            blockchainTxHash: ''
          });
          alert('Claim submitted successfully. It is now Pending review.');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          alert('Failed to submit claim. Please check your inputs.');
        }
      });
    } else {
      alert('Please complete the required claim fields.');
    }
  }
}
