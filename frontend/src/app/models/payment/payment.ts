export interface PolicyPaymentDto {
    id: string; // Guid
    amount: number;
    dueDate: string; // DateTime
    paidDate?: string; // DateTime
    status: string;
}

export interface PayPolicyRequest {
    paymentId: string;
}
