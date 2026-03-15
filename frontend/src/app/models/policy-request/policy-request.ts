export interface PolicyRequest {
  id: string;
  planId: string;
  planName: string;
  userId: string;
  customerName: string;
  agentId?: string;
  agentName?: string;
  durationInMonths: number;
  paymentFrequency: string;
  riskScore: number;
  basePremiumAmount: number;
  coverageAmount: number;
  finalPremiumAmount: number;
  planType: string;
  planDescription: string;
  panDocumentUrl: string;
  addressProofUrl: string;
  status: string;
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
  remarks?: string;
  kycDetails?: KycDetailsDto;
}

export interface KycDetailsDto {
  id: string;
  userId: string;
  panNumber: string;
  panName?: string;
  panDob?: string;
  aadhaarReferenceId: string;
  aadhaarName?: string;
  aadhaarGender?: string;
  aadhaarDob?: string;
  aadhaarAddress?: string;
  aadhaarPhotoBase64?: string;
  verifiedAt: string;
}
