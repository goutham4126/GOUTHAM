import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminDashboard } from './admin-dashboard';
import { UserService } from '../../../services/user/user';
import { PlanService } from '../../../services/plan/plan';
import { PolicyService } from '../../../services/policy/policy';
import { ClaimService } from '../../../services/claim/claim';
import { ToastService } from '../../../services/toast/toast';
import { of } from 'rxjs';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

describe('AdminDashboard', () => {
    let component: AdminDashboard;
    let fixture: ComponentFixture<AdminDashboard>;

    const mockUserService = {
        getAllUsers: jasmine.createSpy('getAllUsers').and.returnValue(of([
            { id: '1', role: 'Admin' },
            { id: '2', role: 'Customer' }
        ]))
    };

    const mockPlanService = {
        getAllPlans: jasmine.createSpy('getAllPlans').and.returnValue(of([
            { id: '1', name: 'Plan 1' }
        ]))
    };

    const mockPolicyService = {
        getAllPolicies: jasmine.createSpy('getAllPolicies').and.returnValue(of([
            { id: '1', status: 'Approved', totalPaid: 100 },
            { id: '2', status: 'Pending', totalPaid: 50 },
            { id: '3', status: 'Active', totalPaid: 200 },
            { id: '4', status: 'Active', totalPaid: 150 }
        ]))
    };

    const mockClaimService = {
        getAllClaims: jasmine.createSpy('getAllClaims').and.returnValue(of([
            { id: '1', status: 'Pending', approvedAmount: 0 },
            { id: '2', status: 'Approved', approvedAmount: 500 }
        ]))
    };

    const mockToastService = {
        success: jasmine.createSpy('success'),
        error: jasmine.createSpy('error'),
        confirm: jasmine.createSpy('confirm')
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AdminDashboard],
            providers: [
                { provide: UserService, useValue: mockUserService },
                { provide: PlanService, useValue: mockPlanService },
                { provide: PolicyService, useValue: mockPolicyService },
                { provide: ClaimService, useValue: mockClaimService },
                { provide: ToastService, useValue: mockToastService } // Added ToastService mock
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AdminDashboard);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load dashboard data correctly on init', () => {
        expect(component.totalUsers).toBe(2);
        expect(component.totalPlans).toBe(1);

        expect(component.totalPolicies).toBe(4);
        expect(component.activePolicies).toBe(2);
        expect(component.totalRevenue).toBe(500);

        expect(component.totalClaims).toBe(2);
        expect(component.pendingClaims).toBe(1);
        expect(component.totalClaimsPaid).toBe(500);
    });
});
