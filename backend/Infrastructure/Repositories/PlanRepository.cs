using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class PlanRepository : IPlanRepository
    {
        private readonly AppDbContext _context;

        public PlanRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Plan>> GetAllAsync()
        {
            return await _context.Plans
                .Where(p => p.IsActive)
                .ToListAsync();
        }

        public async Task<Plan?> GetByIdAsync(Guid id)
        {
            return await _context.Plans
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task AddAsync(Plan plan)
        {
            await _context.Plans.AddAsync(plan);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Plan plan)
        {
            _context.Plans.Update(plan);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Plan plan)
        {
            plan.IsActive = false;
            await _context.SaveChangesAsync();
        }
    }
}