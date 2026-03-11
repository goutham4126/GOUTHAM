import { Component, OnInit, inject, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

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
    providers: [DatePipe],
    templateUrl: './admin-dashboard.html',
})
export class AdminDashboard implements OnInit {
    private userService = inject(UserService);
    private planService = inject(PlanService);
    private policyService = inject(PolicyService);
    private claimService = inject(ClaimService);
    private toastService = inject(ToastService);
    private cdr = inject(ChangeDetectorRef);
    private datePipe = inject(DatePipe);

    @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

    loading = true;

    // Totals
    totalPlans = 0;
    totalPolicies = 0;
    activePolicies = 0;
    totalRevenue = 0; // New

    totalClaims = 0;
    pendingClaims = 0;
    totalClaimsPaid = 0; // New

    // Users
    users: UserDto[] = [];
    get totalUsers() { return this.users.length; }

    // Doughnut Chart Properties
    public doughnutChartLegend = true;
    public doughnutChartPlugins = [];

    public doughnutChartData: ChartConfiguration<'doughnut'>['data'] = {
        labels: ['Admins', 'Agents', 'Claim Officers', 'Customers'],
        datasets: [
            { 
                data: [0, 0, 0, 0], 
                label: 'Users', 
                backgroundColor: ['#A855F7', '#7C3AED', '#4C6FFF', '#00C48C'], 
                borderWidth: 0,
                hoverOffset: 4
            }
        ]
    };

    public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: '#1A1D23',
                titleFont: { size: 13, weight: 'bold' },
                bodyFont: { size: 13, weight: 'bold' },
                padding: 12,
                cornerRadius: 12,
                displayColors: true,
                boxPadding: 4,
            }
        }
    };

    // Line Chart Properties
    public lineChartLegend = false;
    public policiesActive = true;
    public claimsActive = true;

    toggleDataset(index: number) {
        if (index === 0) {
            this.policiesActive = !this.policiesActive;
            this.lineChartData.datasets[0].hidden = !this.policiesActive;
        } else {
            this.claimsActive = !this.claimsActive;
            this.lineChartData.datasets[1].hidden = !this.claimsActive;
        }
        this.lineChartData = { ...this.lineChartData }; // Force update
    }
    public lineChartPlugins = [];

    public lineChartData: ChartConfiguration<'line'>['data'] = {
        labels: [],
        datasets: [
            {
                data: [],
                label: 'Policies Generated',
                borderColor: '#00C48C',
                backgroundColor: 'rgba(0, 196, 140, 0.1)',
                borderWidth: 4,
                pointBackgroundColor: '#surface',
                pointBorderColor: '#00C48C',
                pointBorderWidth: 3,
                pointRadius: 5,
                fill: true,
                tension: 0.4
            },
            {
                data: [],
                label: 'Claims Submitted',
                borderColor: '#F59E0B',
                backgroundColor: 'rgba(245, 158, 11, 0.05)',
                borderWidth: 3,
                pointBackgroundColor: '#surface',
                pointBorderColor: '#F59E0B',
                pointBorderWidth: 2,
                pointRadius: 4,
                fill: true,
                tension: 0.4
            }
        ]
    };

    public lineChartOptions: ChartConfiguration<'line'>['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: '#1A1D23',
                titleFont: { size: 13, weight: 'bold' },
                bodyFont: { size: 13, weight: 'bold' },
                padding: 12,
                cornerRadius: 12,
                displayColors: true,
                boxPadding: 4,
                mode: 'index',
                intersect: false
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: {
                    font: { size: 12, weight: 'bold' },
                    color: '#8A94A6'
                },
                border: { display: false }
            },
            y: {
                beginAtZero: true,
                grid: { color: '#EAECF0' },
                ticks: { 
                    stepSize: 1,
                    font: { size: 12, weight: 'bold' },
                    color: '#8A94A6',
                    padding: 12
                },
                border: { display: false }
            }
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false }
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
                this.activePolicies = data.policies.filter(p => p.status === 'Active').length;
                // Calculate Revenue
                this.totalRevenue = data.policies.reduce((sum, p) => sum + (p.totalPaid || 0), 0);

                this.totalClaims = data.claims.length;
                this.pendingClaims = data.claims.filter(c => c.status === 'Pending').length;
                // Calculate Payout
                this.totalClaimsPaid = data.claims
                    .filter(c => c.status === 'Approved')
                    .reduce((sum, c) => sum + (c.approvedAmount || 0), 0);

                // Update Line Chart Data (Last 6 Months)
                this.updateLineChartData(data.policies, data.claims);

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

    updateLineChartData(policies: any[], claims: any[]) {
        const labels: string[] = [];
        const policyCounts: number[] = [];
        const claimCounts: number[] = [];
        
        // Generate last 6 months labels
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            labels.push(this.datePipe.transform(d, 'MMM yyyy') || '');
            policyCounts.push(0);
            claimCounts.push(0);
        }

        // Aggregate Policies
        policies.forEach(p => {
            if (p.startDate) {
                const date = new Date(p.startDate);
                const monthStr = this.datePipe.transform(date, 'MMM yyyy');
                const idx = labels.indexOf(monthStr || '');
                if (idx !== -1) policyCounts[idx]++;
            }
        });

        // Aggregate Claims
        claims.forEach(c => {
            if (c.submittedAt) {
                const date = new Date(c.submittedAt);
                const monthStr = this.datePipe.transform(date, 'MMM yyyy');
                const idx = labels.indexOf(monthStr || '');
                if (idx !== -1) claimCounts[idx]++;
            }
        });

        this.lineChartData = {
            labels: labels,
            datasets: [
                {
                    data: policyCounts,
                    label: 'Policies Generated',
                    borderColor: '#00C48C',
                    backgroundColor: 'rgba(0, 196, 140, 0.1)',
                    borderWidth: 4,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: '#00C48C',
                    pointBorderWidth: 3,
                    pointRadius: 5,
                    fill: true,
                    tension: 0.4
                },
                {
                    data: claimCounts,
                    label: 'Claims Submitted',
                    borderColor: '#F59E0B',
                    backgroundColor: 'rgba(245, 158, 11, 0.05)',
                    borderWidth: 3,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: '#F59E0B',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    fill: true,
                    tension: 0.4
                }
            ]
        };
    }

    updateChartData() {
        let admins = 0; let agents = 0; let officers = 0; let customers = 0;
        this.users.forEach(u => {
            if (u.role === 'Admin') admins++;
            else if (u.role === 'Agent') agents++;
            else if (u.role === 'ClaimOfficer') officers++;
            else if (u.role === 'Customer') customers++;
        });

        this.doughnutChartData = {
            labels: ['Admins', 'Agents', 'Claim Officers', 'Customers'],
            datasets: [
                { 
                    data: [admins, agents, officers, customers], 
                    label: 'Users', 
                    backgroundColor: ['#A855F7', '#7C3AED', '#4C6FFF', '#00C48C'], 
                    borderWidth: 0,
                    hoverOffset: 4
                }
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
