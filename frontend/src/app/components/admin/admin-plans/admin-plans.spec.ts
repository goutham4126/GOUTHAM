import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminPlans } from './admin-plans';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { PlanService } from '../../../services/plan/plan';
import { ToastService } from '../../../services/toast/toast';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

describe('AdminPlans', () => {
    let component: AdminPlans;
    let fixture: ComponentFixture<AdminPlans>;
    let mockPlanService: any;
    let mockToastService: any;

    beforeEach(async () => {
        mockPlanService = {
            getAllPlans: jasmine.createSpy().and.returnValue(of([{ id: 'p1', name: 'Basic Plan', planType: 'Auto', premiumAmount: 100, coverageAmount: 5000, durationInMonths: 12, paymentFrequency: 'Monthly' }])),
            createPlan: jasmine.createSpy()
        };
        mockToastService = { success: jasmine.createSpy(), error: jasmine.createSpy(), warning: jasmine.createSpy() };
        await TestBed.configureTestingModule({
            imports: [AdminPlans, CommonModule, ReactiveFormsModule, RouterTestingModule],
            providers: [
                { provide: PlanService, useValue: mockPlanService },
                { provide: ToastService, useValue: mockToastService }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(AdminPlans);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => { expect(component).toBeTruthy(); });
    it('should load plans on init', () => {
        expect(mockPlanService.getAllPlans).toHaveBeenCalled();
        expect(component.plans.length).toBe(1);
        expect(component.loadingPlans).toBe(false);
    });
    it('should show warning when submitting invalid form', () => {
        component.planForm.reset();
        component.createPlan();
        expect(mockToastService.warning).toHaveBeenCalled();
    });
    it('should create plan and show success', () => {
        mockPlanService.createPlan.and.returnValue(of({}));
        component.planForm.setValue({ name: 'Plan A', description: 'Desc', premiumAmount: 100, coverageAmount: 5000, durationInMonths: 12, paymentFrequency: 'Monthly', planType: 'Casualty' });
        component.createPlan();
        expect(mockPlanService.createPlan).toHaveBeenCalled();
        expect(mockToastService.success).toHaveBeenCalled();
    });
    it('should show error on create failure', () => {
        spyOn(console, 'error');
        mockPlanService.createPlan.and.returnValue(throwError(() => new Error('Test error')));
        component.planForm.setValue({ name: 'Plan A', description: 'Desc', premiumAmount: 100, coverageAmount: 5000, durationInMonths: 12, paymentFrequency: 'Monthly', planType: 'Casualty' });
        component.createPlan();
        expect(mockToastService.error).toHaveBeenCalled();
    });
});
