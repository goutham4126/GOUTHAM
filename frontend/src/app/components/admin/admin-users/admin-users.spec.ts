import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminUsers } from './admin-users';
import { UserService } from '../../../services/user/user';
import { ToastService } from '../../../services/toast/toast';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, Input } from '@angular/core';

@Component({ selector: 'canvas[baseChart]', template: '', standalone: true })
class MockChartComponent {
    @Input() data: any;
    @Input() options: any;
    @Input() type: any;
    @Input() plugins: any;
    @Input() legend: any;
}

describe('AdminUsers', () => {
    let component: AdminUsers;
    let fixture: ComponentFixture<AdminUsers>;
    let mockUserService: any;
    let mockToastService: any;

    beforeEach(async () => {
        mockUserService = {
            getAllUsers: jasmine.createSpy().and.returnValue(of([
                { id: 'u1', firstName: 'John', lastName: 'Doe', email: 'john@test.com', role: 'Customer', isActive: true, registeredOn: '2023-01-01' },
                { id: 'u2', firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com', role: 'Agent', isActive: true, registeredOn: '2023-01-01' }
            ])), updateUserRole: jasmine.createSpy(), deleteUser: jasmine.createSpy()
        };
        mockToastService = { confirm: jasmine.createSpy(), success: jasmine.createSpy(), error: jasmine.createSpy() };

        await TestBed.configureTestingModule({
            imports: [AdminUsers, CommonModule, RouterTestingModule],
            providers: [
                { provide: UserService, useValue: mockUserService },
                { provide: ToastService, useValue: mockToastService }
            ]
        })
            .overrideComponent(AdminUsers, { set: { imports: [FormsModule, MockChartComponent] } })
            .compileComponents();
        fixture = TestBed.createComponent(AdminUsers);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => { expect(component).toBeTruthy(); });
    it('should load users on init', () => {
        expect(mockUserService.getAllUsers).toHaveBeenCalled();
        expect(component.users.length).toBe(2);
        expect(component.loadingUsers).toBe(false);
    });
    it('should update chart data with role counts', () => {
        component.users = [{ role: 'Admin' } as any, { role: 'Customer' } as any, { role: 'Agent' } as any, { role: 'ClaimOfficer' } as any];
        component.updateChartData();
        expect(component.barChartData.datasets[0].data).toEqual([1, 1, 1, 1]);
    });
    it('should call confirm on updateRole', () => {
        component.updateRole('u1', 'Agent');
        expect(mockToastService.confirm).toHaveBeenCalled();
    });
    it('should call confirm on deleteUser', () => {
        component.deleteUser('u1', 'Alice A');
        expect(mockToastService.confirm).toHaveBeenCalled();
    });
});
