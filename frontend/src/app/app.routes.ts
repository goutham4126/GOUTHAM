import { Routes } from '@angular/router';
import { guestGuard } from './guards/guest/guest-guard';
import { authGuard } from './guards/auth/auth-guard';
import { roleGuard } from './guards/role/role-guard';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./components/common/home/home').then(m => m.Home)
    },
    {
        path: 'login',
        loadComponent: () => import('./components/common/login/login').then(m => m.Login),
        canActivate: [guestGuard]
    },
    {
        path: 'register',
        loadComponent: () => import('./components/common/register/register').then(m => m.Register),
        canActivate: [guestGuard]
    },

    // Admin Routes
    {
        path: 'admin/dashboard',
        redirectTo: 'admin/users',
        pathMatch: 'full'
    },
    {
        path: 'admin/users',
        loadComponent: () => import('./components/admin/admin-users/admin-users').then(m => m.AdminUsers),
        canActivate: [authGuard, roleGuard],
        data: { role: 'Admin' }
    },
    {
        path: 'admin/plans',
        loadComponent: () => import('./components/admin/admin-plans/admin-plans').then(m => m.AdminPlans),
        canActivate: [authGuard, roleGuard],
        data: { role: 'Admin' }
    },
    {
        path: 'admin/policies',
        loadComponent: () => import('./components/admin/admin-policies/admin-policies').then(m => m.AdminPolicies),
        canActivate: [authGuard, roleGuard],
        data: { role: 'Admin' }
    },
    {
        path: 'admin/claims',
        loadComponent: () => import('./components/admin/admin-claims/admin-claims').then(m => m.AdminClaims),
        canActivate: [authGuard, roleGuard],
        data: { role: 'Admin' }
    },

    // Customer Routes
    {
        path: 'customer/dashboard',
        redirectTo: 'customer/policies',
        pathMatch: 'full'
    },
    {
        path: 'customer/plans',
        loadComponent: () => import('./components/customer/customer-plans/customer-plans').then(m => m.CustomerPlans),
        canActivate: [authGuard, roleGuard],
        data: { role: 'Customer' }
    },
    {
        path: 'customer/policies',
        loadComponent: () => import('./components/customer/customer-policies/customer-policies').then(m => m.CustomerPolicies),
        canActivate: [authGuard, roleGuard],
        data: { role: 'Customer' }
    },
    {
        path: 'customer/claims',
        loadComponent: () => import('./components/customer/customer-claims/customer-claims').then(m => m.CustomerClaims),
        canActivate: [authGuard, roleGuard],
        data: { role: 'Customer' }
    },
    {
        path: 'customer/invoices',
        loadComponent: () => import('./components/customer/customer-invoices/customer-invoices').then(m => m.CustomerInvoices),
        canActivate: [authGuard, roleGuard],
        data: { role: 'Customer' }
    },

    // Agent Routes
    {
        path: 'agent/dashboard',
        redirectTo: 'agent/policies',
        pathMatch: 'full'
    },
    {
        path: 'agent/policies',
        loadComponent: () => import('./components/agent/agent-policies/agent-policies').then(m => m.AgentPolicies),
        canActivate: [authGuard, roleGuard],
        data: { role: 'Agent' }
    },
    {
        path: 'agent/customers',
        loadComponent: () => import('./components/agent/agent-customers/agent-customers').then(m => m.AgentCustomers),
        canActivate: [authGuard, roleGuard],
        data: { role: 'Agent' }
    },

    // Claim Officer Routes
    {
        path: 'claim-officer/dashboard',
        loadComponent: () => import('./components/claims-officer/claims-officer-dashboard/claims-officer-dashboard').then(m => m.ClaimsOfficerDashboard),
        canActivate: [authGuard, roleGuard],
        data: { role: 'ClaimOfficer' }
    },

    // Profile Routes (shared component, per-role access)
    {
        path: 'customer/profile',
        loadComponent: () => import('./components/common/profile/profile').then(m => m.Profile),
        canActivate: [authGuard, roleGuard],
        data: { role: 'Customer' }
    },
    {
        path: 'admin/profile',
        loadComponent: () => import('./components/common/profile/profile').then(m => m.Profile),
        canActivate: [authGuard, roleGuard],
        data: { role: 'Admin' }
    },
    {
        path: 'agent/profile',
        loadComponent: () => import('./components/common/profile/profile').then(m => m.Profile),
        canActivate: [authGuard, roleGuard],
        data: { role: 'Agent' }
    },
    {
        path: 'claim-officer/profile',
        loadComponent: () => import('./components/common/profile/profile').then(m => m.Profile),
        canActivate: [authGuard, roleGuard],
        data: { role: 'ClaimOfficer' }
    },

    {
        path: 'error',
        loadComponent: () => import('./components/common/error/error').then(m => m.ErrorComponent)
    },
    { path: '**', redirectTo: '' }
];
