import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomerPolicies } from './customer-policies';
import { CommonModule } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { PolicyService } from '../../../services/policy/policy';
import { ToastService } from '../../../services/toast/toast';
import { AuthService } from '../../../services/auth/auth';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

describe('CustomerPolicies', () => {
    let component: CustomerPolicies;
    let fixture: ComponentFixture<CustomerPolicies>;
    let mockPolicyService: any;
    let mockToastService: any;
    const mockPolicy: any = {
        id: 'pol1', status: 'Active', plan: { name: 'Health Plan' },
        payments: [{ id: 'pay1', status: 'Pending', dueDate: new Date(Date.now() - 86400000).toISOString(), amount: 100 }]
    };

    beforeEach(async () => {
        mockPolicyService = { getMyPolicies: jasmine.createSpy().and.returnValue(of([mockPolicy])), payPolicy: jasmine.createSpy() };
        mockToastService = { success: jasmine.createSpy(), error: jasmine.createSpy() };
        await TestBed.configureTestingModule({
            imports: [CustomerPolicies, CommonModule, RouterTestingModule],
            providers: [
                { provide: PolicyService, useValue: mockPolicyService },
                { provide: ToastService, useValue: mockToastService },
                { provide: AuthService, useValue: { currentUser: signal(null) } }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(CustomerPolicies);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => { expect(component).toBeTruthy(); });
    it('should load policies on init', () => {
        expect(component.policies.length).toBe(1);
        expect(component.loadingPolicies).toBe(false);
    });
    it('should handle load error gracefully', () => {
        mockPolicyService.getMyPolicies.and.returnValue(throwError(() => new Error('Test error')));
        component.loadPolicies();
        expect(component.loadingPolicies).toBe(false);
    });
    it('should set selectedPolicySummary on viewSummary', () => {
        component.viewSummary(mockPolicy);
        expect(component.selectedPolicySummary).toEqual(mockPolicy);
    });
    it('should clear selectedPolicySummary on closeSummary', () => {
        component.selectedPolicySummary = mockPolicy;
        component.closeSummary();
        expect(component.selectedPolicySummary).toBeNull();
    });
    it('should allow payment for due pending payment', () => {
        expect(component.canPay(mockPolicy.payments[0], mockPolicy)).toBe(true);
    });
    it('should not allow payment for paid status', () => {
        const paidPayment: any = { ...mockPolicy.payments[0], status: 'Paid' };
        expect(component.canPay(paidPayment, mockPolicy)).toBe(false);
    });
    it('should call payPolicy and show success', () => {
        mockPolicyService.payPolicy.and.returnValue(of('OK'));
        component.payPremium('pay1');
        expect(mockToastService.success).toHaveBeenCalled();
    });
    it('should show error on payment failure', () => {
        spyOn(console, 'error');
        mockPolicyService.payPolicy.and.returnValue(throwError(() => new Error('Test error')));
        component.payPremium('pay1');
        expect(mockToastService.error).toHaveBeenCalled();
    });
});
