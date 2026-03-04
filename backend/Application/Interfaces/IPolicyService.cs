using Application.DTOs.Insurance;
using Domain.Entities;

namespace Application.Interfaces
{
    public interface IPolicyService
    {
        Task<PolicyDto> PurchasePolicyAsync(Guid userId, Guid requestId);
        Task MarkPaymentAsPaidAsync(Guid paymentId, Guid userId);

        Task<List<PolicyDto>> GetAssignedPoliciesAsync(Guid agentId);
        Task<List<PolicyDto>> GetUserPoliciesAsync(Guid userId);
        Task<PolicyDto?> GetPolicyAsync(Guid policyId, Guid userId, string userRole);
        Task<List<PolicyDto>> GetAllPoliciesAsync();
    }
}