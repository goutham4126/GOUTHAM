import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminClaims } from './admin-claims';
import { CommonModule } from '@angular/common';
import { ClaimService } from '../../../services/claim/claim';
import { ToastService } from '../../../services/toast/toast';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

describe('AdminClaims', () => {
    let component: AdminClaims;
    let fixture: ComponentFixture<AdminClaims>;
    let mockClaimService: { getAllClaims: jasmine.Spy };

    beforeEach(async () => {
        mockClaimService = { getAllClaims: jasmine.createSpy().and.returnValue(of([{ id: 'c1', claimAmount: 1000, status: 'Pending', policy: { plan: { name: 'Plan A' } }, customerName: 'John', dateFiled: '2023-01-01' }])) };
        await TestBed.configureTestingModule({
            imports: [AdminClaims, CommonModule, RouterTestingModule],
            providers: [{ provide: ClaimService, useValue: mockClaimService }]
        }).compileComponents();
        fixture = TestBed.createComponent(AdminClaims);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => { expect(component).toBeTruthy(); });
    it('should load claims on init', () => {
        expect(mockClaimService.getAllClaims).toHaveBeenCalled();
        expect(component.claims.length).toBe(1);
        expect(component.loadingClaims).toBe(false);
    });
    it('should handle error gracefully', () => {
        mockClaimService.getAllClaims.and.returnValue(throwError(() => new Error()));
        component.loadClaims();
        expect(component.loadingClaims).toBe(false);
    });
});
