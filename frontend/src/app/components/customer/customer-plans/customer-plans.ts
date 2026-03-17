import { Component, OnInit, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PlanService } from '../../../services/plan/plan';
import { PolicyRequestService } from '../../../services/policy-request/policy-request';
import { PlanDto } from '../../../models/policy/plan';
import { PolicyRequest } from '../../../models/policy-request/policy-request';
import { ToastService } from '../../../services/toast/toast';
import { InsuranceCallService } from '../../../services/insurance-call/insurance-call.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
    selector: 'app-customer-plans',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule],
    templateUrl: './customer-plans.html',
    styles: [`
        /* Apply checkmarks exclusively to standard text and list items */
        ::ng-deep .benefits-list p:not(:empty),
        ::ng-deep .benefits-list li {
            position: relative;
            padding-left: 1.5rem;
            margin-bottom: 0.5rem;
            list-style: none;
        }

        ::ng-deep .benefits-list p:not(:empty)::before,
        ::ng-deep .benefits-list li::before {
            content: '✓';
            position: absolute;
            left: 0;
            color: #10b981;
            font-weight: bold;
        }

        /* Prevent empty Quill paragraphs from rendering a checkmark */
        ::ng-deep .benefits-list p:empty {
            display: none;
        }

        /* Reset lists so they don't have default indents */
        ::ng-deep .benefits-list ul,
        ::ng-deep .benefits-list ol {
            padding-left: 0;
            margin: 0;
        }
        
        ::ng-deep .benefits-list {
            line-height: 1.6;
            color: var(--color-text-muted);
        }

        ::ng-deep .benefits-list br {
            display: none;
        }

        /* Ensure heading tags stay untouched and just scale naturally */
        ::ng-deep .benefits-list h1,
        ::ng-deep .benefits-list h2,
        ::ng-deep .benefits-list h3,
        ::ng-deep .benefits-list h4,
        ::ng-deep .benefits-list h5,
        ::ng-deep .benefits-list h6 {
            color: var(--color-text-primary);
            font-weight: bold;
            margin-top: 1rem;
            margin-bottom: 0.5rem;
            padding-left: 0;
        }
    `]
})
export class CustomerPlans implements OnInit, OnDestroy {
    private planService = inject(PlanService);
    private policyRequestService = inject(PolicyRequestService);
    private toastService = inject(ToastService);
    public router = inject(Router);
    private cdr = inject(ChangeDetectorRef);
    private fb = inject(FormBuilder);
    private insuranceCallService = inject(InsuranceCallService);
    private sanitizer = inject(DomSanitizer);

    plans: PlanDto[] = [];
    loading = true;

    // AI Call State
    isCallingAgent = false;
    callSuccess = false;
    callCallId = '';
    callErrorMsg = '';

    // Request Modal State
    selectedPlan: PlanDto | null = null;
    isRequesting: boolean = false;
    panDocument: File | null = null;
    addressDocument: File | null = null;

    requestForm!: FormGroup;

    // Wizard State
    wizardStep: number = 1;

    // PAN State
    panStatus: 'idle' | 'verifying' | 'verified' | 'error' = 'idle';
    panDetails: any = null;
    panErrorMsg: string = '';

    // Aadhaar State
    aadhaarStatus: 'idle' | 'generating' | 'otp_sent' | 'verifying' | 'verified' | 'error' = 'idle';
    aadhaarDetails: any = null;
    aadhaarOtp: string = '';
    otpArray: string[] = ['', '', '', '', '', ''];
    aadhaarErrorMsg: string = '';
    otpTimer: number = 0;
    otpInterval: any;

    // Success Dialog State
    successDialogVisible = false;
    createdRequest: PolicyRequest | null = null;

    isFrequencyDropdownOpen = false;

    toggleFrequencyDropdown() {
        this.isFrequencyDropdownOpen = !this.isFrequencyDropdownOpen;
    }

    selectFrequency(frequency: string) {
        this.requestForm.patchValue({ paymentFrequency: frequency });
        this.isFrequencyDropdownOpen = false;
        this.cdr.detectChanges();
    }

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

        this.requestForm.get('durationInMonths')?.setValidators([
            Validators.required,
            this.durationValidator.bind(this)
        ]);

        this.requestForm.get('paymentFrequency')?.valueChanges.subscribe(() => {
            if (this.selectedPlan) {
                this.requestForm.get('durationInMonths')?.updateValueAndValidity();
                this.cdr.detectChanges();
            }
        });
    }

    ngOnDestroy() {
        this.clearOtpTimer();
    }

    sanitizeHtml(html: string): SafeHtml {
        if (!html) return '';
        
        let processedHtml = html;
        
        // If it looks like plain text without any HTML tags (from the old markdown editor)
        if (!/<[a-z][\s\S]*>/i.test(processedHtml)) {
            // Replace newlines followed by dashes with list items
            const items = processedHtml.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            processedHtml = '<ul>' + items.map(item => {
                // remove leading dash if present
                const text = item.replace(/^-\s*/, '');
                return `<li>${text}</li>`;
            }).join('') + '</ul>';
        }

        return this.sanitizer.bypassSecurityTrustHtml(processedHtml);
    }

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

    get durationInMonths(): number {
        return this.requestForm.get('durationInMonths')?.value || 0;
    }

    get paymentFrequency(): string {
        return this.requestForm.get('paymentFrequency')?.value || 'Monthly';
    }

    callAiAgent() {
        this.isCallingAgent = true;
        this.callSuccess = false;
        this.callErrorMsg = '';
        this.callCallId = '';
        this.cdr.detectChanges();

        this.insuranceCallService.initiateCall().subscribe({
            next: (res) => {
                this.isCallingAgent = false;
                this.callSuccess = true;
                this.callCallId = res.callId || res.status;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.isCallingAgent = false;
                this.callErrorMsg = err.error?.detail || err.error?.title || err.message || 'Failed to initiate call with AI agent.';
                this.cdr.detectChanges();
            }
        });
    }

    promptRequest(plan: PlanDto) {
        this.selectedPlan = plan;
        this.wizardStep = 1;
        this.resetKycState();

        this.requestForm.patchValue({
            durationInMonths: plan.durationInMonths,
            paymentFrequency: 'Monthly'
        });

        this.requestForm.get('durationInMonths')?.updateValueAndValidity();
    }

    resetKycState() {
        this.panDocument = null;
        this.addressDocument = null;
        this.panStatus = 'idle';
        this.panDetails = null;
        this.panErrorMsg = '';
        this.aadhaarStatus = 'idle';
        this.aadhaarDetails = null;
        this.aadhaarOtp = '';
        this.otpArray = ['', '', '', '', '', ''];
        this.aadhaarErrorMsg = '';
        this.clearOtpTimer();
        localStorage.removeItem('aadhaarRefId');
    }

    cancelRequest() {
        this.selectedPlan = null;
        this.resetKycState();
        this.requestForm.reset({ paymentFrequency: 'Monthly', durationInMonths: 12 });
    }

    onFileChange(event: any, docType: 'pan' | 'address') {
        const file = event.target.files[0];
        if (file) {
            if (docType === 'pan') {
                this.panDocument = file;
                this.panStatus = 'idle';
            }
            else {
                this.addressDocument = file;
                this.aadhaarStatus = 'idle';
            }
        }
    }

    // --- PAN Logic ---
    async verifyPan() {
        if (!this.panDocument) return;
        this.panStatus = 'verifying';
        this.panErrorMsg = '';
        this.cdr.detectChanges();

        try {
            const formData = new FormData();
            formData.append('panCard', this.panDocument);
            
            const response = await fetch('https://goutham4126.app.n8n.cloud/webhook/kyc/pan/verify', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            
            if (data.success && data.kyc_status === 'VERIFIED') {
                this.panStatus = 'verified';
                this.panDetails = data.ocr;
            } else {
                this.panStatus = 'error';
                this.panErrorMsg = 'PAN Verification failed. Please ensure the document is clear.';
            }
        } catch (err) {
            this.panStatus = 'error';
            this.panErrorMsg = 'Network error during PAN verification.';
        }
        this.cdr.detectChanges();
    }
    
    // --- Aadhaar Logic ---
    async generateAadhaarOtp() {
        if (!this.addressDocument) return;
        this.aadhaarStatus = 'generating';
        this.aadhaarErrorMsg = '';
        this.cdr.detectChanges();

        try {
            const formData = new FormData();
            formData.append('aadhaarCard', this.addressDocument);
            // using the webhook
            const response = await fetch('https://goutham4126.app.n8n.cloud/webhook/kyc/aadhaar/otp/generate', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            
            if (data.success) {
                this.aadhaarStatus = 'otp_sent';
                localStorage.setItem('aadhaarRefId', data.reference_id.toString());
                this.aadhaarOtp = '';
                this.otpArray = ['', '', '', '', '', ''];
                this.startOtpTimer();
            } else {
                this.aadhaarStatus = 'error';
                this.aadhaarErrorMsg = data.message || 'OTP generation failed.';
            }
        } catch (err) {
            this.aadhaarStatus = 'error';
            this.aadhaarErrorMsg = 'Network error generating OTP.';
        }
        this.cdr.detectChanges();
    }
    
    async verifyAadhaarOtp() {
        if (!this.aadhaarOtp) return;
        
        const refId = localStorage.getItem('aadhaarRefId');
        if (!refId) {
            this.aadhaarErrorMsg = 'Session expired. Please generate OTP again.';
            this.aadhaarStatus = 'error';
            return;
        }

        this.aadhaarStatus = 'verifying';
        this.aadhaarErrorMsg = '';
        this.cdr.detectChanges();

        try {
            const formData = new FormData();
            formData.append('reference_id', refId);
            formData.append('otp', this.aadhaarOtp);
            
            const response = await fetch('https://goutham4126.app.n8n.cloud/webhook/kyc/aadhaar/otp/verify', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            
            if (data.success && data.kyc_status === 'VERIFIED') {
                this.aadhaarStatus = 'verified';
                this.aadhaarDetails = data.aadhaar_details;
                this.clearOtpTimer();
                localStorage.removeItem('aadhaarRefId');
            } else {
                this.aadhaarStatus = 'error';
                this.aadhaarErrorMsg = 'OTP Verification failed or invalid.';
            }
        } catch (err) {
            this.aadhaarStatus = 'error';
            this.aadhaarErrorMsg = 'Network error verifying OTP.';
        }
        this.cdr.detectChanges();
    }
    
    // OTP Input Controls
    onOtpInput(event: any, index: number) {
        const value = event.target.value;
        if (/[^0-9]/.test(value)) {
            event.target.value = this.otpArray[index];
            return;
        }
        this.otpArray[index] = value;
        this.updateAadhaarOtp();
        
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-input-${index + 1}`);
            if (nextInput) {
                nextInput.focus();
            }
        }
    }

    onOtpKeydown(event: KeyboardEvent, index: number) {
        if (event.key === 'Backspace') {
            if (!this.otpArray[index] && index > 0) {
                const prevInput = document.getElementById(`otp-input-${index - 1}`);
                if (prevInput) {
                    prevInput.focus();
                    this.otpArray[index - 1] = '';
                    this.updateAadhaarOtp();
                }
            } else {
                this.otpArray[index] = '';
                this.updateAadhaarOtp();
            }
        } else if (event.key === 'ArrowLeft' && index > 0) {
            document.getElementById(`otp-input-${index - 1}`)?.focus();
        } else if (event.key === 'ArrowRight' && index < 5) {
            document.getElementById(`otp-input-${index + 1}`)?.focus();
        }
    }

    onOtpPaste(event: ClipboardEvent) {
        event.preventDefault();
        const pastedData = event.clipboardData?.getData('text');
        if (pastedData) {
            const numbers = pastedData.replace(/[^0-9]/g, '').slice(0, 6);
            for (let i = 0; i < numbers.length; i++) {
                this.otpArray[i] = numbers[i];
            }
            this.updateAadhaarOtp();
            const focusIndex = Math.min(numbers.length, 5);
            document.getElementById(`otp-input-${focusIndex}`)?.focus();
        }
    }

    updateAadhaarOtp() {
        this.aadhaarOtp = this.otpArray.join('');
    }

    startOtpTimer() {
        this.otpTimer = 60;
        this.clearOtpTimer();
        this.otpInterval = setInterval(() => {
            if (this.otpTimer > 0) {
                this.otpTimer--;
                this.cdr.detectChanges();
            } else {
                this.clearOtpTimer();
                if (this.aadhaarStatus === 'otp_sent') {
                    this.aadhaarStatus = 'error';
                    this.aadhaarErrorMsg = 'OTP expired. Please try again.';
                    localStorage.removeItem('aadhaarRefId');
                    this.cdr.detectChanges();
                }
            }
        }, 1000);
    }
    
    clearOtpTimer() {
        if (this.otpInterval) {
            clearInterval(this.otpInterval);
            this.otpInterval = null;
        }
    }

    goToStep(step: number) {
        if (step === 2 && this.panStatus !== 'verified') return;
        if (step === 3 && this.aadhaarStatus !== 'verified') return;
        this.wizardStep = step;
    }

    // --- Calculations ---

    get riskScore(): number {
        if (!this.selectedPlan) return 0;
        let score = 5;
        const planName = this.selectedPlan.planType.toLowerCase();
        if (planName.includes('disaster')) score += 20;
        else score += 15;
        score += Math.min(15, 1.2 * (this.durationInMonths / 12));
        if (this.paymentFrequency === 'Monthly') score += 6;
        else if (this.paymentFrequency === 'Quarterly') score += 3;
        score += Math.min(15, (this.computedCoverage / 500000) * 2);
        return Math.min(100, Math.floor(score));
    }

    get riskLevel(): { label: string, colorClass: string, bgClass: string, indicatorClass: string } {
        const score = this.riskScore;
        if (score <= 35) return { label: 'Moderate Risk', colorClass: 'text-green-700', bgClass: 'bg-green-50 border-green-200', indicatorClass: 'bg-green-500' };
        else if (score <= 60) return { label: 'High Risk', colorClass: 'text-yellow-700', bgClass: 'bg-yellow-50 border-yellow-200', indicatorClass: 'bg-yellow-500' };
        else if (score <= 80) return { label: 'Very High Risk', colorClass: 'text-orange-700', bgClass: 'bg-orange-50 border-orange-200', indicatorClass: 'bg-orange-500' };
        else return { label: 'Critical Risk', colorClass: 'text-red-700', bgClass: 'bg-red-50 border-red-200', indicatorClass: 'bg-red-600' };
    }

    get computedInstallmentAmount(): number {
        if (!this.selectedPlan) return 0;
        const base = this.selectedPlan.premiumAmount;
        const riskMultiplier = 1 + (this.riskScore / 100);
        if (this.paymentFrequency === 'Quarterly') return base * 3 * riskMultiplier;
        if (this.paymentFrequency === 'Yearly') return base * 12 * riskMultiplier;
        return base * riskMultiplier;
    }

    get computedCoverage(): number {
        if (!this.selectedPlan) return 0;
        const selectedMonths = this.durationInMonths;
        const planDefaultMonths = this.selectedPlan.durationInMonths > 0 ? this.selectedPlan.durationInMonths : selectedMonths;
        return this.selectedPlan.coverageAmount * (selectedMonths / planDefaultMonths);
    }

    get frequencyLabel(): string {
        return this.paymentFrequency === 'Monthly' ? 'month' : this.paymentFrequency === 'Quarterly' ? 'quarter' : 'year';
    }

    get frequencyInterval(): number {
        return this.paymentFrequency === 'Quarterly' ? 3 : this.paymentFrequency === 'Yearly' ? 12 : 1;
    }

    get baseInstallment(): number {
        if (!this.selectedPlan) return 0;
        return this.selectedPlan.premiumAmount * this.frequencyInterval;
    }

    get riskAdjustmentAmount(): number {
        return this.baseInstallment * (this.riskScore / 100);
    }

    get numberOfInstallments(): number {
        if (this.frequencyInterval === 0) return 0;
        return Math.ceil(this.durationInMonths / this.frequencyInterval);
    }

    get totalPremium(): number {
        return this.computedInstallmentAmount * this.numberOfInstallments;
    }

    confirmRequest() {
        if (this.selectedPlan && this.requestForm.valid && this.panDetails && this.aadhaarDetails) {
            this.isRequesting = true;
            this.cdr.detectChanges();

            const reqPlanId = this.selectedPlan.id;
            const reqDuration = this.durationInMonths;
            const reqFrequency = this.paymentFrequency;
            const reqPan = this.panDocument!;
            const reqAddress = this.addressDocument!;

            const kycDetails = {
                panNumber: this.panDetails.pan_number || '',
                panName: this.panDetails.name || '',
                panDob: this.panDetails.date_of_birth || '',
                aadhaarReferenceId: this.aadhaarDetails.reference_id?.toString() || '',
                aadhaarName: this.aadhaarDetails.name || '',
                aadhaarGender: this.aadhaarDetails.gender || '',
                aadhaarDob: this.aadhaarDetails.date_of_birth || '',
                aadhaarAddress: this.aadhaarDetails.full_address || '',
                aadhaarPhotoBase64: this.aadhaarDetails.photo || ''
            };

            this.policyRequestService.createRequest(
                reqPlanId,
                reqDuration,
                reqFrequency,
                reqPan,
                reqAddress,
                JSON.stringify(kycDetails)
            ).subscribe({
                next: (request: PolicyRequest) => {
                    this.createdRequest = request;
                    this.selectedPlan = null;
                    this.resetKycState();
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
                this.toastService.error('Please complete KYC Verification first.');
            }
        }
    }

    closeSuccessDialog() {
        this.successDialogVisible = false;
        this.createdRequest = null;
        this.router.navigate(['/customer/my-policy-requests']);
    }

    // Helper to get formatted Aadhaar Photo
    get aadhaarPhotoSrc(): string | null {
        if (this.aadhaarDetails && this.aadhaarDetails.photo) {
            const raw = this.aadhaarDetails.photo;
            if (raw.startsWith('data:image')) return raw;
            return `data:image/jpeg;base64,${raw}`;
        }
        return null;
    }
}
