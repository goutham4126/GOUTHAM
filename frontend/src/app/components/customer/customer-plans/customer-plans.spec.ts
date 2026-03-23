import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomerPlans } from './customer-plans';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlanService } from '../../../services/plan/plan';
import { PolicyRequestService } from '../../../services/policy-request/policy-request';
import { ToastService } from '../../../services/toast/toast';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('CustomerPlans', () => {
    let component: CustomerPlans;
    let fixture: ComponentFixture<CustomerPlans>;
    let mockPlanService: any;
    let mockPolicyRequestService: any;
    let mockToastService: any;
    let mockRouter: any;
    const mockPlan: any = { id: 'plan1', name: 'Casualty Plan', planType: 'Casualty', premiumAmount: 500, coverageAmount: 100000, durationInMonths: 12 };

    beforeEach(async () => {
        mockPlanService = { getAllPlans: jasmine.createSpy().and.returnValue(of([mockPlan])) };
        mockPolicyRequestService = { createRequest: jasmine.createSpy() };
        mockToastService = { success: jasmine.createSpy(), error: jasmine.createSpy() };
        mockRouter = { navigate: jasmine.createSpy() };
        await TestBed.configureTestingModule({
            imports: [CustomerPlans, CommonModule, FormsModule, RouterTestingModule],
            providers: [
                { provide: PlanService, useValue: mockPlanService },
                { provide: PolicyRequestService, useValue: mockPolicyRequestService },
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
    it('should set selectedPlan on promptRequest', () => { component.promptRequest(mockPlan); expect(component.selectedPlan).toEqual(mockPlan); });
    it('should clear selectedPlan on cancelRequest', () => { component.selectedPlan = mockPlan; component.cancelRequest(); expect(component.selectedPlan).toBeNull(); });
    it('should return 0 riskScore when no plan', () => { component.selectedPlan = null; expect(component.riskScore).toBe(0); });
    it('should compute correct installment for Monthly', () => { component.selectedPlan = mockPlan; component.requestForm.controls['paymentFrequency'].setValue('Monthly'); expect(component.computedInstallmentAmount).toBe(635); });
    it('should compute correct installment for Quarterly', () => { component.selectedPlan = mockPlan; component.requestForm.controls['paymentFrequency'].setValue('Quarterly'); expect(component.computedInstallmentAmount).toBe(1860); });
    it('should compute correct installment for Yearly', () => { component.selectedPlan = mockPlan; component.requestForm.controls['paymentFrequency'].setValue('Yearly'); expect(component.computedInstallmentAmount).toBe(7260); });
    it('should return correct frequencyLabel', () => {
        component.requestForm.controls['paymentFrequency'].setValue('Monthly'); expect(component.frequencyLabel).toBe('month');
        component.requestForm.controls['paymentFrequency'].setValue('Quarterly'); expect(component.frequencyLabel).toBe('quarter');
        component.requestForm.controls['paymentFrequency'].setValue('Yearly'); expect(component.frequencyLabel).toBe('year');
    });
    it('should show success dialog on request creation', () => {
        mockPolicyRequestService.createRequest.and.returnValue(of({ id: 'req1', planName: 'Casualty Plan', paymentFrequency: 'Monthly', durationInMonths: 12, status: 'Pending' }));
        component.selectedPlan = mockPlan;
        component.requestForm.controls['durationInMonths'].setValue(12);
        component.panDocument = new File([], 'pan.pdf');
        component.addressDocument = new File([], 'address.pdf');
        component.panDetails = { pan_number: 'ABCDE1234F', name: 'John Doe', date_of_birth: '1990-01-01' };
        component.aadhaarDetails = { reference_id: '12345678', name: 'John Doe', gender: 'Male', date_of_birth: '1990-01-01', full_address: '123 Main St', photo: 'base64' };
        component.confirmRequest();
        expect(component.successDialogVisible).toBe(true);
    });
    it('should show error toast on request failure', () => {
        spyOn(console, 'error');
        mockPolicyRequestService.createRequest.and.returnValue(throwError(() => new Error('Test error')));
        component.selectedPlan = mockPlan;
        component.requestForm.controls['durationInMonths'].setValue(12);
        component.panDocument = new File([], 'pan.pdf');
        component.addressDocument = new File([], 'address.pdf');
        component.panDetails = { pan_number: 'ABCDE1234F', name: 'John Doe', date_of_birth: '1990-01-01' };
        component.aadhaarDetails = { reference_id: '12345678', name: 'John Doe', gender: 'Male', date_of_birth: '1990-01-01', full_address: '123 Main St', photo: 'base64' };
        component.confirmRequest();
        expect(mockToastService.error).toHaveBeenCalled();
    });
    it('should navigate to /customer/my-policy-requests on closeSuccessDialog', () => {
        component.closeSuccessDialog();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/customer/my-policy-requests']);
    });
});
