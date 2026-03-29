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

        public async Task<List<Plan>> GetAllAsync(bool includeInactive = false)
        {
            var query = _context.Plans.AsQueryable();
            if (!includeInactive)
            {
                query = query.Where(p => p.IsActive);
            }
            return await query.ToListAsync();
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

        public async Task DeactivateAsync(Plan plan)
        {
            plan.IsActive = false;
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Plan plan)
        {
            _context.Plans.Remove(plan);
            await _context.SaveChangesAsync();
        }
    }
}