namespace Application.DTOs.Insurance;

public record CreateClaimRequest(
    Guid PolicyId,
    string Reason,
    decimal Amount,
    string DocumentUrl,
    string DocumentHash,
    double? IncidentLatitude,
    double? IncidentLongitude
);