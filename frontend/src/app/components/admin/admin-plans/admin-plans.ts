import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { PlanService } from '../../../services/plan/plan';
import { PlanDto } from '../../../models/policy/plan';
import { ToastService } from '../../../services/toast/toast';

@Component({
  selector: 'app-admin-plans',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuillModule],
  templateUrl: './admin-plans.html',
  styleUrl: './admin-plans.css'
})
export class AdminPlans implements OnInit {
  private planService = inject(PlanService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  plans: PlanDto[] = [];
  loadingPlans = true;
  editingPlanId: string | null = null;

  private fb = inject(FormBuilder);
  planForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    benefits: ['', Validators.required],
    premiumAmount: [0, [Validators.required, Validators.min(1)]],
    coverageAmount: [0, [Validators.required, Validators.min(1)]],
    durationInMonths: [12, [Validators.required, Validators.min(1)]],
    paymentFrequency: ['Monthly', Validators.required],
    planType: ['Casualty', Validators.required]
  });

  // Custom Dropdown States
  isPaymentDropdownOpen = false;
  isPlanTypeDropdownOpen = false;

  editorModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
      [{ 'list': 'ordered'}, { 'list': 'bullet' }], // lists
      [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
      [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
      [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
      [{ 'align': [] }],
      ['clean'],                                         // remove formatting button
      ['link']                         // link and image, video
    ]
  };

  get currentPaymentFreq() { return this.planForm.get('paymentFrequency')?.value; }
  get currentPlanType() { return this.planForm.get('planType')?.value; }

  setPaymentFreq(val: string) {
    this.planForm.patchValue({ paymentFrequency: val });
    this.isPaymentDropdownOpen = false;
  }

  setPlanType(val: string) {
    this.planForm.patchValue({ planType: val });
    this.isPlanTypeDropdownOpen = false;
  }

  ngOnInit() {
    this.loadPlans();
  }

  loadPlans() {
    this.loadingPlans = true;
    this.planService.getAllPlans(true).subscribe({
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

  editPlan(plan: PlanDto) {
    this.editingPlanId = plan.id;
    this.planForm.patchValue({
      name: plan.name,
      description: plan.description,
      benefits: plan.benefits,
      premiumAmount: plan.premiumAmount,
      coverageAmount: plan.coverageAmount,
      durationInMonths: plan.durationInMonths,
      paymentFrequency: plan.paymentFrequency,
      planType: plan.planType
    });
    // Scroll to form (optional, for UX)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.editingPlanId = null;
    this.resetForm();
  }

  resetForm() {
    this.planForm.reset({
      name: '',
      description: '',
      benefits: '',
      premiumAmount: 0,
      coverageAmount: 0,
      durationInMonths: 12,
      paymentFrequency: 'Monthly',
      planType: 'Casualty'
    });
  }

  createPlan() {
    if (this.planForm.valid) {
      if (this.editingPlanId) {
        this.planService.updatePlan(this.editingPlanId, this.planForm.value).subscribe({
          next: () => {
            this.loadPlans();
            this.resetForm();
            this.editingPlanId = null;
            this.toastService.success('Insurance Plan updated successfully!');
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error(err);
            this.toastService.error('Failed to update plan. Please verify the inputs.');
          }
        });
      } else {
        this.planService.createPlan(this.planForm.value).subscribe({
          next: () => {
            this.loadPlans();
            this.resetForm();
            this.toastService.success('Insurance Plan created successfully!');
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error(err);
            this.toastService.error('Failed to create plan. Please verify the inputs.');
          }
        });
      }
    } else {
      this.toastService.warning('Please fill out all required fields properly.');
    }
  }

  deactivatePlan(id: string) {
    if (confirm('Are you sure you want to pause/deactivate this package? It will no longer be visible to customers.')) {
      this.planService.deactivatePlan(id).subscribe({
        next: () => {
          this.loadPlans();
          this.toastService.success('Plan deactivated successfully');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.toastService.error('Failed to deactivate plan.');
        }
      });
    }
  }

  deletePlan(id: string) {
    if (confirm('Are you ABSOLUTELY sure you want to completely delete this plan from the database? This action is permanent and cannot be undone.')) {
      this.planService.deletePlan(id).subscribe({
        next: () => {
          this.loadPlans();
          this.toastService.success('Plan permanently deleted');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.toastService.error('Failed to delete plan.');
        }
      });
    }
  }

  resumePlan(id: string) {
    this.planService.resumePlan(id).subscribe({
      next: () => {
        this.loadPlans();
        this.toastService.success('Plan reactivated successfully');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.toastService.error('Failed to reactivate plan.');
      }
    });
  }
}
