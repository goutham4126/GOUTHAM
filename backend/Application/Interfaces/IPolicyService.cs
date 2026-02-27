using Application.DTOs.Insurance;
using Domain.Entities;

namespace Application.Interfaces
{
    public interface IPolicyService
    {
        Task<Policy> PurchasePolicyAsync(Guid userId, Guid planId);
        Task MarkPaymentAsPaidAsync(Guid paymentId);

        Task<List<PolicyDto>> GetAssignedPoliciesAsync(Guid agentId);
        Task<List<PolicyDto>> GetUserPoliciesAsync(Guid userId);
        Task<PolicyDto?> GetPolicyAsync(Guid policyId);
    }
}