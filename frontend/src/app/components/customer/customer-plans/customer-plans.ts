import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PlanService } from '../../../services/plan/plan';
import { PolicyRequestService } from '../../../services/policy-request/policy-request';
import { PlanDto } from '../../../models/policy/plan';
import { PolicyRequest } from '../../../models/policy-request/policy-request';
import { ToastService } from '../../../services/toast/toast';

@Component({
    selector: 'app-customer-plans',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './customer-plans.html'
})
export class CustomerPlans implements OnInit {
    private planService = inject(PlanService);
    private policyRequestService = inject(PolicyRequestService);
    private toastService = inject(ToastService);
    public router = inject(Router);
    private cdr = inject(ChangeDetectorRef);
    private fb = inject(FormBuilder);

    plans: PlanDto[] = [];
    loading = true;

    // Request Modal State
    selectedPlan: PlanDto | null = null;
    isRequesting: boolean = false;
    panDocument: File | null = null;
    addressDocument: File | null = null;

    requestForm!: FormGroup;

    // Success Dialog State
    successDialogVisible = false;
    createdRequest: PolicyRequest | null = null;

    ngOnInit() {
        this.loading = true;
        this.planService.getAllPlans().subscribe({
            next: (data) => {
                this.plans = data;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.loading = false;
                this.cdr.detectChanges();
            }
        });

        this.requestForm = this.fb.group({
            paymentFrequency: ['Monthly', Validators.required],
            durationInMonths: [12, [Validators.required]]
        });

        // Set the custom validator which depends on the plan
        this.requestForm.get('durationInMonths')?.setValidators([
            Validators.required,
            this.durationValidator.bind(this)
        ]);

        // Re-validate duration when payment frequency changes
        this.requestForm.get('paymentFrequency')?.valueChanges.subscribe(() => {
            if (this.selectedPlan) {
                this.requestForm.get('durationInMonths')?.updateValueAndValidity();
                this.cdr.detectChanges();
            }
        });
    }

    /** Custom Validator for Duration based on Plan Duration and Payment Frequency */
    durationValidator(control: AbstractControl): ValidationErrors | null {
        if (!this.selectedPlan || !control.value) return null;

        const duration = Number(control.value);
        const frequency = this.requestForm.get('paymentFrequency')?.value;
        const planDuration = this.selectedPlan.durationInMonths;

        if (!Number.isInteger(duration)) {
            return { 'notInteger': true };
        }

        if (duration < planDuration) {
            return { 'minDuration': { required: planDuration, actual: duration } };
        }

        if (duration <= 0) {
            return { 'min': true };
        }

        if (frequency === 'Quarterly' && duration % 3 !== 0) {
            return { 'invalidQuarterly': true };
        }

        if (frequency === 'Yearly' && duration % 12 !== 0) {
            return { 'invalidYearly': true };
        }

        return null;
    }

    // Helpers to get form values
    get durationInMonths(): number {
        return this.requestForm.get('durationInMonths')?.value || 0;
    }

    get paymentFrequency(): string {
        return this.requestForm.get('paymentFrequency')?.value || 'Monthly';
    }

    promptRequest(plan: PlanDto) {
        this.selectedPlan = plan;

        // Reset form to defaults when opening modal
        this.requestForm.patchValue({
            durationInMonths: plan.durationInMonths,
            paymentFrequency: 'Monthly'
        });

        this.panDocument = null;
        this.addressDocument = null;

        // Ensure validation runs immediately since selectedPlan changed
        this.requestForm.get('durationInMonths')?.updateValueAndValidity();
    }

    cancelRequest() {
        this.selectedPlan = null;
        this.panDocument = null;
        this.addressDocument = null;
        this.requestForm.reset({ paymentFrequency: 'Monthly', durationInMonths: 12 });
    }

    /** Dynamically calculates risk score based on business rules */
    get riskScore(): number {
        if (!this.selectedPlan) return 0;

        let score = 5; // Base score

        // Plan Risk
        const planName = this.selectedPlan.planType.toLowerCase();
        if (planName.includes('disaster')) {
            score += 20;
        } else {
            score += 15; // Fallback for Casualty and others
        }

        // Duration Risk: Capped at 15
        score += Math.min(15, 1.2 * (this.durationInMonths / 12));

        // Payment Frequency Risk
        if (this.paymentFrequency === 'Monthly') score += 6;
        else if (this.paymentFrequency === 'Quarterly') score += 3;
        // Yearly is 0

        // Coverage Risk: Capped at 15
        score += Math.min(15, (this.computedCoverage / 500000) * 2);

        return Math.min(100, Math.floor(score));
    }

    /** Returns risk level details based on calculated score */
    get riskLevel(): { label: string, colorClass: string, bgClass: string, indicatorClass: string } {
        const score = this.riskScore;
        if (score <= 35) {
            return { label: 'Moderate Risk', colorClass: 'text-green-700', bgClass: 'bg-green-50 border-green-200', indicatorClass: 'bg-green-500' };
        } else if (score <= 60) {
            return { label: 'High Risk', colorClass: 'text-yellow-700', bgClass: 'bg-yellow-50 border-yellow-200', indicatorClass: 'bg-yellow-500' };
        } else if (score <= 80) {
            return { label: 'Very High Risk', colorClass: 'text-orange-700', bgClass: 'bg-orange-50 border-orange-200', indicatorClass: 'bg-orange-500' };
        } else {
            return { label: 'Critical Risk', colorClass: 'text-red-700', bgClass: 'bg-red-50 border-red-200', indicatorClass: 'bg-red-600' };
        }
    }

    /** Calculates the installment amount based on frequency */
    get computedInstallmentAmount(): number {
        if (!this.selectedPlan) return 0;
        const base = this.selectedPlan.premiumAmount;
        if (this.paymentFrequency === 'Quarterly') return base * 3;
        if (this.paymentFrequency === 'Yearly') return base * 12;
        return base; // Monthly
    }

    /** Calculates projected coverage for the chosen duration */
    get computedCoverage(): number {
        if (!this.selectedPlan) return 0;
        const selectedMonths = this.durationInMonths;
        const planDefaultMonths = this.selectedPlan.durationInMonths > 0 ? this.selectedPlan.durationInMonths : selectedMonths;
        return this.selectedPlan.coverageAmount * (selectedMonths / planDefaultMonths);
    }

    get frequencyLabel(): string {
        return this.paymentFrequency === 'Monthly' ? 'month'
            : this.paymentFrequency === 'Quarterly' ? 'quarter'
                : 'year';
    }

    onFileChange(event: any, docType: 'pan' | 'address') {
        const file = event.target.files[0];
        if (file) {
            if (docType === 'pan') this.panDocument = file;
            else this.addressDocument = file;
        }
    }

    confirmRequest() {
        if (this.selectedPlan && this.requestForm.valid && this.panDocument && this.addressDocument) {
            this.isRequesting = true;
            this.cdr.detectChanges();

            const reqPlanId = this.selectedPlan.id;
            const reqDuration = this.durationInMonths;
            const reqFrequency = this.paymentFrequency;
            const reqPan = this.panDocument;
            const reqAddress = this.addressDocument;

            this.policyRequestService.createRequest(
                reqPlanId,
                reqDuration,
                reqFrequency,
                reqPan,
                reqAddress
            ).subscribe({
                next: (request: PolicyRequest) => {
                    this.createdRequest = request;
                    this.selectedPlan = null;
                    this.panDocument = null;
                    this.addressDocument = null;
                    this.isRequesting = false;
                    this.successDialogVisible = true;
                    this.requestForm.reset({ paymentFrequency: 'Monthly', durationInMonths: 12 });
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('Submission error:', err);
                    this.toastService.error('There was an issue submitting your policy request. Please try again.');
                    this.isRequesting = false;
                    this.cdr.detectChanges();
                }
            });
        } else {
            this.requestForm.markAllAsTouched();
            if (!this.requestForm.valid) {
                this.toastService.error('Please fix the errors in duration or frequency fields.');
            } else {
                this.toastService.error('Please upload both PAN card and Address Proof documents.');
            }
        }
    }

    closeSuccessDialog() {
        this.successDialogVisible = false;
        this.createdRequest = null;
        this.router.navigate(['/customer/my-policy-requests']);
    }
}
