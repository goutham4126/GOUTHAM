import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PolicyRequestService } from '../../../services/policy-request/policy-request';
import { PolicyRequest } from '../../../models/policy-request/policy-request';
import { ToastService } from '../../../services/toast/toast';

@Component({
    selector: 'app-agent-policy-requests',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './agent-policy-requests.html'
})
export class AgentPolicyRequests implements OnInit {
    public policyRequestService = inject(PolicyRequestService);
    public toastService = inject(ToastService);
    private cdr = inject(ChangeDetectorRef);

    requests: PolicyRequest[] = [];
    loading = true;

    // Rejection Modal State
    selectedRequest: PolicyRequest | null = null;
    rejectionReason: string = '';
    isRejecting = false;
    isApproving = false;

    ngOnInit() {
        this.loadRequests();
    }

    loadRequests() {
        this.loading = true;
        this.policyRequestService.getAssignedRequests().subscribe({
            next: (data) => {
                this.requests = data;
                this.loading = false;
                this.cdr.markForCheck();
            },
            error: (err) => {
                console.error('Error fetching assigned requests', err);
                this.toastService.error('Failed to load assigned policy requests.');
                this.loading = false;
                this.cdr.markForCheck();
            }
        });
    }

    approveRequest(req: PolicyRequest) {
        if (confirm(`Are you sure you want to approve the request for ${req.customerName}?`)) {
            this.isApproving = true;
            this.policyRequestService.approveRequest(req.id).subscribe({
                next: () => {
                    this.toastService.success('Request approved successfully.');
                    this.isApproving = false;
                    this.cdr.markForCheck();
                    this.loadRequests();
                },
                error: (err) => {
                    console.error(err);
                    this.toastService.error('Failed to approve request.');
                    this.isApproving = false;
                    this.cdr.markForCheck();
                }
            });
        }
    }

    promptReject(req: PolicyRequest) {
        this.selectedRequest = req;
        this.rejectionReason = '';
    }

    cancelReject() {
        this.selectedRequest = null;
        this.rejectionReason = '';
    }

    confirmReject() {
        if (this.selectedRequest && this.rejectionReason.trim()) {
            this.isRejecting = true;
            this.policyRequestService.rejectRequest(this.selectedRequest.id, this.rejectionReason).subscribe({
                next: () => {
                    this.toastService.success('Request rejected.');
                    this.isRejecting = false;
                    this.selectedRequest = null;
                    this.cdr.markForCheck();
                    this.loadRequests();
                },
                error: (err) => {
                    console.error(err);
                    this.toastService.error('Failed to reject request.');
                    this.isRejecting = false;
                    this.cdr.markForCheck();
                }
            });
        } else {
            this.toastService.error('Please provide a rejection reason.');
        }
    }

    getRiskScoreClass(score: number): string {
        if (score <= 35) return 'text-green-700 bg-green-100 border-green-200';
        if (score <= 60) return 'text-yellow-700 bg-yellow-100 border-yellow-200';
        if (score <= 80) return 'text-orange-700 bg-orange-100 border-orange-200';
        return 'text-red-700 bg-red-100 border-red-200';
    }

    async openDocument(event: Event, url: string) {
        event.preventDefault();

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const blob = await response.blob();
            const objectUrl = window.URL.createObjectURL(blob);
            window.open(objectUrl, '_blank');
        } catch (error) {
            console.error('Error fetching document:', error);
            // Fallback: If we can't fetch it (e.g. CORS), just open the URL directly
            window.open(url, '_blank');
        }
    }
}
