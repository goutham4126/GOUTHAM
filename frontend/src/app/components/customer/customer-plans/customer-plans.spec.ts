import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomerPlans } from './customer-plans';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlanService } from '../../../services/plan/plan';
import { PolicyService } from '../../../services/policy/policy';
import { ToastService } from '../../../services/toast/toast';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('CustomerPlans', () => {
    let component: CustomerPlans;
    let fixture: ComponentFixture<CustomerPlans>;
    let mockPlanService: any;
    let mockPolicyService: any;
    let mockToastService: any;
    let mockRouter: any;
    const mockPlan: any = { id: 'plan1', name: 'Casualty Plan', planType: 'Casualty', premiumAmount: 500, coverageAmount: 100000, durationInMonths: 12 };

    beforeEach(async () => {
        mockPlanService = { getAllPlans: jasmine.createSpy().and.returnValue(of([mockPlan])) };
        mockPolicyService = { purchasePolicy: jasmine.createSpy() };
        mockToastService = { success: jasmine.createSpy(), error: jasmine.createSpy() };
        mockRouter = { navigate: jasmine.createSpy() };
        await TestBed.configureTestingModule({
            imports: [CustomerPlans, CommonModule, FormsModule, RouterTestingModule],
            providers: [
                { provide: PlanService, useValue: mockPlanService },
                { provide: PolicyService, useValue: mockPolicyService },
                { provide: ToastService, useValue: mockToastService },
                { provide: Router, useValue: mockRouter }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(CustomerPlans);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => { expect(component).toBeTruthy(); });
    it('should load plans on init', () => { expect(component.plans.length).toBe(1); expect(component.loading).toBe(false); });
    it('should set selectedPlan on promptPurchase', () => { component.promptPurchase(mockPlan); expect(component.selectedPlan).toEqual(mockPlan); });
    it('should clear selectedPlan on cancelPurchase', () => { component.selectedPlan = mockPlan; component.cancelPurchase(); expect(component.selectedPlan).toBeNull(); });
    it('should return 0 riskScore when no plan', () => { component.selectedPlan = null; expect(component.riskScore).toBe(0); });
    it('should compute correct installment for Monthly', () => { component.selectedPlan = mockPlan; component.paymentFrequency = 'Monthly'; expect(component.computedInstallmentAmount).toBe(500); });
    it('should compute correct installment for Quarterly', () => { component.selectedPlan = mockPlan; component.paymentFrequency = 'Quarterly'; expect(component.computedInstallmentAmount).toBe(1500); });
    it('should compute correct installment for Yearly', () => { component.selectedPlan = mockPlan; component.paymentFrequency = 'Yearly'; expect(component.computedInstallmentAmount).toBe(6000); });
    it('should return correct frequencyLabel', () => {
        component.paymentFrequency = 'Monthly'; expect(component.frequencyLabel).toBe('month');
        component.paymentFrequency = 'Quarterly'; expect(component.frequencyLabel).toBe('quarter');
        component.paymentFrequency = 'Yearly'; expect(component.frequencyLabel).toBe('year');
    });
    it('should show success dialog on purchase', () => {
        mockPolicyService.purchasePolicy.and.returnValue(of({ id: 'pol1', payments: [], plan: { name: 'Casualty Plan' }, paymentFrequency: 'Monthly', durationInMonths: 12, coverageAmount: 100000 }));
        component.selectedPlan = mockPlan;
        component.durationInYears = 1;
        component.confirmPurchase();
        expect(component.successDialogVisible).toBe(true);
    });
    it('should show error toast on purchase failure', () => {
        spyOn(console, 'error');
        mockPolicyService.purchasePolicy.and.returnValue(throwError(() => new Error('Test error')));
        component.selectedPlan = mockPlan;
        component.durationInYears = 1;
        component.confirmPurchase();
        expect(mockToastService.error).toHaveBeenCalled();
    });
    it('should navigate to /customer/policies on closeSuccessDialog', () => {
        component.closeSuccessDialog();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/customer/policies']);
    });
});
