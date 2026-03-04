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
  panDocumentUrl: string;
  addressProofUrl: string;
  status: string;
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
}
