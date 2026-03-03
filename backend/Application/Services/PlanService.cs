using Application.Interfaces;
using Application.DTOs.Insurance;
using Domain.Entities;

namespace Application.Services
{
    public class PlanService : IPlanService
    {
        private readonly IPlanRepository _repository;

        public PlanService(IPlanRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<PlanDto>> GetAllAsync()
        {
            var plans = await _repository.GetAllAsync();
            return plans.Select(MapToDto).ToList();
        }

        public async Task<PlanDto?> GetByIdAsync(Guid id)
        {
            var plan = await _repository.GetByIdAsync(id);
            return plan == null ? null : MapToDto(plan);
        }

        public async Task<PlanDto> CreateAsync(CreatePlanDto dto)
        {
            var plan = new Plan
            {
                Name = dto.Name,
                Description = dto.Description,
                PremiumAmount = dto.PremiumAmount,
                CoverageAmount = dto.CoverageAmount,
                DurationInMonths = dto.DurationInMonths,
                PaymentFrequency = dto.PaymentFrequency,
                PlanType = dto.PlanType
            };

            await _repository.AddAsync(plan);
            return MapToDto(plan);
        }

        public async Task UpdateAsync(Guid id, CreatePlanDto dto)
        {
            var existing = await _repository.GetByIdAsync(id)
                ?? throw new Exception("Plan not found");

            existing.Name = dto.Name;
            existing.Description = dto.Description;
            existing.PremiumAmount = dto.PremiumAmount;
            existing.CoverageAmount = dto.CoverageAmount;
            existing.DurationInMonths = dto.DurationInMonths;
            existing.PaymentFrequency = dto.PaymentFrequency;
            existing.PlanType = dto.PlanType;

            await _repository.UpdateAsync(existing);
        }

        public async Task DeleteAsync(Guid id)
        {
            var plan = await _repository.GetByIdAsync(id)
                ?? throw new Exception("Plan not found");

            await _repository.DeleteAsync(plan);
        }

        private static PlanDto MapToDto(Plan plan)
        {
            return new PlanDto(
                plan.Id,
                plan.Name,
                plan.Description,
                plan.PremiumAmount,
                plan.CoverageAmount,
                plan.DurationInMonths,
                plan.PaymentFrequency,
                plan.PlanType
            );
        }
    }
}
