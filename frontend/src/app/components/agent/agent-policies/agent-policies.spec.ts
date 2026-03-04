import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgentPolicies } from './agent-policies';
import { CommonModule } from '@angular/common';
import { PolicyService } from '../../../services/policy/policy';
import { of, throwError } from 'rxjs';

describe('AgentPolicies', () => {
    let component: AgentPolicies;
    let fixture: ComponentFixture<AgentPolicies>;
    let mockPolicyService: { getAssignedPolicies: jasmine.Spy };
    const mockPolicies: any = [
        { id: 'p1', status: 'Active', totalPremium: 500, customerName: 'John', plan: { name: 'Plan A' }, paymentFrequency: 'Monthly', startDate: '2023-01-01' },
        { id: 'p2', status: 'Expired', totalPremium: 300, customerName: 'Jane', plan: { name: 'Plan B' }, paymentFrequency: 'Yearly', startDate: '2022-01-01' },
        { id: 'p3', status: 'Active', totalPremium: 700, customerName: 'Bob', plan: { name: 'Plan C' }, paymentFrequency: 'Quarterly', startDate: '2023-06-01' }
    ];

    beforeEach(async () => {
        mockPolicyService = { getAssignedPolicies: jasmine.createSpy().and.returnValue(of(mockPolicies)) };
        await TestBed.configureTestingModule({
            imports: [AgentPolicies, CommonModule],
            providers: [{ provide: PolicyService, useValue: mockPolicyService }]
        }).compileComponents();
        fixture = TestBed.createComponent(AgentPolicies);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => { expect(component).toBeTruthy(); });
    it('should load policies on init', () => {
        expect(mockPolicyService.getAssignedPolicies).toHaveBeenCalled();
        expect(component.assignedPolicies.length).toBe(3);
        expect(component.loading).toBe(false);
    });
    it('should count active policies', () => { expect(component.activePoliciesCount).toBe(2); });
    it('should calculate total value', () => { expect(component.totalValue).toBe(1500); });
    it('should handle load error gracefully', () => {
        mockPolicyService.getAssignedPolicies.and.returnValue(throwError(() => new Error()));
        component.loadPolicies();
        expect(component.loading).toBe(false);
    });
});
