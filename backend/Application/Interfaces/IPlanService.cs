using Application.DTOs.Insurance;

namespace Application.Interfaces
{
    public interface IPlanService
    {
        Task<List<PlanDto>> GetAllAsync(bool includeInactive = false);
        Task<PlanDto?> GetByIdAsync(Guid id);
        Task<PlanDto> CreateAsync(CreatePlanDto dto);
        Task UpdateAsync(Guid id, CreatePlanDto dto);
        Task DeactivateAsync(Guid id);
        Task DeleteAsync(Guid id);
        Task ResumeAsync(Guid id);
    }
}