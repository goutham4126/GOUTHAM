import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PlanService } from '../../../services/plan';
import { PlanDto } from '../../../models/policy/plan';

@Component({
  selector: 'app-admin-plans',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-plans.html',
  styleUrl: './admin-plans.css'
})
export class AdminPlans implements OnInit {
  private planService = inject(PlanService);
  private cdr = inject(ChangeDetectorRef);

  plans: PlanDto[] = [];
  loadingPlans = true;

  private fb = inject(FormBuilder);
  planForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    premiumAmount: [0, [Validators.required, Validators.min(1)]],
    coverageAmount: [0, [Validators.required, Validators.min(1)]],
    durationInMonths: [12, [Validators.required, Validators.min(1)]],
    paymentFrequency: ['Monthly', Validators.required]
  });

  ngOnInit() {
    this.loadPlans();
  }

  loadPlans() {
    this.loadingPlans = true;
    this.planService.getAllPlans().subscribe({
      next: (data) => {
        this.plans = data;
        this.loadingPlans = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingPlans = false;
        this.cdr.detectChanges();
      }
    });
  }

  createPlan() {
    if (this.planForm.valid) {
      this.planService.createPlan(this.planForm.value).subscribe({
        next: () => {
          this.loadPlans();
          this.planForm.reset({
            name: '',
            description: '',
            premiumAmount: 0,
            coverageAmount: 0,
            durationInMonths: 12,
            paymentFrequency: 'Monthly'
          });
          alert('Insurance Plan created successfully!');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          alert('Failed to create plan. Please verify the inputs.');
        }
      });
    } else {
      alert('Please fill out all required fields properly.');
    }
  }
}
