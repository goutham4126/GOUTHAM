export interface PlanDto {
    id: string; // Guid
    name: string;
    description: string;
    benefits: string;
    premiumAmount: number;
    coverageAmount: number;
    durationInMonths: number;
    paymentFrequency: string;
    planType: string;
    isActive?: boolean;
}

export interface CreatePlanDto {
    name: string;
    description: string;
    benefits: string;
    premiumAmount: number;
    coverageAmount: number;
    durationInMonths: number;
    paymentFrequency: string;
    planType: string;
}
