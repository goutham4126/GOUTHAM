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
    decimal BasePremiumAmount,
    decimal CoverageAmount,
    decimal FinalPremiumAmount,
    string PlanType,
    string PlanDescription,
    string PanDocumentUrl,
    string AddressProofUrl,
    string Status,
    string? RejectionReason,
    DateTime CreatedAt,
    DateTime? ReviewedAt,
    string? Remarks,
    KycDetailsDto? KycDetails
);
