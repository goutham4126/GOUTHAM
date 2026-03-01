namespace Application.DTOs.Insurance;

public record CreatePlanDto(
    string Name,
    string Description,
    decimal PremiumAmount,
    decimal CoverageAmount,
    int DurationInMonths,
    string PaymentFrequency,
    string PlanType
);
