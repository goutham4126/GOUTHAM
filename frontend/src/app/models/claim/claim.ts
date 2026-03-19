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
    incidentLatitude?: number;
    incidentLongitude?: number;
    incidentDate?: string;
    customerEmail?: string;
    customerPhone?: string;
    customerAddress?: string;
    panNumber?: string;
    panName?: string;
    aadhaarReferenceId?: string;
    aadhaarName?: string;
    aadhaarAddress?: string;
    customerDateOfBirth?: string;
    customerProfileImageUrl?: string;
    trackingStages?: ClaimTrackingStageDto[];
}

export interface ClaimTrackingStageDto {
    id: string; // Guid
    claimId: string; // Guid
    stageName: string;
    remarks?: string;
    createdAt: string; // DateTime
}

export interface AddClaimTrackingRequest {
    stageName: string;
    remarks?: string;
}

export interface CreateClaimRequest {
    policyId: string;
    reason: string;
    claimAmount: number;
    documentUrl?: string; // Mock upload
    incidentLatitude?: number;
    incidentLongitude?: number;
    incidentDate?: string;
}

export interface ApproveClaimRequest {
    approvedAmount: number;
    notes?: string;
    remarks?: string;
}

export interface RejectClaimRequest {
    remarks?: string;
}
