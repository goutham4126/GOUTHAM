import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ClaimService } from '../../../services/claim';
import { ClaimDto } from '../../../models/claim/claim';
import { ToastService } from '../../../services/toast';

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
  private sanitizer = inject(DomSanitizer);

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

  // Document Viewer State
  viewingDocumentUrl: string | null = null;
  viewingDocumentName: string | null = null;
  originalDocumentUrl: string | null = null;
  isDocumentLoading = false;

  toggleExpand(claimId: string) {
    this.expandedClaimId = this.expandedClaimId === claimId ? null : claimId;
  }

  async openDocument(url: string, name: string) {
    this.originalDocumentUrl = url;
    this.viewingDocumentName = name;
    this.viewingDocumentUrl = null;
    this.isDocumentLoading = true;

    if (this.isPdf(url)) {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        this.viewingDocumentUrl = URL.createObjectURL(pdfBlob);
      } catch (e) {
        console.error('Error fetching document', e);
        this.viewingDocumentUrl = url;
      }
    } else {
      this.viewingDocumentUrl = url;
    }
    this.isDocumentLoading = false;
    this.cdr.detectChanges();
  }

  closeDocument() {
    if (this.viewingDocumentUrl && this.viewingDocumentUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.viewingDocumentUrl);
    }
    this.viewingDocumentUrl = null;
    this.viewingDocumentName = null;
    this.originalDocumentUrl = null;
    this.isDocumentLoading = false;
  }

  isImage(url: string): boolean {
    if (!url) return false;
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
  }

  isPdf(url: string): boolean {
    if (!url) return false;
    return url.toLowerCase().includes('.pdf') || !this.isImage(url);
  }

  getSafeUrl(url: string | null): SafeResourceUrl | null {
    if (!url) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
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
          this.approvedClaimAmount = this.approvalAmount;
          this.approvedClaimId = this.selectedClaimId;
          this.successDialogVisible = true;
          this.cancelApprove();
        },
        error: (err) => {
          console.error(err);
          this.toastService.error('Failed to approve claim');
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
