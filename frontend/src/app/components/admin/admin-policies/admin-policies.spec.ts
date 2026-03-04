import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminPolicies } from './admin-policies';
import { CommonModule } from '@angular/common';
import { PolicyService } from '../../../services/policy/policy';
import { PolicyDto } from '../../../models/policy/policy';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

describe('AdminPolicies', () => {
    let component: AdminPolicies;
    let fixture: ComponentFixture<AdminPolicies>;
    let mockPolicyService: { getAllPolicies: jasmine.Spy };

    beforeEach(async () => {
        mockPolicyService = { getAllPolicies: jasmine.createSpy().and.returnValue(of([{ id: 'pol1', status: 'Active', plan: { name: 'Test Plan' }, customerName: 'John', durationInMonths: 12, totalPaid: 100, totalPremium: 1200, paymentFrequency: 'Monthly' }])) };
        await TestBed.configureTestingModule({
            imports: [AdminPolicies, CommonModule, RouterTestingModule],
            providers: [{ provide: PolicyService, useValue: mockPolicyService }]
        }).compileComponents();
        fixture = TestBed.createComponent(AdminPolicies);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => { expect(component).toBeTruthy(); });
    it('should load policies on init', () => {
        expect(mockPolicyService.getAllPolicies).toHaveBeenCalled();
        expect(component.policies.length).toBe(1);
        expect(component.loadingPolicies).toBe(false);
    });
    it('should handle error gracefully', () => {
        mockPolicyService.getAllPolicies.and.returnValue(throwError(() => new Error()));
        component.loadPolicies();
        expect(component.loadingPolicies).toBe(false);
    });
});
