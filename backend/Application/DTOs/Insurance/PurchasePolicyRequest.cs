using Domain.Enums;

namespace Application.DTOs.Insurance;

public record PurchasePolicyRequest(
    Guid PlanId,
    int DurationInYears,
    PaymentFrequency PaymentFrequency
);
