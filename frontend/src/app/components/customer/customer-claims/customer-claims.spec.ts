import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomerClaims } from './customer-claims';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ClaimService } from '../../../services/claim/claim';
import { PolicyService } from '../../../services/policy/policy';
import { ToastService } from '../../../services/toast/toast';
import { of, throwError } from 'rxjs';

describe('CustomerClaims', () => {
    let component: CustomerClaims;
    let fixture: ComponentFixture<CustomerClaims>;
    let mockClaimService: any;
    let mockPolicyService: any;
    let mockToastService: any;
    const mockClaims: any = [{ id: 'c1', policyId: 'pol1', status: 'Pending', claimAmount: 1000 }];
    const mockPolicies: any = [{ id: 'pol1', status: 'Active' }, { id: 'pol2', status: 'Expired' }];

    beforeEach(async () => {
        mockClaimService = { getMyClaims: jasmine.createSpy().and.returnValue(of(mockClaims)), submitClaim: jasmine.createSpy() };
        mockPolicyService = { getMyPolicies: jasmine.createSpy().and.returnValue(of(mockPolicies)) };
        mockToastService = { success: jasmine.createSpy(), error: jasmine.createSpy(), warning: jasmine.createSpy() };
        await TestBed.configureTestingModule({
            imports: [CustomerClaims, CommonModule, ReactiveFormsModule],
            providers: [
                { provide: ClaimService, useValue: mockClaimService },
                { provide: PolicyService, useValue: mockPolicyService },
                { provide: ToastService, useValue: mockToastService }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(CustomerClaims);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => { expect(component).toBeTruthy(); });
    it('should load claims and active policies on init', () => {
        expect(component.claims.length).toBe(1);
        expect(component.policies.length).toBe(1); // only 'Active'
        expect(component.loadingClaims).toBe(false);
    });
    it('should identify image URLs', () => { expect(component.isImage('photo.jpg')).toBe(true); expect(component.isImage('doc.pdf')).toBe(false); });
    it('should identify PDF URLs', () => { expect(component.isPdf('file.pdf')).toBe(true); });
    it('should return null from getSafeUrl for null', () => { expect(component.getSafeUrl(null)).toBeNull(); });
    it('should close document viewer', () => {
        component.viewingDocumentUrl = 'http://example.com/doc';
        component.closeDocument();
        expect(component.viewingDocumentUrl).toBeNull();
    });
    it('should show warning when submitting invalid form', async () => {
        component.claimForm.reset();
        await component.submitClaim();
        expect(mockToastService.warning).toHaveBeenCalled();
    });
    it('should filter available policies correctly', () => {
        // pol1 has pending claim, so it should be excluded from availablePolicies
        const available = component.availablePolicies;
        expect(available.length).toBe(0); // pol1 excluded, pol2 is expired so not in policies list
    });
});
