import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoiceService } from '../../../services/invoice/invoice';
import { Invoice } from '../../../models/invoice/invoice.model';

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

  policyInvoices: Invoice[] = [];
  claimInvoices: Invoice[] = [];
  paymentInvoices: Invoice[] = [];

  isLoading = true;
  error = '';
  
  viewMode: 'grid' | 'list' = 'grid';

  toggleView(mode: 'grid' | 'list') {
    this.viewMode = mode;
  }

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
}

