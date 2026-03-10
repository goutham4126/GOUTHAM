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
            string documentHash
        );
        Task ApproveClaimAsync(Guid claimId, decimal approvedAmount, Guid officerId, string? remarks);
        Task RejectClaimAsync(Guid claimId, Guid officerId, string? remarks);
        Task<List<ClaimDto>> GetAssignedClaimsAsync(Guid officerId);
        Task<List<ClaimDto>> GetUserClaimsAsync(Guid userId);
        Task<List<ClaimDto>> GetAllClaimsAsync();
    }
}