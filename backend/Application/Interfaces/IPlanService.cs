using Application.DTOs.Insurance;

namespace Application.Interfaces
{
    public interface IPlanService
    {
        Task<List<PlanDto>> GetAllAsync();
        Task<PlanDto?> GetByIdAsync(Guid id);
        Task<PlanDto> CreateAsync(CreatePlanDto dto);
        Task UpdateAsync(Guid id, CreatePlanDto dto);
        Task DeleteAsync(Guid id);
    }
}