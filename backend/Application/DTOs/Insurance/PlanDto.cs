namespace Application.DTOs.Insurance;

public record PlanDto(
    Guid Id,
    string Name,
    string Description,
    string Benefits,
    decimal PremiumAmount,
    decimal CoverageAmount,
    int DurationInMonths,
    string PaymentFrequency,
    string PlanType,
    bool IsActive
);