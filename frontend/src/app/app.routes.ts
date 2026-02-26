import { Routes } from '@angular/router';
import { Login } from './components/common/login/login';
import { Register } from './components/common/register/register';
import { Home } from './components/common/home/home';
import { AdminDashboard } from './components/admin/admin-dashboard/admin-dashboard';
import { AgentDashboard } from './components/agent/agent-dashboard/agent-dashboard';
import { ClaimsOfficerDashboard } from './components/claims-officer/claims-officer-dashboard/claims-officer-dashboard';
import { CustomerDashboard } from './components/customer/customer-dashboard/customer-dashboard';
import { roleGuard } from './guards/role-guard';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
    {
        path: "login",
        component : Login
    },
    {
        path: "register",
        component : Register
    },
    {
        path: "",
        component: Home
    },
    {
        path : "admin/dashboard",
        component: AdminDashboard,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['Admin'] }
    },
    {
        path: "agent/dashboard",
        component: AgentDashboard,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['Agent'] }
    },
    {
        path: "customer/dashboard",
        component: CustomerDashboard,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['Customer'] }
    },
    {
        path: "claims-officer/dashboard",
        component: ClaimsOfficerDashboard,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['ClaimOfficer'] }
    },
    { 
        path: '**', 
        redirectTo: '' 
    }
];