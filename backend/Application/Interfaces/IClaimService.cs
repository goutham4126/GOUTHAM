using Application.DTOs.Insurance;
using Domain.Entities;

namespace Application.Interfaces
{
    public interface IClaimService
    {
        Task<ClaimDto> CreateClaimAsync(
            Guid userId,
            Guid policyId,
            string reason,
            decimal amount,
            string documentUrl,
            string documentHash,
            double? incidentLatitude,
            double? incidentLongitude,
            DateTime? incidentDate
        );
        Task ApproveClaimAsync(Guid claimId, decimal approvedAmount, Guid officerId, string? remarks);
        Task RejectClaimAsync(Guid claimId, Guid officerId, string? remarks);
        Task<List<ClaimDto>> GetAssignedClaimsAsync(Guid officerId);
        Task<List<ClaimDto>> GetUserClaimsAsync(Guid userId);
        Task<List<ClaimDto>> GetAllClaimsAsync();
        Task ScheduleVideoCallAsync(Guid claimId, Guid officerId, DateTime scheduledDate);
        Task CompleteVideoVerificationAsync(Guid claimId, Guid officerId, string? remarks);
        Task<ClaimTrackingStageDto> AddTrackingStageAsync(Guid claimId, Guid officerId, AddClaimTrackingRequest request);
    }
}