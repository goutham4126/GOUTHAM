export interface Invoice {
    id: string;
    referenceId: string;
    type: 'PolicyPurchase' | 'ClaimStatus' | 'Payment';
    fileUrl: string;
    createdAt: string;
}
