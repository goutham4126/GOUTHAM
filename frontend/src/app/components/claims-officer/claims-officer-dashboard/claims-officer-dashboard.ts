import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ClaimService } from '../../../services/claim/claim';
import { ClaimDto } from '../../../models/claim/claim';
import { ToastService } from '../../../services/toast/toast';

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
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  assignedClaims: ClaimDto[] = [];
  loading = true;

  // Approval Modal State
  selectedClaimId: string | null = null;
  approvalAmount: number = 0;

  // Success Dialog State
  successDialogVisible = false;
  approvedClaimAmount: number = 0;
  approvedClaimId: string | null = null;

  // Row Expansion State
  expandedClaimId: string | null = null;

  isApproving = false;


  toggleExpand(claimId: string) {
    this.expandedClaimId = this.expandedClaimId === claimId ? null : claimId;
  }

  async openDocument(url: string) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      window.open(objectUrl, '_blank');
    } catch (error) {
      console.error('Error fetching document:', error);
      window.open(url, '_blank');
    }
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
      this.isApproving = true;
      this.claimService.approveClaim(this.selectedClaimId, {
        approvedAmount: this.approvalAmount,
        notes: 'Approved via Evaluation Desk'
      }).subscribe({
        next: () => {
          this.approvedClaimAmount = this.approvalAmount;
          this.approvedClaimId = this.selectedClaimId;
          this.isApproving = false;
          this.successDialogVisible = true;
          this.cancelApprove();
        },
        error: (err) => {
          console.error(err);
          this.toastService.error('Failed to approve claim');
          this.isApproving = false;
        }
      });
    }
  }

  closeSuccessDialog() {
    this.successDialogVisible = false;
    this.approvedClaimId = null;
    this.approvedClaimAmount = 0;
    this.loadClaims();
  }

  rejectClaim(id: string) {
    this.toastService.confirm('Reject Claim', 'Are you sure you want to reject this claim permanently?', () => {
      this.claimService.rejectClaim(id).subscribe({
        next: () => {
          this.toastService.success('Claim rejected successfully');
          this.loadClaims();
        },
        error: (err) => {
          console.error(err);
          this.toastService.error('Failed to reject claim');
        }
      });
    });
  }
}
