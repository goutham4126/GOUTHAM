namespace Application.DTOs.Insurance;

public record PolicyDto(
    Guid Id,
    DateTime StartDate,
    DateTime EndDate,
    string Status,
    decimal TotalPremium,
    decimal TotalPaid,
    PlanDto Plan,
    string CustomerName,
    string? AgentName,
    List<PolicyPaymentDto> Payments
);