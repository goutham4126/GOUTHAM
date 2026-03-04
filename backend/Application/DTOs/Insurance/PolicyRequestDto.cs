using Domain.Enums;

namespace Application.DTOs.Insurance;

public record PolicyRequestDto(
    Guid Id,
    Guid PlanId,
    string PlanName,
    Guid UserId,
    string CustomerName,
    Guid? AgentId,
    string? AgentName,
    int DurationInMonths,
    string PaymentFrequency,
    decimal RiskScore,
    string PanDocumentUrl,
    string AddressProofUrl,
    string Status,
    string? RejectionReason,
    DateTime CreatedAt,
    DateTime? ReviewedAt
);
