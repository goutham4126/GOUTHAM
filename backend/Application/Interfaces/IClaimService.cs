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
            string blockchainTxHash
        );
        Task ApproveClaimAsync(Guid claimId, decimal approvedAmount);
        Task RejectClaimAsync(Guid claimId);
        Task<List<ClaimDto>> GetAssignedClaimsAsync(Guid officerId);
        Task<List<ClaimDto>> GetUserClaimsAsync(Guid userId);
        Task<List<ClaimDto>> GetAllClaimsAsync();
    }
}