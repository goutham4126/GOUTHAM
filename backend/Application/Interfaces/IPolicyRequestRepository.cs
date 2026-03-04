using Domain.Entities;

namespace Application.Interfaces
{
    public interface IPolicyRequestRepository
    {
        Task<PolicyRequest?> GetByIdAsync(Guid id);
        Task<List<PolicyRequest>> GetByUserIdAsync(Guid userId);
        Task<List<PolicyRequest>> GetByAgentIdAsync(Guid agentId);
        Task AddAsync(PolicyRequest request);
        Task UpdateAsync(PolicyRequest request);
    }
}
