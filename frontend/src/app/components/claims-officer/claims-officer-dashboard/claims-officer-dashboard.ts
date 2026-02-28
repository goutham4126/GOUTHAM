import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClaimService } from '../../../services/claim';
import { ClaimDto } from '../../../models/claim/claim';

@Component({
  selector: 'app-claims-officer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
  templateUrl: './claims-officer-dashboard.html',
  styleUrl: './claims-officer-dashboard.css'
})
export class ClaimsOfficerDashboard implements OnInit {
  private claimService = inject(ClaimService);
  private cdr = inject(ChangeDetectorRef);

  assignedClaims: ClaimDto[] = [];
  loading = true;

  // Approval Modal State
  selectedClaimId: string | null = null;
  approvalAmount: number = 0;

  // Row Expansion State
  expandedClaimId: string | null = null;

  toggleExpand(claimId: string) {
    this.expandedClaimId = this.expandedClaimId === claimId ? null : claimId;
  }

  ngOnInit() {
    this.loadClaims();
  }

  loadClaims() {
    this.loading = true;
    this.claimService.getAssignedClaims().subscribe({
      next: (data) => {
        this.assignedClaims = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  promptApprove(claim: ClaimDto) {
    this.selectedClaimId = claim.id;
    this.approvalAmount = claim.claimAmount; 
  }

  cancelApprove() {
    this.selectedClaimId = null;
    this.approvalAmount = 0;
  }

  confirmApprove() {
    if (this.selectedClaimId && this.approvalAmount >= 0) {
      this.claimService.approveClaim(this.selectedClaimId, {
        approvedAmount: this.approvalAmount,
        notes: 'Approved via Evaluation Desk'
      }).subscribe({
        next: () => {
          alert('Claim approved successfully!');
          this.cancelApprove();
          this.loadClaims();
        },
        error: (err) => {
          console.error(err);
          alert('Failed to approve claim');
        }
      });
    }
  }

  rejectClaim(id: string) {
    if (confirm('Are you sure you want to reject this claim permanently?')) {
      this.claimService.rejectClaim(id).subscribe({
        next: () => {
          this.loadClaims();
        },
        error: (err) => {
          console.error(err);
          alert('Failed to reject claim');
        }
      });
    }
  }
}
