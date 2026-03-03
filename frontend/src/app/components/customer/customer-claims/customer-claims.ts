import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ClaimService } from '../../../services/claim/claim';
import { PolicyService } from '../../../services/policy/policy';
import { ClaimDto } from '../../../models/claim/claim';
import { ToastService } from '../../../services/toast/toast';
import { PolicyDto } from '../../../models/policy/policy';
import { ENV_CONFIG } from '../../../utils/storage.constants';

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
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);

  claims: ClaimDto[] = [];
  policies: PolicyDto[] = [];

  loadingClaims = true;
  loadingPolicies = true;
  isProcessingUpload = false;
  selectedFile: File | null = null;

  // Document viewer state
  viewingDocumentUrl: string | null = null;
  viewingDocumentName: string | null = null;
  originalDocumentUrl: string | null = null;
  isDocumentLoading = false;

  private fb = inject(FormBuilder);
  claimForm: FormGroup = this.fb.group({
    policyId: ['', Validators.required],
    reason: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(1)]]
  });

  ngOnInit() {
    this.loadPolicies();
    this.loadClaims();
  }

  loadPolicies() {
    this.loadingPolicies = true;
    this.policyService.getMyPolicies().subscribe({
      next: (data) => {
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

  get availablePolicies(): PolicyDto[] {
    return this.policies.filter(p =>
      !this.claims.some(c => c.policyId === p.id && (c.status === 'Approved' || c.status === 'Pending'))
    );
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

  onFileSelect(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  async computeFileHash(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return '0x' + hashHex;
  }

  async uploadToVercelBlob(file: File): Promise<string> {
    const fileName = encodeURIComponent(file.name);
    const response = await fetch(`https://blob.vercel-storage.com/claim_reports/${fileName}`, {
      method: 'PUT',
      headers: {
        'authorization': `Bearer ${ENV_CONFIG.VERCEL_BLOB_RW_TOKEN}`,
        'x-api-version': '7'
      },
      body: file
    });

    if (!response.ok) {
      throw new Error('Failed to upload to Vercel Blob.');
    }

    const data = await response.json();
    return data.url;
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

  async submitClaim() {
    if (this.claimForm.valid) {
      this.isProcessingUpload = true;
      this.cdr.detectChanges();

      let documentUrl = 'N/A';
      let documentHash = 'N/A';

      try {
        if (this.selectedFile) {
          console.log('Computing SHA-256 hash...');
          documentHash = await this.computeFileHash(this.selectedFile);

          console.log('Uploading to Vercel Blob...');
          documentUrl = await this.uploadToVercelBlob(this.selectedFile);
          console.log('Upload successful:', documentUrl);
        }
      } catch (error) {
        console.error('Error processing document upload:', error);
        this.toastService.error('Failed to upload document. Please try again.');
        this.isProcessingUpload = false;
        this.cdr.detectChanges();
        return;
      }

      const payload = {
        ...this.claimForm.value,
        documentUrl,
        documentHash
      };

      this.claimService.submitClaim(payload).subscribe({
        next: () => {
          this.loadClaims();
          this.claimForm.reset({ policyId: '', reason: '', amount: 0 });
          this.selectedFile = null;
          this.isProcessingUpload = false;
          this.toastService.success('Claim submitted successfully. It is now Pending review.');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.isProcessingUpload = false;
          this.toastService.error('Failed to submit claim. Please check your inputs.');
          this.cdr.detectChanges();
        }
      });
    } else {
      this.toastService.warning('Please complete the required claim fields.');
    }
  }
}
