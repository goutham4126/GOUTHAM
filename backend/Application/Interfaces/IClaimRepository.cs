using Domain.Entities;

namespace Application.Interfaces
{
    public interface IClaimRepository
    {
        Task<Claim?> GetByIdAsync(Guid id);
        Task<List<Claim>> GetByUserIdAsync(Guid userId);
        Task<List<Claim>> GetAllAsync();
        Task AddAsync(Claim claim);
        Task UpdateAsync(Claim claim);
    }
}