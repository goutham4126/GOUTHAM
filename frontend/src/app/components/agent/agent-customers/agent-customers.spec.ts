import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgentCustomers } from './agent-customers';
import { CommonModule } from '@angular/common';
import { PolicyService } from '../../../services/policy/policy';
import { UserService } from '../../../services/user/user';
import { of, throwError } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';

describe('AgentCustomers', () => {
    let component: AgentCustomers;
    let fixture: ComponentFixture<AgentCustomers>;
    let mockPolicyService: { getAssignedPolicies: jasmine.Spy };
    let mockUserService: any;
    const mockPolicies: any = [
        { id: 'pol1', customerName: 'Alice', status: 'Active', totalPremium: 500 },
        { id: 'pol2', customerName: 'Alice', status: 'Expired', totalPremium: 300 },
        { id: 'pol3', customerName: 'Bob', status: 'Active', totalPremium: 700 }
    ];

    beforeEach(async () => {
        mockPolicyService = { getAssignedPolicies: jasmine.createSpy().and.returnValue(of(mockPolicies)) };
        mockUserService = { getMyCustomers: jasmine.createSpy().and.returnValue(of([{ id: 'c1', firstName: 'John', lastName: 'Doe', email: 'john@test.com', phone: '123', dateOfBirth: '1990-01-01', registeredOn: '2023-01-01' }])) };
        await TestBed.configureTestingModule({
            imports: [AgentCustomers, CommonModule, RouterTestingModule],
            providers: [
                { provide: PolicyService, useValue: mockPolicyService },
                { provide: UserService, useValue: mockUserService } // Add UserService to providers
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(AgentCustomers);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => { expect(component).toBeTruthy(); });
    it('should derive customers from policies', () => {
        expect(component.customers.length).toBe(2);
        expect(component.loading).toBe(false);
    });
    it('should count active policies per customer', () => {
        const alice = component.customers.find(c => c.customerName === 'Alice');
        expect(alice?.totalPolicies).toBe(2);
        expect(alice?.activePolicies).toBe(1);
    });
    it('should calculate total premium per customer', () => {
        const alice = component.customers.find(c => c.customerName === 'Alice');
        expect(alice?.totalPremiumGenerated).toBe(800);
    });
    it('should handle error gracefully', () => {
        mockPolicyService.getAssignedPolicies.and.returnValue(throwError(() => new Error()));
        component.deriveCustomers();
        expect(component.loading).toBe(false);
    });
});
