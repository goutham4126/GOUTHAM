using Application.Interfaces;
using Domain.Entities;

namespace Infrastructure.Services
{
    public class PlanService : IPlanService
    {
        private readonly IPlanRepository _repository;

        public PlanService(IPlanRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<Plan>> GetAllAsync()
            => await _repository.GetAllAsync();

        public async Task<Plan?> GetByIdAsync(Guid id)
            => await _repository.GetByIdAsync(id);

        public async Task<Plan> CreateAsync(Plan plan)
        {
            await _repository.AddAsync(plan);
            return plan;
        }

        public async Task UpdateAsync(Guid id, Plan updatedPlan)
        {
            var existing = await _repository.GetByIdAsync(id)
                ?? throw new Exception("Plan not found");

            existing.Name = updatedPlan.Name;
            existing.Description = updatedPlan.Description;
            existing.PremiumAmount = updatedPlan.PremiumAmount;
            existing.CoverageAmount = updatedPlan.CoverageAmount;
            existing.DurationInMonths = updatedPlan.DurationInMonths;
            existing.PaymentFrequency = updatedPlan.PaymentFrequency;

            await _repository.UpdateAsync(existing);
        }

        public async Task DeleteAsync(Guid id)
        {
            var plan = await _repository.GetByIdAsync(id)
                ?? throw new Exception("Plan not found");

            await _repository.DeleteAsync(plan);
        }
    }
}