using Domain.Entities;

namespace Application.Interfaces
{
    public interface IPlanService
    {
        Task<List<Plan>> GetAllAsync();
        Task<Plan?> GetByIdAsync(Guid id);
        Task<Plan> CreateAsync(Plan plan);
        Task UpdateAsync(Guid id, Plan updatedPlan);
        Task DeleteAsync(Guid id);
    }
}