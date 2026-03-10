using Application.DTOs.Insurance;
using Domain.Enums;

namespace Application.Interfaces
{
    public interface IPolicyRequestService
    {
        Task<PolicyRequestDto> CreatePolicyRequestAsync(Guid userId, Guid planId, int durationMonths, PaymentFrequency paymentFrequency, byte[] panFileBytes, string panFileName, byte[] addressFileBytes, string addressFileName);
        Task<List<PolicyRequestDto>> GetUserRequestsAsync(Guid userId);
        Task<List<PolicyRequestDto>> GetAgentRequestsAsync(Guid agentId);
        Task<PolicyRequestDto> ApproveRequestAsync(Guid requestId, Guid agentId, string? remarks);
        Task<PolicyRequestDto> RejectRequestAsync(Guid requestId, Guid agentId, string reason, string? remarks);
    }
}
