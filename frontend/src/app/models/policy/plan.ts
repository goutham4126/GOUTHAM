export interface PlanDto {
    id: string; // Guid
    name: string;
    description: string;
    premiumAmount: number;
    coverageAmount: number;
    durationInMonths: number;
    paymentFrequency: string;
    planType: string;
}

export interface CreatePlanDto {
    name: string;
    description: string;
    premiumAmount: number;
    coverageAmount: number;
    durationInMonths: number;
    paymentFrequency: string;
    planType: string;
}
