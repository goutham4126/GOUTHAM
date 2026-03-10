export interface ClaimDto {
    id: string; // Guid
    reason: string;
    claimAmount: number;
    approvedAmount?: number;
    status: string;
    submittedAt: string; // DateTime
    processedAt?: string; // DateTime
    customerName: string;
    claimOfficerName?: string;
    documentUrl?: string;
    documentHash?: string;
    policyId: string;
    remarks?: string;
    scheduledVideoCallDate?: string;
    videoVerificationStatus: string;
    videoVerificationRemarks?: string;
}

export interface CreateClaimRequest {
    policyId: string;
    reason: string;
    claimAmount: number;
    documentUrl?: string; // Mock upload
}

export interface ApproveClaimRequest {
    approvedAmount: number;
    notes?: string;
    remarks?: string;
}

export interface RejectClaimRequest {
    remarks?: string;
}
