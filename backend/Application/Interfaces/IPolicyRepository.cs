using Domain.Entities;

namespace Application.Interfaces
{
    public interface IPolicyRepository
    {
        Task<Policy?> GetByIdAsync(Guid id);
        Task<List<Policy>> GetByUserIdAsync(Guid userId);
        Task AddAsync(Policy policy);
        Task UpdateAsync(Policy policy);
    }
}