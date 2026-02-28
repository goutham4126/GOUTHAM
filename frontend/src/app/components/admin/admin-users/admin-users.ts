import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user';
import { UserDto } from '../../../models/auth/auth';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css'
})
export class AdminUsers implements OnInit {
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);

  users: UserDto[] = [];
  loadingUsers = true;

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loadingUsers = true;
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.loadingUsers = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingUsers = false;
        this.cdr.detectChanges();
      }
    });
  }

  updateRole(userId: string, newRole: string) {
    if (confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      this.userService.updateUserRole(userId, { role: newRole }).subscribe({
        next: () => {
          alert(`Role successfully updated to ${newRole}`);
          this.loadUsers();
        },
        error: (err) => {
          console.error(err);
          alert('Failed to update role.');
          this.loadUsers();
        }
      });
    } else {
      this.loadUsers();
    }
  }
}
