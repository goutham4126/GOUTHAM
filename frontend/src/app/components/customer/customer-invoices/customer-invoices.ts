import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { InvoiceService } from '../../../services/invoice/invoice';
import { Invoice } from '../../../models/invoice.model';

@Component({
  selector: 'app-customer-invoices',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-invoices.html',
  styleUrl: './customer-invoices.css'
})
export class CustomerInvoices implements OnInit {
  private invoiceService = inject(InvoiceService);
  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);

  policyInvoices: Invoice[] = [];
  claimInvoices: Invoice[] = [];
  paymentInvoices: Invoice[] = [];

  isLoading = true;
  error = '';

  // Document viewer state
  viewingDocumentUrl: string | null = null;
  viewingDocumentName: string | null = null;
  originalDocumentUrl: string | null = null;
  isDocumentLoading = false;

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.isLoading = true;
    this.invoiceService.getMyInvoices().subscribe({
      next: (data) => {
        this.policyInvoices = data.filter(i => i.type === 'PolicyPurchase');
        this.claimInvoices = data.filter(i => i.type === 'ClaimStatus');
        this.paymentInvoices = data.filter(i => i.type === 'Payment');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Failed to load invoices. Please try again later.';
        console.error('Error loading invoices:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
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
    // Vercel blob urls might not end with .pdf or might have query params. Let's just assume if it's not an image, it could be a PDF. 
    // Or we explicitly check for pdf in the string.
    return url.toLowerCase().includes('.pdf') || !this.isImage(url);
  }

  getSafeUrl(url: string | null): SafeResourceUrl | null {
    if (!url) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
