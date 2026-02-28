import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClaimService } from '../../../services/claim';
import { ClaimDto } from '../../../models/claim/claim';

@Component({
  selector: 'app-admin-claims',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-claims.html',
  styleUrl: './admin-claims.css'
})
export class AdminClaims implements OnInit {
  private claimService = inject(ClaimService);
  private cdr = inject(ChangeDetectorRef);

  claims: ClaimDto[] = [];
  loadingClaims = true;

  ngOnInit() {
    this.loadClaims();
  }

  loadClaims() {
    this.loadingClaims = true;
    this.claimService.getAllClaims().subscribe({
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
}
