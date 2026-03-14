using Application.DTOs.Insurance.Ambee;

namespace Application.Interfaces;

public interface IGeoVerificationService
{
    Task<AmbeeHistoryResponse> GetDisasterHistoryAsync();
    Task<VerificationResultDto> VerifyClaimAsync(Guid claimId);
}

public class VerificationResultDto
{
    public bool IsVerified { get; set; }
    public double ConfidenceScore { get; set; }
    public List<string> MatchingDisasters { get; set; } = new();
    public int NearbyClaimsCount { get; set; }
    public bool RiskFlag { get; set; }
    public string Message { get; set; } = string.Empty;
}
