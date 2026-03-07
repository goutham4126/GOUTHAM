import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user/user';
import { UserDto } from '../../../models/auth/auth';
import { ToastService } from '../../../services/toast/toast';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [FormsModule, BaseChartDirective],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css'
})
export class AdminUsers implements OnInit {
  private userService = inject(UserService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  users: UserDto[] = [];
  loadingUsers = true;

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
    this.loadUsers();
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

  loadUsers() {
    this.loadingUsers = true;
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.updateChartData(); // Update chart when users are loaded
        this.loadingUsers = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingUsers = false;
        this.cdr.detectChanges();
      }
    });
  }


  deleteUser(userId: string, name: string) {
    this.toastService.confirm('Delete User', `Are you sure you want to delete user ${name}? This action cannot be undone.`, () => {
      this.userService.deleteUser(userId).subscribe({
        next: () => {
          this.toastService.success(`User ${name} successfully deleted.`);
          this.loadUsers();
        },
        error: (err) => {
          console.error(err);
          this.toastService.error('Failed to delete user.');
        }
      });
    });
  }
}
