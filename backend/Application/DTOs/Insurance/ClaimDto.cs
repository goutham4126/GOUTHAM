namespace Application.DTOs.Insurance;

public record ClaimDto(
    Guid Id,
    string Reason,
    decimal ClaimAmount,
    decimal? ApprovedAmount,
    string Status,
    DateTime SubmittedAt,
    DateTime? ProcessedAt,
    string CustomerName,
    string? ClaimOfficerName,
    string? DocumentUrl,
    string? DocumentHash,
    string? BlockchainTxHash
);