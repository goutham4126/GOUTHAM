import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

import { UserService } from '../../../services/user/user';
import { PlanService } from '../../../services/plan/plan';
import { PolicyService } from '../../../services/policy/policy';
import { ClaimService } from '../../../services/claim/claim';
import { ToastService } from '../../../services/toast/toast';
import { forkJoin } from 'rxjs';
import { UserDto } from '../../../models/auth/auth';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule, BaseChartDirective],
    templateUrl: './admin-dashboard.html',
})
export class AdminDashboard implements OnInit {
    private userService = inject(UserService);
    private planService = inject(PlanService);
    private policyService = inject(PolicyService);
    private claimService = inject(ClaimService);
    private toastService = inject(ToastService);
    private cdr = inject(ChangeDetectorRef);

    loading = true;

    // Totals
    totalPlans = 0;
    totalPolicies = 0;
    pendingPolicies = 0;
    approvedPolicies = 0;
    rejectedPolicies = 0;

    totalClaims = 0;
    pendingClaims = 0;
    approvedClaims = 0;
    rejectedClaims = 0;

    // Users
    users: UserDto[] = [];
    get totalUsers() { return this.users.length; }

    // Chart Properties
    public barChartLegend = true;
    public barChartPlugins = [];

    public barChartData: ChartConfiguration<'bar'>['data'] = {
        labels: ['Admins', 'Agents', 'Claim Officers', 'Customers'],
        datasets: [
            { data: [0, 0, 0, 0], label: 'User Roles', backgroundColor: '#8b5cf6', borderRadius: 4 }
        ]
    };

    public barChartOptions: ChartConfiguration<'bar'>['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { stepSize: 1 }
            }
        }
    };

    ngOnInit() {
        this.loadDashboardData();
    }

    loadDashboardData() {
        this.loading = true;

        forkJoin({
            users: this.userService.getAllUsers(),
            plans: this.planService.getAllPlans(true), // passing true to get all plans
            policies: this.policyService.getAllPolicies(),
            claims: this.claimService.getAllClaims()
        }).subscribe({
            next: (data) => {
                this.users = data.users;
                this.updateChartData();

                this.totalPlans = data.plans.length;

                this.totalPolicies = data.policies.length;
                this.pendingPolicies = data.policies.filter(p => p.status === 'Pending').length;
                this.approvedPolicies = data.policies.filter(p => p.status === 'Approved').length;
                this.rejectedPolicies = data.policies.filter(p => p.status === 'Rejected').length;

                this.totalClaims = data.claims.length;
                this.pendingClaims = data.claims.filter(c => c.status === 'Pending').length;
                this.approvedClaims = data.claims.filter(c => c.status === 'Approved').length;
                this.rejectedClaims = data.claims.filter(c => c.status === 'Rejected').length;

                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error loading dashboard data', err);
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    updateChartData() {
        let admins = 0; let agents = 0; let officers = 0; let customers = 0;
        this.users.forEach(u => {
            if (u.role === 'Admin') admins++;
            else if (u.role === 'Agent') agents++;
            else if (u.role === 'ClaimOfficer') officers++;
            else if (u.role === 'Customer') customers++;
        });

        this.barChartData = {
            labels: ['Admins', 'Agents', 'Claim Officers', 'Customers'],
            datasets: [
                { data: [admins, agents, officers, customers], label: 'User Roles', backgroundColor: '#8b5cf6', borderRadius: 6 }
            ]
        };
    }

    deleteUser(userId: string, name: string) {
        this.toastService.confirm('Delete User', `Are you sure you want to delete user ${name}? This action cannot be undone.`, () => {
            this.userService.deleteUser(userId).subscribe({
                next: () => {
                    this.toastService.success(`User ${name} successfully deleted.`);
                    this.loadDashboardData(); // Refresh all data
                },
                error: (err) => {
                    console.error(err);
                    this.toastService.error('Failed to delete user.');
                }
            });
        });
    }
}
