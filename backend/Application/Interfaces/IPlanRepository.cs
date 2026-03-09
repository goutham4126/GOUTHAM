using Domain.Entities;

namespace Application.Interfaces
{
    public interface IPlanRepository
    {
        Task<List<Plan>> GetAllAsync(bool includeInactive = false);
        Task<Plan?> GetByIdAsync(Guid id);
        Task AddAsync(Plan plan);
        Task UpdateAsync(Plan plan);
        Task DeleteAsync(Plan plan);
    }
}