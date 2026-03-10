import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ClaimService } from '../../../services/claim/claim';
import { ClaimDto } from '../../../models/claim/claim';
import { ToastService } from '../../../services/toast/toast';
import { VideoCallService } from '../../../services/video-call/video-call.service';
import { Router } from '@angular/router';

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
  public videoCallService = inject(VideoCallService);
  private router = inject(Router);

  assignedClaims: ClaimDto[] = [];
  loading = true;

  // Approval Modal State
  selectedClaimId: string | null = null;
  approvalAmount: number = 0;
  approvalRemarks: string = '';

  // Rejection Modal State
  selectedRejectClaimId: string | null = null;
  rejectionRemarks: string = '';
  isRejecting = false;

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
    this.approvalRemarks = '';
  }

  cancelApprove() {
    this.selectedClaimId = null;
    this.approvalAmount = 0;
    this.approvalRemarks = '';
  }

  confirmApprove() {
    if (this.selectedClaimId && this.approvalAmount >= 0) {
      this.isApproving = true;

      const reqId = this.selectedClaimId;
      const reqAmount = this.approvalAmount;
      const reqRemarks = this.approvalRemarks;

      this.claimService.approveClaim(reqId, {
        approvedAmount: reqAmount,
        notes: 'Approved via Evaluation Desk',
        remarks: reqRemarks
      }).subscribe({
        next: () => {
          this.approvedClaimAmount = reqAmount;
          this.approvedClaimId = reqId;
          this.isApproving = false;
          this.successDialogVisible = true;
          this.cancelApprove();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.toastService.error('Failed to approve claim');
          this.isApproving = false;
          this.cdr.detectChanges();
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

  promptReject(id: string) {
    this.selectedRejectClaimId = id;
    this.rejectionRemarks = '';
  }

  cancelReject() {
    this.selectedRejectClaimId = null;
    this.rejectionRemarks = '';
  }

  confirmReject() {
    if (this.selectedRejectClaimId) {
      this.isRejecting = true;
      const reqId = this.selectedRejectClaimId;
      const reqRemarks = this.rejectionRemarks;

      this.claimService.rejectClaim(reqId, { remarks: reqRemarks }).subscribe({
        next: () => {
          this.toastService.success('Claim rejected successfully');
          this.isRejecting = false;
          this.selectedRejectClaimId = null;
          this.loadClaims();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.toastService.error('Failed to reject claim');
          this.isRejecting = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  // Schedule Call Modal State
  selectedScheduleClaimId: string | null = null;
  scheduleDateTime: string = '';
  isScheduling = false;

  promptSchedule(claimId: string) {
    this.selectedScheduleClaimId = claimId;
    // Default to tomorrow at 10:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    this.scheduleDateTime = tomorrow.toISOString().slice(0, 16);
  }

  cancelSchedule() {
    this.selectedScheduleClaimId = null;
    this.scheduleDateTime = '';
  }

  confirmSchedule() {
    if (!this.selectedScheduleClaimId || !this.scheduleDateTime) return;
    this.isScheduling = true;
    this.claimService.scheduleCall(this.selectedScheduleClaimId, this.scheduleDateTime).subscribe({
      next: () => {
        this.toastService.success('Video call scheduled successfully!');
        this.isScheduling = false;
        this.cancelSchedule();
        this.loadClaims();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.toastService.error('Failed to schedule call');
        this.isScheduling = false;
        this.cdr.detectChanges();
      }
    });
  }
  // Complete Verification Modal State
  selectedVerifyClaimId: string | null = null;
  verificationRemarks: string = '';
  isCompletingVerification = false;

  promptCompleteVerification(claimId: string) {
    this.selectedVerifyClaimId = claimId;
    this.verificationRemarks = '';
  }

  cancelCompleteVerification() {
    this.selectedVerifyClaimId = null;
    this.verificationRemarks = '';
  }

  confirmCompleteVerification() {
    if (!this.selectedVerifyClaimId) return;
    this.isCompletingVerification = true;
    this.claimService.completeVerification(this.selectedVerifyClaimId, this.verificationRemarks || undefined).subscribe({
      next: () => {
        this.toastService.success('Video verification marked as completed!');
        this.isCompletingVerification = false;
        this.cancelCompleteVerification();
        this.loadClaims();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.toastService.error('Failed to complete verification');
        this.isCompletingVerification = false;
        this.cdr.detectChanges();
      }
    });
  }

  initiateVideoCall(claim: ClaimDto) {
    this.videoCallService.initiateCall(claim.id);
    this.router.navigate(['/video-call', claim.id]);
  }

  joinScheduledCall(claim: ClaimDto) {
    this.videoCallService.joinScheduledCall(claim.id);
    this.router.navigate(['/video-call', claim.id]);
  }
}
