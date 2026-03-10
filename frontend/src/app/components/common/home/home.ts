import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  workflowSteps = [
    { title: 'Customer Requests', desc: 'Customer browses plans and requests a policy.', icon: 'search' },
    { title: 'Agent Approval', desc: 'Agent reviews and approves the request.', icon: 'user-check' },
    { title: 'Policy Purchase', desc: 'Customer securely purchases the approved policy.', icon: 'credit-card' },
    { title: 'Raise a Claim', desc: 'In case of a disaster, customer can raise a claim.', icon: 'alert-triangle' },
    { title: 'Claim Verification', desc: 'Claims officer verifies and approves/rejects.', icon: 'clipboard' },
    { title: 'System Management', desc: 'Admin oversees the entire system operations.', icon: 'settings' }
  ];

  systemRoles = [
    { name: 'Admin', desc: 'Manages users, agents, claims officers, and insurance plans.', bg: 'bg-blue-100', text: 'text-blue-600', icon: 'shield' },
    { name: 'Agent', desc: 'Reviews and approves policy purchase requests.', bg: 'bg-emerald-100', text: 'text-emerald-600', icon: 'briefcase' },
    { name: 'Customer', desc: 'Browses plans, buys policies, and raises claims.', bg: 'bg-violet-100', text: 'text-violet-600', icon: 'users' },
    { name: 'Claims Officer', desc: 'Reviews and approves or rejects insurance claims.', bg: 'bg-orange-100', text: 'text-orange-600', icon: 'file-text' }
  ];

  insurancePlans = [
    { title: 'Earthquake Insurance', desc: 'Comprehensive coverage for property damage resulting from earthquakes.', benefits: ['Structural Damage Fix', 'Temporary Housing', 'Debris Removal'], popular: false, price: 'From $49/mo' },
    { title: 'Flood Insurance', desc: 'Protect your home and belongings from devastating flood damage.', benefits: ['Water Damage Restore', 'Appliance Replacement', 'Basement Protection'], popular: true, price: 'From $39/mo' },
    { title: 'Disaster Protection', desc: 'All-inclusive coverage against severe weather and natural disasters.', benefits: ['Storm Damage Wrap', 'Wildfire Protection', 'Emergency Funds'], popular: false, price: 'From $79/mo' }
  ];

  platformBenefits = [
    { title: 'Fast Claim Processing', desc: 'Get your claims reviewed and processed rapidly without delays.', icon: 'zap' },
    { title: 'Secure Policy Management', desc: 'State-of-the-art encryption ensures your policies are safe.', icon: 'lock' },
    { title: 'Role-based Workflow', desc: 'Distinct views customized for customers, agents, officers & admins.', icon: 'git-merge' },
    { title: 'Easy Tracking', desc: 'Monitor the status of your policies and claims in real-time.', icon: 'activity' },
    { title: 'Reliable Coverage', desc: 'Guaranteed financial protection when disaster strikes.', icon: 'umbrella' }
  ];
}
