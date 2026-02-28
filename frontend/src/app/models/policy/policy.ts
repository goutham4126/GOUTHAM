import { PlanDto } from './plan';
import { PolicyPaymentDto } from '../payment/payment';

export interface PolicyDto {
    id: string; // Guid
    startDate: string; // DateTime
    endDate: string; // DateTime
    durationInMonths: number;
    paymentFrequency: string;
    status: string;
    totalPremium: number;
    totalPaid: number;
    plan: PlanDto;
    customerName: string;
    agentName?: string;
    payments: PolicyPaymentDto[];
}

export interface PurchasePolicyRequest {
    planId: string;
    durationInYears: number;
    paymentFrequency: number; // 0=Monthly, 1=Quarterly, 2=Yearly
}
